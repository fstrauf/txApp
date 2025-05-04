'use client';

import React, { useState, ChangeEvent, FormEvent, Fragment, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Combobox, Label, Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { Loader2, Check, ChevronsUpDown, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { CsvImportProfile } from '@/app/api/import-profiles/route';
import { toast } from 'react-hot-toast'; // Import toast
import FileUploadSection from './components/FileUploadSection'; // Import the new component
import SaveProfilePrompt from './components/SaveProfilePrompt'; // Import the new component
import CategoryMappingSection from './components/CategoryMappingSection'; // Import the new component
import ConfigurationSection from './components/ConfigurationSection'; // Import the new component
import { parse } from 'date-fns'; // Import parse from date-fns
import ReviewStep from './components/ReviewStep'; // Import the new component

// Add imports for category-related API calls and types
import { eq } from 'drizzle-orm'; // Assuming this might be needed if API functions are moved

// --- API Interaction Functions (defined *outside* the component) ---

export interface BankAccountsApiResponse {
    bankAccounts: BankAccount[];
}

interface CreateBankAccountApiResponse {
    bankAccount: BankAccount;
    error?: string;
}

interface AnalyzeApiResponse extends AnalysisResult {
    error?: string;
}

interface ImportApiResponse {
    message: string;
    error?: string;
    details?: any;
    successCount?: number; // Add successCount
    skippedCount?: number; // Add skippedCount
    errors?: { row: number; message: string }[]; // Add errors
    duplicates?: { row: number; data: any }[]; // Add duplicates
}

const fetchBankAccounts = async (): Promise<BankAccount[]> => {
    const response = await fetch('/api/bank-accounts');
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch bank accounts' }));
        throw new Error(errorData.error || `Failed to fetch bank accounts (${response.status})`);
    }
    const data: BankAccountsApiResponse = await response.json();
    return data.bankAccounts || [];
};

export const analyzeFile = async (file: File): Promise<AnalysisResult> => {
    const fileText = await file.text();
    let headers: string[] = [];
    let previewRows: any[] = [];
    let rowCount = 0;
    const PREVIEW_ROW_COUNT = 5;
    let potentialCategoryHeader: string | undefined = undefined;
    let allCsvCategoriesSet = new Set<string>();

    // First pass: Get headers, preview, detect delimiter, and identify potential category header
    try {
        Papa.parse(fileText, {
            header: true, skipEmptyLines: true, preview: PREVIEW_ROW_COUNT,
            step: (results, parser) => {
                const rowData = results.data as Record<string, any>; // Type assertion
                if (rowCount === 0) {
                    headers = results.meta.fields || [];
                    // Simple auto-detection for category header during preview parse
                    potentialCategoryHeader = headers.find(h => h.toLowerCase().includes('category') || h.toLowerCase().includes('cat'));
                    console.log("Potential category header found during preview:", potentialCategoryHeader);
                }
                if (rowCount < PREVIEW_ROW_COUNT) {
                    previewRows.push(rowData);
                }
                 // If we found a category header, extract from preview rows too
                 if (potentialCategoryHeader && rowData[potentialCategoryHeader]) {
                     const categoryString = String(rowData[potentialCategoryHeader]).trim();
                     if (categoryString) allCsvCategoriesSet.add(categoryString);
                 }
                rowCount++;
            },
            complete: () => {},
            error: (error: Error) => { throw new Error('Failed to parse CSV preview: ' + error.message); }
        });
    } catch (e) {
         console.error("Error during preview parsing:", e);
         throw e; // Re-throw error
     }

    // Second pass (Optional - only if category header found): Parse *just* the category column for all unique values
    if (potentialCategoryHeader) {
        console.log(`Performing full parse for category column: '${potentialCategoryHeader}'`);
         try {
             Papa.parse(fileText, {
                 header: true,
                 skipEmptyLines: true,
                 step: (results) => {
                     const rowData = results.data as Record<string, any>; // Type assertion
                     const categoryValue = rowData[potentialCategoryHeader!];
                     if (categoryValue !== undefined && categoryValue !== null) {
                         const categoryString = String(categoryValue).trim();
                         if (categoryString) {
                             allCsvCategoriesSet.add(categoryString);
                         }
                     }
                 },
                 complete: () => {
                     console.log(`Full parse complete. Found ${allCsvCategoriesSet.size} unique category values.`);
                 },
                 error: (catParseError: Error) => {
                     console.error('Error during full category parsing:', catParseError);
                 }
             });
         } catch (catParseError) {
             console.error("Error during full category parsing:", catParseError);
         }
     }

    const result: AnalysisResult = {
        headers,
        previewRows,
        detectedDelimiter: Papa.parse(fileText, { preview: 1 }).meta.delimiter || ',',
        allCsvCategories: Array.from(allCsvCategoriesSet)
    };

    return result;
};

const createBankAccount = async (name: string): Promise<BankAccount> => {
    const response = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    const result: CreateBankAccountApiResponse = await response.json();
    if (!response.ok) {
        throw new Error(result.error || 'Failed to create bank account');
    }
    return result.bankAccount;
};

const importTransactions = async ({ file, config }: { file: File, config: ImportConfig }): Promise<ImportApiResponse> => {
    const importData = new FormData();
    importData.append('file', file);
    importData.append('config', JSON.stringify(config));

    const response = await fetch('/api/transactions/import', {
        method: 'POST',
        body: importData,
    });
    const result: ImportApiResponse = await response.json();
     if (!response.ok) {
        const errorDetails = result.details ? ` Details: ${JSON.stringify(result.details)}` : '';
        throw new Error(result.error || 'Import failed' + errorDetails);
    }
    return result;
};

// --- Add API functions for categories ---

interface Category {
    id: string;
    name: string;
}

interface CategoriesApiResponse {
    categories: Category[];
}

interface CreateCategoryApiResponse {
    category: Category;
    error?: string;
}

// Function to fetch user categories
const fetchUserCategories = async (): Promise<Category[]> => {
    const response = await fetch('/api/categories'); // Assuming this endpoint exists
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch categories' }));
        throw new Error(errorData.error || `Failed to fetch categories (${response.status})`);
    }
    const data: CategoriesApiResponse = await response.json();
    return data.categories || [];
};

// Function to create a category
const createCategory = async (name: string): Promise<Category> => {
    const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }), // Assuming endpoint accepts { name }
    });
    const result: CreateCategoryApiResponse = await response.json();
    if (!response.ok) {
        throw new Error(result.error || 'Failed to create category');
    }
    return result.category;
};

// --- Interfaces & Types ---
export interface BankAccount {
    id: string;
    name: string;
}

export interface AnalysisResult {
    headers: string[];
    previewRows: Record<string, any>[];
    detectedDelimiter: string;
    allCsvCategories?: string[];
}

export type MappedFieldType = 'date' | 'amount' | 'description' | 'description2' | 'currency' | 'category' | 'none';

export interface ImportConfig {
    bankAccountId: string | null;
    mappings: {
        date: string;
        amount: string;
        description: string;
        description2?: string;
        currency?: string;
        category?: string;
    };
    dateFormat: string;
    amountFormat: 'standard' | 'negate' | 'sign_column';
    signColumn?: string;
    skipRows: number;
    delimiter?: string;
}

export type ConfigState = Partial<Omit<ImportConfig, 'mappings' | 'bankAccountId' | 'signColumn' | 'dateFormat' | 'amountFormat'>> & {
    mappings: Record<string, MappedFieldType>;
    signColumn?: string;
    dateFormat: string;
    amountFormat: 'standard' | 'negate' | 'sign_column';
};

// --- Constants ---
export const commonDateFormats = [
    { value: 'yyyy-MM-dd HH:mm:ss', label: 'YYYY-MM-DD HH:MM:SS' },
    { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD' },
    { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY' },
    { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY' },
    { value: 'dd.MM.yyyy', label: 'DD.MM.YYYY' },
    { value: 'yyyy/MM/dd', label: 'YYYY/MM/DD' },
];

export const amountFormatOptions = [
    { value: 'standard', label: 'Standard' },
    { value: 'negate', label: 'Negate all' },
    { value: 'sign_column', label: 'Separate Sign Column' },
];

export const mappingOptions: { value: MappedFieldType; label: string }[] = [
    { value: 'none', label: '- Skip Column -' },
    { value: 'date', label: 'Map to: Date *' },
    { value: 'amount', label: 'Map to: Amount *' },
    { value: 'description', label: 'Map to: Description *' },
    { value: 'description2', label: 'Map to: Description 2' },
    { value: 'currency', label: 'Map to: Currency' },
    { value: 'category', label: 'Map to: Category' },
];

const fetchImportProfiles = async (): Promise<CsvImportProfile[]> => {
    const response = await fetch('/api/import-profiles');
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch profiles' }));
        throw new Error(errorData.error || `Failed to fetch profiles (${response.status})`);
    }
    const data = await response.json();
    return data.profiles || [];
};

interface CreateProfileApiResponse {
    profile: CsvImportProfile;
    error?: string;
}

const createImportProfile = async (profileData: { name: string; config: Omit<CsvImportProfile['config'], 'id'> }): Promise<CsvImportProfile> => {
    const response = await fetch('/api/import-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
    });
    const result: CreateProfileApiResponse = await response.json();
    if (!response.ok) {
        throw new Error(result.error || 'Failed to create profile');
    }
    return result.profile;
};

// Add function to update a profile
interface UpdateProfileApiResponse {
    profile: CsvImportProfile;
    error?: string;
}

const updateImportProfile = async (profileData: { id: string; name: string; config: Omit<CsvImportProfile['config'], 'id'> }): Promise<CsvImportProfile> => {
    const response = await fetch('/api/import-profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
    });
    const result: UpdateProfileApiResponse = await response.json();
    if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
    }
    return result.profile;
};

// --- Component ---
const ImportTransactionsPage: React.FC = () => {
    const { status: sessionStatus } = useSession();
    const queryClient = useQueryClient();

    const [file, setFile] = useState<File | null>(null);
    const [config, setConfig] = useState<ConfigState>({
        mappings: {},
        dateFormat: commonDateFormats[1].value,
        amountFormat: 'standard',
        skipRows: 0,
    });
    const [bankAccountQuery, setBankAccountQuery] = useState('');
    const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);

    // State for Category Mapping
    const [uniqueCsvCategories, setUniqueCsvCategories] = useState<string[]>([]);
    // Mapping state: Key = CSV Category Name, Value = { targetId: ExistingID | '__CREATE__' | null, newName?: string }
    const [categoryMappings, setCategoryMappings] = useState<Record<string, { targetId: string | null | '__CREATE__'; newName?: string }>>({});

    // --- State for managing the UI flow ---
    type ImportStep = 'configure' | 'review' | 'map_categories' | 'submitting';
    const [currentStep, setCurrentStep] = useState<ImportStep>('configure');
    const [validationIssues, setValidationIssues] = useState<{ errors: string[], warnings: string[] }>({ errors: [], warnings: [] });

    const { data: bankAccounts = [], isLoading: isLoadingBankAccounts, error: bankAccountsError } = useQuery<BankAccount[], Error>({
        queryKey: ['bankAccounts'],
        queryFn: fetchBankAccounts,
        enabled: sessionStatus === 'authenticated',
        staleTime: 5 * 60 * 1000,
    });

    // Query to fetch user's categories
    const { data: userCategories = [], isLoading: isLoadingCategories, error: categoriesError } = useQuery<Category[], Error>({
        queryKey: ['userCategories'],
        queryFn: fetchUserCategories,
        enabled: sessionStatus === 'authenticated',
        staleTime: 5 * 60 * 1000,
    });

    // --- State for Profiles ---
    const [selectedProfile, setSelectedProfile] = useState<CsvImportProfile | null>(null);

    // --- State for Post-Import Save Prompt ---
    const [showSaveProfilePrompt, setShowSaveProfilePrompt] = useState(false);
    const [lastSuccessfulConfig, setLastSuccessfulConfig] = useState<Omit<CsvImportProfile['config'], 'id'> | null>(null);
    const [postImportProfileName, setPostImportProfileName] = useState('');
    const [importResults, setImportResults] = useState<ImportApiResponse | null>(null); // Add importResults state
    // New state for dropdown selection: '__CREATE__', '__SKIP__', or profile.id
    const [postImportSaveSelection, setPostImportSaveSelection] = useState<string | null>('__SKIP__'); 

    // --- State for managing the UI flow ---
    const { data: importProfiles = [], isLoading: isLoadingProfiles, error: profilesError } = useQuery<CsvImportProfile[], Error>({
        queryKey: ['importProfiles'],
        queryFn: fetchImportProfiles,
        enabled: sessionStatus === 'authenticated',
        staleTime: 10 * 60 * 1000, // Profiles might change less often
    });

    const analyzeMutation = useMutation<AnalysisResult, Error, File>({
        mutationFn: analyzeFile,
        onSuccess: (result) => {
            console.log("Analysis successful:", result);
            // --- Set Config State (including mappings) ---
             let initialHeaderMappings = result.headers.reduce((acc: Record<string, MappedFieldType>, header: string) => {
                 acc[header] = 'none';
                 const lowerHeader = header.toLowerCase();
                 if (lowerHeader.includes('date') || lowerHeader.includes('created')) acc[header] = 'date';
                 else if (lowerHeader.includes('amount') || lowerHeader.includes('value') || lowerHeader.includes('source amount')) acc[header] = 'amount';
                 else if (lowerHeader.includes('desc') || lowerHeader.includes('payee') || lowerHeader.includes('memo') || lowerHeader.includes('target name') || lowerHeader.includes('reference')) acc[header] = 'description';
                 else if (lowerHeader.includes('currency')) acc[header] = 'currency';
                 else if (lowerHeader.includes('category') || lowerHeader.includes('cat')) acc[header] = 'category';
                 return acc;
             }, {});
             // Apply uniqueness constraints
             const uniqueAutoAssignFields: MappedFieldType[] = ['date', 'amount', 'description', 'currency'];
             uniqueAutoAssignFields.forEach(fieldType => {
                  let foundFirst = false;
                  Object.keys(initialHeaderMappings).forEach(header => {
                      if (initialHeaderMappings[header] === fieldType) {
                          if (foundFirst) initialHeaderMappings[header] = 'none';
                          else foundFirst = true;
                      }
                  });
              });
              // Detect date format
              let detectedDateFormat = commonDateFormats[1].value;
              const dateHeader = Object.keys(initialHeaderMappings).find(h => initialHeaderMappings[h] === 'date');
              if (dateHeader && result.previewRows.length > 0) {
                  const firstDateValue = String(result.previewRows[0][dateHeader] || '');
                  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(firstDateValue)) detectedDateFormat = commonDateFormats[0].value;
                  else if (/^\d{4}-\d{2}-\d{2}$/.test(firstDateValue)) detectedDateFormat = commonDateFormats[1].value;
                  else if (/^\d{2}\/\d{2}\/\d{4}/.test(firstDateValue)) detectedDateFormat = commonDateFormats[2].value;
                  else if (/^\d{2}\/\d{2}\/\d{4}/.test(firstDateValue)) detectedDateFormat = commonDateFormats[3].value;
                  else if (/^\d{2}\.\d{2}\.\d{4}/.test(firstDateValue)) detectedDateFormat = commonDateFormats[4].value;
                  else if (/^\d{4}\/\d{2}\/\d{2}/.test(firstDateValue)) detectedDateFormat = commonDateFormats[5].value;
              }
              // Set the full config state
              setConfig(prev => ({
                 ...prev, // Keep existing like skipRows, amountFormat
                 mappings: initialHeaderMappings,
                 delimiter: result.detectedDelimiter || prev.delimiter,
                 dateFormat: detectedDateFormat
             }));

            // --- Use allCsvCategories from analysis result ---
            const uniqueCats = result.allCsvCategories || []; // Use full list if available
            setUniqueCsvCategories(uniqueCats);
            console.log("Unique CSV Categories Set in State:", uniqueCats);

            // --- Initialize Category Mappings (and pre-map) ---
            const initialCategoryMappings = uniqueCats.reduce((acc, csvCat) => {
                 const existingMatch = userCategories.find(uc => uc.name.toLowerCase() === csvCat.toLowerCase());
                 acc[csvCat] = { targetId: existingMatch ? existingMatch.id : null }; // Default to existing or skip
                 return acc;
            }, {} as typeof categoryMappings);
            setCategoryMappings(initialCategoryMappings);

            // Reset step and other state
            setCurrentStep('configure');
            importMutation.reset();
            createCategoryMutation.reset();
            createAccountMutation.reset();
            setSelectedBankAccount(null);
            setBankAccountQuery("");

            // Reset profile selection on new file analysis
            setSelectedProfile(null);
            // Hide post-import prompt and clear related state
            setShowSaveProfilePrompt(false);
            setLastSuccessfulConfig(null);
            setPostImportProfileName('');
            setPostImportSaveSelection('__SKIP__');
            createProfileMutation.reset(); // Reset any errors from previous post-import save attempts
        },
        onError: (error) => {
             console.error("Analysis Mutation Error:", error);
             setCurrentStep('configure'); // Reset step on error
             // Also hide post-import prompt on analysis error
             setShowSaveProfilePrompt(false);
             setLastSuccessfulConfig(null);
             setPostImportProfileName('');
             setPostImportSaveSelection('__SKIP__');
             createProfileMutation.reset();
        }
    });

    const createAccountMutation = useMutation<BankAccount, Error, string>({
        mutationFn: createBankAccount,
        onSuccess: (newAccount) => {
            console.log("Account creation successful:", newAccount);
            queryClient.setQueryData<BankAccount[]>(['bankAccounts'], (oldData = []) => [...oldData, newAccount]);
            setSelectedBankAccount(newAccount);
            setBankAccountQuery("");
        },
         onError: (error) => {
             console.error("Create Account Mutation Error:", error);
        }
    });

    // Mutation for creating a new category (used in mapping step)
    const createCategoryMutation = useMutation<Category, Error, { csvCategoryName: string; newName: string }>({
        mutationFn: (vars) => createCategory(vars.newName),
        onSuccess: (newCategory, variables) => {
            console.log(`Category '${newCategory.name}' created successfully.`);
            // Update category list cache
            queryClient.setQueryData<Category[]>(['userCategories'], (oldData = []) => {
                // Avoid adding duplicates if somehow created concurrently
                if (oldData.some(cat => cat.id === newCategory.id)) return oldData;
                return [...oldData, newCategory];
            });
            // Update the specific mapping state for the original CSV category name
            setCategoryMappings(prev => ({
                ...prev,
                [variables.csvCategoryName]: { targetId: newCategory.id } // Map to the new ID
            }));
        },
        onError: (error, variables) => {
            console.error(`Failed to create category '${variables.newName}':`, error);
            // Potentially reset the specific mapping back to create/skip, or show error inline
            setCategoryMappings(prev => ({
                ...prev,
                // Reset to allow trying again? Or keep as __CREATE__ with error?
                [variables.csvCategoryName]: { ...prev[variables.csvCategoryName], targetId: '__CREATE__' } // Keep intent to create maybe?
            }));
            // Error should be displayed near the specific mapping input
        }
    });

    // Define mutation with top-level onSuccess/onError, adding originalMappings to variables
    const importMutation = useMutation<ImportApiResponse, Error, {
        file: File;
        config: ImportConfig; // This is { fieldType: header } format for the API
        categoryMappings: typeof categoryMappings;
        originalMappings: Record<string, MappedFieldType>; // This is { header: fieldType } for profile saving
    }>({
        mutationFn: async (vars) => {
            // (This part remains the same - POST to /api/transactions/import)
            const { file, config, categoryMappings } = vars;
            const importData = new FormData();
            importData.append('file', file);
            // API expects config: { fieldType: header }, and categoryMappings separately
            const fullPayload = { config, categoryMappings };
            importData.append('config', JSON.stringify(fullPayload));
            const response = await fetch('/api/transactions/import', { method: 'POST', body: importData });
            const result: ImportApiResponse = await response.json();
            if (!response.ok) throw new Error(result.message || 'Import failed');
            return result;
        },
        onSuccess: (data, variables) => {
            toast.success(`${data.message || 'Import successful!'}`);
            setImportResults(data);

            if ((data.successCount ?? 0) > 0) {
                 // Successfully imported, let's prepare to ask about saving the profile
                 console.log("Import successful, preparing profile save prompt. Variables:", variables);

                 // Construct the config snapshot from the *variables* that were successfully sent
                 // **Use the directly passed originalMappings**
                 const successfulMappingsForProfile = variables.originalMappings;

                 const successfulConfigForProfile: Omit<CsvImportProfile['config'], 'id'> = {
                     mappings: successfulMappingsForProfile, // Use the directly passed { header: fieldType } mappings
                     dateFormat: variables.config.dateFormat,
                     amountFormat: variables.config.amountFormat,
                     signColumn: variables.config.signColumn, // Already correct from variables.config
                     skipRows: variables.config.skipRows,
                     delimiter: variables.config.delimiter,
                     // bankAccountId is handled separately below
                 };

                 // Add bankAccountId if it was selected
                 if (variables.config.bankAccountId) {
                     successfulConfigForProfile.bankAccountId = variables.config.bankAccountId;
                 }

                 console.log("Config used for successful import (for profile save):", successfulConfigForProfile);

                 setLastSuccessfulConfig(successfulConfigForProfile); // Store the config used for this success
                 setShowSaveProfilePrompt(true); // Show the prompt
            } else {
                 // No rows imported (e.g., all duplicates or errors)
                 setLastSuccessfulConfig(null);
                 setShowSaveProfilePrompt(false);
            }
            // Reset form only after handling potential profile save
            // setConfig(initialConfigState);
            // setFile(null);
            // setHeaders([]);
            // setPreviewRows([]);
            // setCategoryMappings({});
            // setStep(3); // Move to results view
        },
        onError: (error) => {
            toast.error(`Import Error: ${error.message}`);
            // Add the required 'message' property when setting results on error
            setImportResults({ 
                message: `Import Error: ${error.message}`, // Add error message
                successCount: 0, 
                skippedCount: 0, 
                errors: [{ row: 0, message: error.message }], 
                duplicates: [] 
            });
            setLastSuccessfulConfig(null);
            setShowSaveProfilePrompt(false);
            // setStep(3); // Removed: Move to results view even on error to show the message
        },
    });

    // Mutation for creating a new profile
    const createProfileMutation = useMutation<CsvImportProfile, Error, { name: string; config: Omit<CsvImportProfile['config'], 'id'> }>({
        mutationFn: createImportProfile,
        onSuccess: (newProfile) => {
            console.log(`Profile '${newProfile.name}' created successfully.`);
            queryClient.setQueryData<CsvImportProfile[]>(['importProfiles'], (oldData = []) => [...oldData, newProfile].sort((a, b) => a.name.localeCompare(b.name)));
            // Hide prompt after successful creation
            setShowSaveProfilePrompt(false);
            setLastSuccessfulConfig(null);
            setPostImportProfileName('');
            setPostImportSaveSelection('__SKIP__'); // Reset selection
        },
        onError: (error) => {
            console.error(`Failed to create profile:`, error);
            // Error will be shown via renderFeedback OR inline in the post-import prompt
        }
    });

    // Add mutation for updating profiles
    const updateProfileMutation = useMutation<CsvImportProfile, Error, { id: string; name: string; config: Omit<CsvImportProfile['config'], 'id'> }>({ 
        mutationFn: updateImportProfile,
        onSuccess: (updatedProfile) => {
             console.log(`Profile '${updatedProfile.name}' updated successfully.`);
             // Update the profile in the cache
             queryClient.setQueryData<CsvImportProfile[]>(['importProfiles'], (oldData = []) => 
                oldData.map(p => p.id === updatedProfile.id ? updatedProfile : p).sort((a, b) => a.name.localeCompare(b.name))
             );
            // Hide prompt after successful update
            setShowSaveProfilePrompt(false);
            setLastSuccessfulConfig(null);
            setPostImportProfileName('');
            setPostImportSaveSelection('__SKIP__'); // Reset selection
        },
        onError: (error) => {
            console.error(`Failed to update profile:`, error);
            // Error should be displayed inline in the prompt
        }
    });

    // --- Effect to apply selected profile ---
    useEffect(() => {
        if (selectedProfile) {
            console.log("Applying selected profile:", selectedProfile.name);
            // Apply profile config to the main config state
            setConfig(prev => ({
                ...prev, // Keep non-profile things like mappings (from analysis) and delimiter (from analysis)
                dateFormat: selectedProfile.config.dateFormat,
                amountFormat: selectedProfile.config.amountFormat,
                signColumn: selectedProfile.config.signColumn,
                skipRows: selectedProfile.config.skipRows,
                // Important: Apply mappings from profile *only if* they exist in the current analyzed headers
                mappings: analyzeMutation.data?.headers.reduce((acc, header) => {
                    // Find if this header was mapped in the saved profile config
                    const profileMappingEntry = Object.entries(selectedProfile.config.mappings)
                                                    .find(([fieldType, mappedHeader]) => mappedHeader === header);
                    
                    // If found, use the fieldType from the profile, otherwise 'none'
                    acc[header] = profileMappingEntry ? profileMappingEntry[0] as MappedFieldType : 'none';
                    return acc;
                }, {} as Record<string, MappedFieldType>) || prev.mappings, // Fallback to existing if no analysis data yet
                delimiter: selectedProfile.config.delimiter || prev.delimiter, // Apply delimiter from profile if set
            }));
        }
    }, [selectedProfile, analyzeMutation.data?.headers, queryClient]); // Rerun when profile or headers change, added queryClient dependency for safety

    const isLoading = sessionStatus === 'loading' ||
                      isLoadingBankAccounts ||
                      isLoadingCategories ||
                      isLoadingProfiles ||
                      analyzeMutation.isPending ||
                      createAccountMutation.isPending ||
                      createCategoryMutation.isPending ||
                      createProfileMutation.isPending ||
                      importMutation.isPending;

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        // Hide prompt and clear state when file changes
        setShowSaveProfilePrompt(false);
        setLastSuccessfulConfig(null);
        setPostImportProfileName('');
        setPostImportSaveSelection('__SKIP__');
        createProfileMutation.reset();
        updateProfileMutation.reset();

        if (selectedFile && sessionStatus === 'authenticated') {
            setFile(selectedFile);
            setSelectedBankAccount(null);
            setBankAccountQuery("");
            importMutation.reset();
            analyzeMutation.mutate(selectedFile);
        } else if (!selectedFile) {
            setFile(null);
            analyzeMutation.reset();
            setSelectedBankAccount(null);
            setBankAccountQuery("");
        } else {
            console.warn("File selected but user not authenticated.");
        }
    };

    const handleConfigChange = <K extends keyof ConfigState>(field: K, value: ConfigState[K] | undefined) => {
        setConfig(prev => {
            const updatedConfig = { ...prev };

            if (field === 'dateFormat' || field === 'amountFormat') {
                if (value !== undefined) {
                     updatedConfig[field] = value as any;
                }
            } else if (field === 'skipRows') {
                updatedConfig[field] = Number(value ?? 0) as any;
            } else {
                 updatedConfig[field] = value as any;
             }

            if (field === 'amountFormat' && value !== 'sign_column') {
                updatedConfig.signColumn = undefined;
            }
            return updatedConfig;
        });
    };

     const handleMappingChange = (csvHeader: string, fieldType: MappedFieldType) => {
        setConfig(prevConfig => {
            const newMappings = { ...prevConfig.mappings };
            // Fields that should only be mapped once
            const uniqueFields: MappedFieldType[] = ['date', 'amount', 'description', 'description2', 'currency']; 

            // If the new fieldType is a unique one (and not 'none')
            if (uniqueFields.includes(fieldType) && fieldType !== 'none') {
                 // Find if another header is already mapped to this fieldType
                 const currentHeaderForField = Object.keys(newMappings).find(
                     header => newMappings[header] === fieldType && header !== csvHeader 
                 );
                 // If found, unmap the old header
                 if (currentHeaderForField) {
                     newMappings[currentHeaderForField] = 'none';
                 }
             }
            // Assign the new mapping
            newMappings[csvHeader] = fieldType;
            return { ...prevConfig, mappings: newMappings };
        });
    };

    // --- Handler to update category mappings state ---
    const handleCategoryMappingChange = (
        csvCategoryName: string,
        update: { targetId: string | null | '__CREATE__'; newName?: string }
    ) => {
        setCategoryMappings(prev => ({
            ...prev,
            [csvCategoryName]: { ...prev[csvCategoryName], ...update } // Merge update
        }));
         // If setting to create, but newName is empty, maybe clear newName to avoid accidental triggers?
        if (update.targetId === '__CREATE__' && !update.newName?.trim()) {
             setCategoryMappings(prev => ({
                 ...prev,
                 [csvCategoryName]: { ...prev[csvCategoryName], newName: '' }
             }));
         }
    };

    // --- Validation Function ---
    const validateConfigurationAndData = (currentConfig: ConfigState, analysisData: AnalysisResult | null, bankAccount: BankAccount | null): { errors: string[], warnings: string[] } => {
        const issues: { errors: string[], warnings: string[] } = { errors: [], warnings: [] };

        if (!analysisData) {
            issues.errors.push("File analysis data is missing.");
            return issues; // Cannot proceed
        }

        if (!bankAccount) {
             issues.errors.push("Please select a target bank account.");
         }

        // Configuration Checks (similar to previous logic)
        let apiMappings: Partial<Record<MappedFieldType, string>> = {};
        let requiredFieldsFound = { date: false, amount: false, description: false };

        for (const header in currentConfig.mappings) {
             const fieldType = currentConfig.mappings[header];
             if (fieldType !== 'none') {
                 if (apiMappings[fieldType]) { // Check if fieldType already mapped
                     // Allow multiple description/description2, but not others
                     if (fieldType !== 'description' && fieldType !== 'description2') {
                          issues.errors.push(`Field '${fieldType}' can only be mapped to one column.`);
                     }
                 } 
                 apiMappings[fieldType] = header;
                 if (requiredFieldsFound.hasOwnProperty(fieldType)) {
                      requiredFieldsFound[fieldType as keyof typeof requiredFieldsFound] = true;
                  }
             }
         }
         if (!requiredFieldsFound.date) issues.errors.push("Map a column to 'date'.");
         if (!requiredFieldsFound.amount) issues.errors.push("Map a column to 'amount'.");
         if (!requiredFieldsFound.description) issues.errors.push("Map a column to 'description'."); // Check for at least one description
         if (currentConfig.amountFormat === 'sign_column' && !currentConfig.signColumn) {
              issues.errors.push("Select the 'Sign Column' when using that Amount Format.");
         }
         if (currentConfig.amountFormat === 'sign_column' && currentConfig.signColumn && !analysisData.headers.includes(currentConfig.signColumn)) {
               issues.errors.push(`Selected Sign Column '${currentConfig.signColumn}' not found in file headers.`);
         }
         if (!currentConfig.dateFormat) issues.errors.push("Select a Date Format.");

        // Sample Data Checks (using preview rows)
        const dateHeader = apiMappings.date;
        const amountHeader = apiMappings.amount;

        if (dateHeader && currentConfig.dateFormat) {
            analysisData.previewRows.slice(0, 3).forEach((row, index) => {
                const dateStr = row[dateHeader];
                if (dateStr) {
                    try {
                        const parsedDate = parse(String(dateStr), currentConfig.dateFormat, new Date());
                        if (isNaN(parsedDate.getTime())) {
                            issues.warnings.push(`Row ${index + 1}: Date '${dateStr}' might not match format '${currentConfig.dateFormat}'.`);
                        }
                    } catch { 
                        issues.warnings.push(`Row ${index + 1}: Could not attempt parsing date '${dateStr}' with format '${currentConfig.dateFormat}'.`);
                    }
                }
            });
        }

        if (amountHeader) {
             analysisData.previewRows.slice(0, 3).forEach((row, index) => {
                const amountRaw = row[amountHeader];
                if (amountRaw !== null && amountRaw !== undefined && amountRaw !== '') {
                    let amountStr = String(amountRaw).replace(/[^0-9.,-]/g, '').replace(',', '.');
                    if (isNaN(parseFloat(amountStr))) {
                         issues.warnings.push(`Row ${index + 1}: Amount '${amountRaw}' does not look like a valid number.`);
                    }
                 } else {
                      issues.warnings.push(`Row ${index + 1}: Amount column seems to contain empty values.`);
                 }
            });
        }

        return issues;
    };

    // --- Function to handle proceeding from Configuration step ---
    const handleValidateAndProceed = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault(); 
        importMutation.reset(); 
        setValidationIssues({ errors: [], warnings: [] }); // Clear previous issues

        const issues = validateConfigurationAndData(config, analyzeMutation.data || null, selectedBankAccount);

        if (issues.errors.length > 0) {
            setValidationIssues(issues);
            setCurrentStep('review'); // Go to review step to show errors
            return;
        }

        // Determine if category mapping is needed (only if validation passed)
        let apiMappings: Partial<Record<MappedFieldType, string>> = {};
        for (const header in config.mappings) {
            const fieldType = config.mappings[header];
            if (fieldType !== 'none') {
                apiMappings[fieldType] = header;
            }
        }
        const categoryHeader = apiMappings.category;
        if (categoryHeader && uniqueCsvCategories.length > 0) {
            console.log("Proceeding to category mapping step.");
            setValidationIssues(issues); // Store warnings even if proceeding
            setCurrentStep('map_categories'); // Set step, wait for user
        } else {
            console.log("Skipping category mapping, proceeding directly to import submission.");
            setValidationIssues(issues); // Store warnings even if proceeding
            // Set step to submitting *before* calling handleSubmit
            setCurrentStep('submitting'); 
            handleSubmit(); // Call the final submit logic directly
        }
    };

    // --- Final Submit Handler --- 
    const handleSubmit = () => {
        // Remove initial check/set for currentStep
        importMutation.reset(); // Reset mutation state before validation

        // Re-run basic validations quickly
         if (!file || !analyzeMutation.data || !selectedBankAccount?.id) {
             importMutation.mutate(undefined as any, { onError: () => {}, onSettled: () => {(importMutation as any)._error = new Error("Missing file, analysis data or bank account.");} });
             // Reset step manually as mutation onError won't fire
             setCurrentStep(config.mappings?.category && uniqueCsvCategories.length > 0 ? 'map_categories' : 'configure');
             return;
         }
         // Repopulate apiMappings
         let apiMappings: { 
            date?: string; amount?: string; description?: string; description2?: string; 
            currency?: string; category?: string 
        } = {};
         for (const header in config.mappings) {
             const fieldType = config.mappings[header];
             if (fieldType !== 'none') {
                 if (!apiMappings[fieldType as keyof typeof apiMappings]) {
                     apiMappings[fieldType as keyof typeof apiMappings] = header;
                 }
             }
         }

        // --- Category Mapping Validation --- 
        let validationErrors: string[] = [];
        const mappedCategoryHeader = apiMappings.category;
        if (mappedCategoryHeader && uniqueCsvCategories.length > 0) {
             for (const csvCat of uniqueCsvCategories) {
                 const mapping = categoryMappings[csvCat];
                 if (!mapping) { // Should not happen
                     validationErrors.push(`Mapping missing for CSV category: ${csvCat}`);
                 } else if (mapping.targetId === '__CREATE__') {
                     const newNameTrimmed = mapping.newName?.trim();
                     if (!newNameTrimmed) {
                         validationErrors.push(`Enter a name for the new category corresponding to '${csvCat}'.`);
                     } else if (userCategories.some(cat => cat.name.toLowerCase() === newNameTrimmed.toLowerCase())) {
                         validationErrors.push(`Category '${newNameTrimmed}' already exists for '${csvCat}'. Please select it.`);
                     } else {
                         // Check for duplicate creation names
                         const createNames = Object.values(categoryMappings).filter(m => m.targetId === '__CREATE__' && m.newName?.trim()).map(m => m.newName!.trim().toLowerCase());
                         const counts = createNames.reduce((acc, name) => { acc[name] = (acc[name] || 0) + 1; return acc; }, {} as Record<string, number>);
                         if (counts[newNameTrimmed.toLowerCase()] > 1) {
                             const errorMsg = `Cannot create the same new category ('${newNameTrimmed}') multiple times.`;
                             if (!validationErrors.includes(errorMsg)) { validationErrors.push(errorMsg); }
                         }
                     }
                 }
             }
        }
        // --- End Category Validation --- 

        if (validationErrors.length > 0) {
            importMutation.mutate(undefined as any, { onError: () => {}, onSettled: () => {(importMutation as any)._error = new Error(`Category Mapping errors: ${validationErrors.join(' ')}`);} });
            setCurrentStep(mappedCategoryHeader && uniqueCsvCategories.length > 0 ? 'map_categories' : 'configure');
            return;
        }

        // Check required apiMappings again before constructing submitConfig
        if (!apiMappings.date || !apiMappings.amount || !apiMappings.description) {
            console.error("handleSubmit validation failed: Required mappings missing.");
            importMutation.mutate(undefined as any, { onError: () => {}, onSettled: () => {(importMutation as any)._error = new Error("Configuration error: Date, Amount, Description mapping lost.");} });
            setCurrentStep('configure');
            return; 
        }

        // --- Actual Submission Logic --- 
        try {
            // Map field types to header names for API
            const submitConfig: ImportConfig = {
                ...config,
                skipRows: config.skipRows ?? 0, // Ensure skipRows is a number
                mappings: {} as ImportConfig['mappings'], // Re-apply type assertion
                bankAccountId: selectedBankAccount?.id === 'none' ? null : selectedBankAccount?.id ?? null, // Fix bank account ID access
            };
            Object.entries(config.mappings).forEach(([header, fieldType]) => {
                if (fieldType !== 'none') {
                    submitConfig.mappings[fieldType as keyof ImportConfig['mappings']] = header;
                }
            });

            // --- Validation ---
            if (!file) {
                 toast.error("Please select a file.");
                 return;
            }
            if (!submitConfig.mappings.date || !submitConfig.mappings.amount || !submitConfig.mappings.description) {
                toast.error("Please map Date, Amount, and Description columns.");
                return;
            }
            // Add validation for description2 if present? No, it's optional.

            // --- Trigger Import ---
            console.log("Calling importMutation.mutate with config:", submitConfig);
            // Pass the original { header: fieldType } mappings explicitly for profile saving
            importMutation.mutate({
                file: file!,
                config: submitConfig, // API needs { fieldType: header } format
                categoryMappings: categoryMappings,
                originalMappings: config.mappings // Pass the component state's { header: fieldType } mappings
            });
            // State reset happens in onSuccess/onError

        } catch (error: any) {
            console.error("Error preparing import:", error);
            toast.error(`Error: ${error.message}`);
        }
    };

    // --- New Handler for Save Button --- 
    const handleSaveNewProfileClick = () => {
        const profileName = postImportProfileName.trim();
        if (!profileName) {
             createProfileMutation.reset();
             updateProfileMutation.reset();
             createProfileMutation.mutate(undefined as any, { onError: () => {}, onSettled: () => {(createProfileMutation as any)._error = new Error("Profile name cannot be empty.");} });
             return;
         }
         if (!lastSuccessfulConfig) { 
             console.error("Cannot save new profile, last successful config is missing.");
             createProfileMutation.reset();
             updateProfileMutation.reset();
             createProfileMutation.mutate(undefined as any, { onError: () => {}, onSettled: () => {(createProfileMutation as any)._error = new Error("Configuration data missing.");} });
             return; 
         }
         createProfileMutation.mutate({ name: profileName, config: lastSuccessfulConfig });
    };

    const filteredBankAccounts =
        bankAccountQuery === ''
        ? bankAccounts
        : bankAccounts.filter((account) =>
            account.name.toLowerCase().includes(bankAccountQuery.toLowerCase())
        );

    const queryMatchesExisting = bankAccounts.some(acc => acc.name.toLowerCase() === bankAccountQuery.toLowerCase());
    const isValidNewName = bankAccountQuery.trim() !== '' && !queryMatchesExisting;

    const getCategoryMappingDisplay = (csvCategoryName: string): string => {
         const mapping = categoryMappings[csvCategoryName];
         if (!mapping) return "Mapping...";
         if (mapping.targetId === null) return "- Skip Category -";
         if (mapping.targetId === '__CREATE__') {
             return mapping.newName?.trim() ? `Create: "${mapping.newName.trim()}"` : "-- Create New Category --";
         }
         const existing = userCategories.find(cat => cat.id === mapping.targetId);
         return existing ? existing.name : "Select Existing...";
     };

    const renderFeedback = () => {
        // Include profile errors in feedback
        const mutationWithError = [analyzeMutation, createAccountMutation, importMutation, createProfileMutation, createCategoryMutation].find(m => m.isError);
        const queryError = bankAccountsError || categoriesError || profilesError; // Include profiles query error
        const error = queryError || mutationWithError?.error;
        const successMessage = importMutation.isSuccess ? (importMutation.data?.message || 'Import successful!') : createProfileMutation.isSuccess ? `Profile '${createProfileMutation.data?.name}' saved!` : null;

        if (error) {
            return (
                <div className="alert-error mb-4">
                     <AlertCircle className="h-5 w-5" />
                    <div>
                        <h5 className="font-bold">Error</h5>
                        <p>{error.message}</p>
                    </div>
                </div>
            );
         }
        if (successMessage) {
             // Use different style for profile success?
             const alertClass = createProfileMutation.isSuccess ? "alert-info mb-4" : "alert-success mb-4";
             return (
                 <div className={alertClass}>
                     <Check className="h-5 w-5" />
                     <div>
                         <h5 className="font-bold">Success</h5>
                         <p>{successMessage}</p>
                     </div>
                 </div>
             );
         }
         return null;
    };

    if (sessionStatus === 'loading') {
        return (
            <div className="container mx-auto p-4 flex justify-center items-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading session...</span>
            </div>
        );
    }

    if (sessionStatus === 'unauthenticated') {
        return (
            <div className="container mx-auto p-4">
                <div className="alert-error">
                    <AlertCircle className="h-5 w-5" />
                    <div>
                        <h5 className="font-bold">Not Authenticated</h5>
                        <p>Please log in to import transactions.</p>
                    </div>
                 </div>
            </div>
        );
    }

    return (
        // Add max-w-7xl to the main container
        <div className="container mx-auto p-4 space-y-6 max-w-7xl">
            <h1 className="text-2xl font-bold">Import Transactions from CSV</h1>
            
            {/* Show general feedback (errors, generic success) */}
            {!showSaveProfilePrompt && renderFeedback()} 
            
            {/* --- Post-Import Save Prompt --- */}
            {showSaveProfilePrompt && (
                <SaveProfilePrompt 
                    lastSuccessfulConfig={lastSuccessfulConfig}
                    importProfiles={importProfiles}
                    onSaveNewProfile={(name) => {
                        if (lastSuccessfulConfig) {
                            createProfileMutation.mutate({ name, config: lastSuccessfulConfig });
                        }
                    }}
                    onUpdateProfile={(profileId) => {
                        const profileToUpdate = importProfiles.find(p => p.id === profileId);
                        if (profileToUpdate && lastSuccessfulConfig) {
                            updateProfileMutation.mutate({
                                id: profileToUpdate.id,
                                name: profileToUpdate.name, // Keep original name for now
                                config: lastSuccessfulConfig
                            });
                        }
                    }}
                    onSkipSave={() => {
                        setShowSaveProfilePrompt(false);
                        setLastSuccessfulConfig(null);
                        // Reset internal state of prompt component handled via prop change/unmount
                    }}
                    isSavingProfile={createProfileMutation.isPending || updateProfileMutation.isPending}
                    saveError={createProfileMutation.error || updateProfileMutation.error || null}
                />
            )}

            {/* --- Step 1: File Upload Section --- */}
            {currentStep !== 'map_categories' && !showSaveProfilePrompt && (
                <FileUploadSection 
                    onFileChange={handleFileChange}
                    isLoading={isLoading}
                    isAnalyzing={analyzeMutation.isPending}
                    fileKey={file ? 'file-loaded' : 'file-empty'} // Pass the key
                />
            )}

            {/* --- Step 2a + 3: Configure & Map Columns --- */}
            {currentStep === 'configure' && analyzeMutation.isSuccess && (
                 <ConfigurationSection 
                     config={config}
                     onConfigChange={handleConfigChange}
                     onMappingChange={handleMappingChange}
                     bankAccounts={bankAccounts}
                     selectedBankAccount={selectedBankAccount}
                     onBankAccountChange={setSelectedBankAccount} // Pass state setter
                     onBankAccountQueryChange={setBankAccountQuery} // Pass state setter
                     bankAccountQuery={bankAccountQuery}
                     onBankAccountCreate={(name) => createAccountMutation.mutate(name)} // Call mutation
                     isCreatingBankAccount={createAccountMutation.isPending}
                     createBankAccountError={createAccountMutation.error || null}
                     importProfiles={importProfiles}
                     selectedProfile={selectedProfile}
                     onProfileChange={setSelectedProfile} // Pass state setter
                     isLoadingProfiles={isLoadingProfiles}
                     analysisResult={analyzeMutation.data} // Pass analysis results (non-null asserted by isSuccess)
                     onProceed={handleValidateAndProceed} // Pass the new handler
                     isLoading={isLoading}
                 />
            )}

            {/* --- Review Step --- */}
            {currentStep === 'review' && (
                <ReviewStep 
                    validationIssues={validationIssues}
                    onBack={() => setCurrentStep('configure')}
                />
            )}

            {/* --- Step 2b: Map Categories --- */}
            {currentStep === 'map_categories' && (
                <CategoryMappingSection 
                    uniqueCsvCategories={uniqueCsvCategories}
                    userCategories={userCategories}
                    categoryMappings={categoryMappings}
                    onCategoryMappingChange={handleCategoryMappingChange} // Pass the existing handler
                    onProceed={handleSubmit} // Directly call final submit
                    onBack={() => setCurrentStep('configure')} // Go back to config
                    isLoading={isLoading}
                    isCreatingCategory={createCategoryMutation.isPending}
                    createCategoryError={createCategoryMutation.error || null}
                />
            )}

            {currentStep === 'submitting' && (
                  <div className="flex justify-center items-center p-4 card-style">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Submitting import...</span>
                  </div>
              )}

        </div>
    );
};

export default ImportTransactionsPage; 