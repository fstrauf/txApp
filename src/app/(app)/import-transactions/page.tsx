'use client';

import React, { useState, ChangeEvent, FormEvent, Fragment } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Combobox, Label, Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { Loader2, Check, ChevronsUpDown, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';

// Add imports for category-related API calls and types
import { eq } from 'drizzle-orm'; // Assuming this might be needed if API functions are moved

// --- API Interaction Functions ---

interface BankAccountsApiResponse {
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

const analyzeFile = async (file: File): Promise<AnalysisResult> => {
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
                 error: (error: Error) => {
                     console.error('Error during full category parse: ' + error.message);
                 }
             });
         } catch (e) {
             console.error("Error during full category parsing:", e);
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
interface BankAccount {
    id: string;
    name: string;
}

interface AnalysisResult {
    headers: string[];
    previewRows: Record<string, any>[];
    detectedDelimiter: string;
    allCsvCategories?: string[];
}

type MappedFieldType = 'date' | 'amount' | 'description' | 'currency' | 'category' | 'none';

interface ImportConfig {
    bankAccountId: string;
    mappings: {
        date: string;
        amount: string;
        description: string;
        currency?: string;
        category?: string;
    };
    dateFormat: string;
    amountFormat: 'standard' | 'negate' | 'sign_column';
    signColumn?: string;
    skipRows: number;
    delimiter?: string;
}

type ConfigState = Partial<Omit<ImportConfig, 'mappings' | 'bankAccountId' | 'signColumn' | 'dateFormat' | 'amountFormat'>> & {
    mappings: Record<string, MappedFieldType>;
    signColumn?: string;
    dateFormat: string;
    amountFormat: 'standard' | 'negate' | 'sign_column';
};

// --- Constants ---
const commonDateFormats = [
    { value: 'yyyy-MM-dd HH:mm:ss', label: 'YYYY-MM-DD HH:MM:SS' },
    { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD' },
    { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY' },
    { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY' },
    { value: 'dd.MM.yyyy', label: 'DD.MM.YYYY' },
    { value: 'yyyy/MM/dd', label: 'YYYY/MM/DD' },
];

const amountFormatOptions = [
    { value: 'standard', label: 'Standard' },
    { value: 'negate', label: 'Negate all' },
    { value: 'sign_column', label: 'Separate Sign Column' },
];

const mappingOptions: { value: MappedFieldType; label: string }[] = [
    { value: 'none', label: '- Skip Column -' },
    { value: 'date', label: 'Map to: Date *' },
    { value: 'amount', label: 'Map to: Amount *' },
    { value: 'description', label: 'Map to: Description *' },
    { value: 'currency', label: 'Map to: Currency' },
    { value: 'category', label: 'Map to: Category' },
];

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
    type ImportStep = 'configure' | 'map_categories' | 'submitting';
    const [currentStep, setCurrentStep] = useState<ImportStep>('configure');

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
        },
        onError: (error) => {
             console.error("Analysis Mutation Error:", error);
             setCurrentStep('configure'); // Reset step on error
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

    const importMutation = useMutation<ImportApiResponse, Error, { file: File; config: ImportConfig; categoryMappings: typeof categoryMappings }>({
        mutationFn: async (vars) => {
            const { file, config, categoryMappings } = vars;
            const importData = new FormData();
            importData.append('file', file);
            // Combine main config and category mappings for the backend
            const fullPayload = { ...config, categoryMappings }; 
            importData.append('config', JSON.stringify(fullPayload));

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
        },
        onSuccess: (data) => {
             console.log("Import successful:", data.message);
             setFile(null);
             analyzeMutation.reset();
             setSelectedBankAccount(null);
             setBankAccountQuery("");
             setConfig({
                mappings: {},
                dateFormat: commonDateFormats[1].value,
                amountFormat: 'standard',
                skipRows: 0,
                signColumn: undefined,
                delimiter: undefined
             });
             // Reset category mapping state as well
             setUniqueCsvCategories([]);
             setCategoryMappings({});
             setCurrentStep('configure'); // Reset step on successful import
        },
        onError: (error) => {
            console.error("Import Mutation Error:", error);
            setCurrentStep('configure'); // Reset step on import error to allow fixes
        }
    });

    const isLoading = sessionStatus === 'loading' ||
                      isLoadingBankAccounts ||
                      isLoadingCategories ||
                      analyzeMutation.isPending ||
                      createAccountMutation.isPending ||
                      createCategoryMutation.isPending ||
                      importMutation.isPending;

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
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
            const uniqueFields: MappedFieldType[] = ['date', 'amount', 'description', 'currency'];

            if (uniqueFields.includes(fieldType) && fieldType !== 'none') {
                 const currentHeaderForField = Object.keys(newMappings).find(
                     header => newMappings[header] === fieldType && header !== csvHeader
                 );
                 if (currentHeaderForField) {
                     newMappings[currentHeaderForField] = 'none';
                 }
             }
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

    // --- Function to proceed from configuration/column mapping step ---
    const handleProceedToCategoryMapping = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault(); // Prevent default form submission if used in a form context later
        setCurrentStep('submitting'); // Indicate processing starts
        importMutation.reset(); // Clear previous import errors before validation

        if (!file || !analyzeMutation.data || !selectedBankAccount?.id) {
            importMutation.mutate(undefined as any, { onError: () => {}, onSettled: () => {(importMutation as any)._error = new Error("Please select a file and bank account.");} });
            setCurrentStep('configure'); // Go back to config step
            return;
        }

        // --- Basic Validation (Pre-Category Mapping) ---
        let apiMappings: { date?: string; amount?: string; description?: string; currency?: string; category?: string } = {};
        let requiredFieldsFound = { date: false, amount: false, description: false };
        let validationErrors: string[] = [];

        for (const header in config.mappings) {
             const fieldType = config.mappings[header];
             if (fieldType !== 'none') {
                 if (apiMappings[fieldType as keyof typeof apiMappings]) {
                     if (['date', 'amount', 'description', 'currency'].includes(fieldType)) {
                         validationErrors.push(`Field '${fieldType}' is mapped multiple times.`);
                     }
                 } else {
                     apiMappings[fieldType as keyof typeof apiMappings] = header;
                     if (requiredFieldsFound.hasOwnProperty(fieldType)) {
                          requiredFieldsFound[fieldType as keyof typeof requiredFieldsFound] = true;
                      }
                 }
             }
         }
         if (!requiredFieldsFound.date) validationErrors.push("Map a column to 'date'.");
         if (!requiredFieldsFound.amount) validationErrors.push("Map a column to 'amount'.");
         if (!requiredFieldsFound.description) validationErrors.push("Map a column to 'description'.");
         if (config.amountFormat === 'sign_column' && !config.signColumn) {
              validationErrors.push("Select the 'Sign Column' when using that Amount Format.");
         }
         if (config.amountFormat === 'sign_column' && config.signColumn && !analyzeMutation.data.headers.includes(config.signColumn)) {
               validationErrors.push(`Selected Sign Column '${config.signColumn}' not found.`);
         }
         if (!config.dateFormat) validationErrors.push("Select a Date Format.");

         if (validationErrors.length > 0) {
             importMutation.mutate(undefined as any, { onError: () => {}, onSettled: () => {(importMutation as any)._error = new Error(`Configuration errors: ${validationErrors.join(' ')}`);} });
             setCurrentStep('configure'); // Stay on config step
             return;
         }
        // --- End Basic Validation ---

        // Check if category mapping is needed
        const categoryHeader = apiMappings.category;
        if (categoryHeader && uniqueCsvCategories.length > 0) {
            console.log("Proceeding to category mapping step.");
            setCurrentStep('map_categories'); // Move to the category mapping step
        } else {
            console.log("Skipping category mapping, proceeding directly to import.");
            // No category column mapped or no unique categories found, submit directly
             handleSubmit(); // Call the final submit logic directly
        }
    };

    // --- Final Submit Handler (called after category mapping or directly) ---
    const handleSubmit = async () => {
        // Set step to submitting if not already set (e.g., called directly)
        if (currentStep !== 'submitting') {
            setCurrentStep('submitting');
             importMutation.reset(); // Clear errors if called directly
        }

        // Re-run basic validations quickly (should pass if called from handleProceedToCategoryMapping)
        if (!file || !analyzeMutation.data || !selectedBankAccount?.id) {
             importMutation.mutate(undefined as any, { onError: () => {}, onSettled: () => {(importMutation as any)._error = new Error("Missing file, analysis data or bank account.");} });
             setCurrentStep('configure'); return;
         }
         let apiMappings: { date?: string; amount?: string; description?: string; currency?: string; category?: string } = {};
         // Repopulate apiMappings based on current config
         for (const header in config.mappings) {
             const fieldType = config.mappings[header];
             if (fieldType !== 'none') {
                 // Simplified: Assume first mapping wins if duplicates somehow exist
                 if (!apiMappings[fieldType as keyof typeof apiMappings]) {
                     apiMappings[fieldType as keyof typeof apiMappings] = header;
                 }
             }
         }

        // --- Category Mapping Validation (only if category step was involved) ---
        let validationErrors: string[] = [];
        const mappedCategoryHeader = apiMappings.category;
        // We only *need* to validate category mappings if the step was shown OR if a category header exists
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
            // If errors found here, force back to category mapping step if applicable, else configure
            setCurrentStep(mappedCategoryHeader && uniqueCsvCategories.length > 0 ? 'map_categories' : 'configure');
            return;
        }

        // --- Actual Submission Logic --- 
        try {
            // --- Handle Category Creation --- 
            const categoriesToCreate = Object.entries(categoryMappings)
                .filter(([csvCat, mapping]) => mapping.targetId === '__CREATE__' && mapping.newName?.trim())
                .map(([csvCat, mapping]) => ({ csvCategoryName: csvCat, newName: mapping.newName!.trim() }));

            if (categoriesToCreate.length > 0) {
                console.log("Attempting to pre-create categories:", categoriesToCreate);
                 await Promise.all(categoriesToCreate.map(catInfo => createCategoryMutation.mutateAsync(catInfo)));
                 console.log("Finished pre-creating categories.");
                 await new Promise(resolve => setTimeout(resolve, 100)); // Allow state updates
             }

            // --- Construct Config --- 
            const targetAccountId = selectedBankAccount!.id;
            const finalCategoryMappings = { ...categoryMappings };
            const submitConfig: ImportConfig = {
                 bankAccountId: targetAccountId,
                 mappings: {
                     date: apiMappings.date!, amount: apiMappings.amount!, description: apiMappings.description!,
                     ...(apiMappings.currency && { currency: apiMappings.currency }),
                     ...(apiMappings.category && { category: apiMappings.category }),
                  },
                  dateFormat: config.dateFormat, amountFormat: config.amountFormat,
                  signColumn: config.amountFormat === 'sign_column' ? config.signColumn : undefined,
                  skipRows: Number(config.skipRows || 0), delimiter: config.delimiter || undefined,
             };

            // --- Trigger Import --- 
            importMutation.mutate({ file: file!, config: submitConfig, categoryMappings: finalCategoryMappings });
            // CurrentStep will be reset by importMutation's onSuccess/onError

        } catch (error: any) {
             console.error("Error during final submission process:", error);
             const message = error instanceof Error ? error.message : "An unexpected error occurred.";
             importMutation.reset();
             importMutation.mutate(undefined as any, { onError: () => {}, onSettled: () => {(importMutation as any)._error = new Error(message);} });
             // Force back to a reasonable step on error
             setCurrentStep(mappedCategoryHeader && uniqueCsvCategories.length > 0 ? 'map_categories' : 'configure');
         }
    };

    const filteredBankAccounts =
        bankAccountQuery === ''
        ? bankAccounts
        : bankAccounts.filter((account) =>
            account.name.toLowerCase().includes(bankAccountQuery.toLowerCase())
        );

    const queryMatchesExisting = bankAccounts.some(acc => acc.name.toLowerCase() === bankAccountQuery.toLowerCase());
    const isValidNewName = bankAccountQuery.trim() !== '' && !queryMatchesExisting;

    // Helper function to get display text for category mapping dropdown/value
    const getCategoryMappingDisplay = (csvCategoryName: string): string => {
         const mapping = categoryMappings[csvCategoryName];
         if (!mapping) return "Mapping..."; // Should not happen if initialized
         if (mapping.targetId === null) return "- Skip Category -";
         if (mapping.targetId === '__CREATE__') {
             return mapping.newName?.trim() ? `Create: "${mapping.newName.trim()}"` : "-- Create New Category --";
         }
         // Find existing category name by ID
         const existing = userCategories.find(cat => cat.id === mapping.targetId);
         return existing ? existing.name : "Select Existing..."; // Fallback if ID not found
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

    const renderFeedback = () => {
        const mutationWithError = [analyzeMutation, createAccountMutation, importMutation].find(m => m.isError);
        const error = bankAccountsError || mutationWithError?.error;
        const successMessage = importMutation.isSuccess ? (importMutation.data?.message || 'Import successful!') : null;

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
             return (
                 <div className="alert-success mb-4">
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

    return (
        <div className="container mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold">Import Transactions from CSV</h1>
            {renderFeedback()}

            {/* --- Step 1: Upload --- */}
            {/* Show always, unless analysis is pending */}
             {currentStep !== 'map_categories' && ( // Hide during category mapping
                  <div className={`card-style ${analyzeMutation.isPending ? 'opacity-50' : ''}`}>
                      {/* ... Card content ... */}
                      <div className="card-header-style">
                         <h3 className="card-title-style">Step 1: Upload CSV File</h3>
                         <p className="card-description-style">Select the CSV file containing your bank transactions.</p>
                     </div>
                     <div className="p-6 pt-0">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            disabled={isLoading || analyzeMutation.isPending}
                            className="input-style file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            key={file ? 'file-loaded' : 'file-empty'}
                        />
                    </div>
                 </div>
             )}
             {analyzeMutation.isPending && ( /* ... spinner ... */
                  <div className="flex justify-center items-center p-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Analyzing file...</span>
                  </div>
              )}

            {/* --- Step 2a + 3: Configure & Map Columns --- */}
            {/* Show only when analysis is done and we are in the configure step */}
            {sessionStatus === 'authenticated' && analyzeMutation.isSuccess && analyzeMutation.data && currentStep === 'configure' && (
                <div className="space-y-6"> {/* Wrapper for this logical step */}
                    {/* --- 2a: Configure Settings --- */}
                    <div className="card-style">
                         <div className="card-header-style">
                            <h3 className="card-title-style">Step 2: Configure Import Settings</h3>
                             <p className="card-description-style">Select target account, formats, and map columns in the preview table below.</p>
                         </div>
                        <div className="p-6 pt-0 space-y-4">
                            {/* ... Bank Account Combobox ... */}
                            <div>
                                 <Combobox value={selectedBankAccount} onChange={setSelectedBankAccount} by="id" nullable>
                                     {({ open }) => (
                                        <div className="relative mt-1">
                                            <Combobox.Label className="block text-sm font-medium text-gray-700 mb-1">Target Bank Account *</Combobox.Label>
                                            <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/10 sm:text-sm">
                                                <Combobox.Input
                                                     className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                                                     onChange={(event) => setBankAccountQuery(event.target.value)}
                                                     displayValue={(account: BankAccount | null) => account?.name ?? ""}
                                                     placeholder="Select or type to create..."
                                                     autoComplete='off'
                                                     disabled={createAccountMutation.isPending}
                                                />
                                                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2" disabled={createAccountMutation.isPending}>
                                                     <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                 </Combobox.Button>
                                             </div>
                                            <Transition
                                                as={Fragment}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                            >
                                                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                     {isValidNewName && (
                                                        <Combobox.Option
                                                            value={{ id: '__create__', name: bankAccountQuery } as any}
                                                            className={({ active }) => `relative cursor-pointer select-none py-2 px-4 ${active ? 'bg-primary text-white' : 'text-gray-900'}`}
                                                            onClick={() => {
                                                                 if (!createAccountMutation.isPending) {
                                                                      createAccountMutation.mutate(bankAccountQuery.trim());
                                                                  }
                                                             }}
                                                        >
                                                             Create "{bankAccountQuery.trim()}"
                                                             {createAccountMutation.isPending && createAccountMutation.variables === bankAccountQuery.trim() && (
                                                                 <Loader2 className="ml-2 h-4 w-4 animate-spin inline-block" />
                                                             )}
                                                        </Combobox.Option>
                                                     )}
                                                      {filteredBankAccounts.length === 0 && !isValidNewName ? (
                                                         <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                                              {bankAccountQuery !== '' ? 'No matching accounts found.' : 'Type to search or create...'}
                                                         </div>
                                                     ) : null}

                                                     {filteredBankAccounts.map((account) => (
                                                        <Combobox.Option
                                                            key={account.id}
                                                            value={account}
                                                            disabled={createAccountMutation.isPending}
                                                            className={({ active, disabled }) =>
                                                                 `relative select-none py-2 pl-10 pr-4 ${disabled ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer'} ${active && !disabled ? 'bg-primary text-white' : 'text-gray-900'}`
                                                            }
                                                         >
                                                            {({ selected, active }) => (
                                                                 <>
                                                                     <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                         {account.name}
                                                                     </span>
                                                                     {selected ? (
                                                                         <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-primary'}`}>
                                                                             <Check className="h-5 w-5" aria-hidden="true" />
                                                                         </span>
                                                                     ) : null}
                                                                 </>
                                                             )}
                                                         </Combobox.Option>
                                                    ))}
                                                </Combobox.Options>
                                            </Transition>
                                        </div>
                                    )}
                                 </Combobox>
                                 {createAccountMutation.isError && (
                                     <p className="mt-1 text-xs text-red-600">Creation failed: {createAccountMutation.error.message}</p>
                                 )}
                             </div>
                            {/* ... Format Settings ... */} 
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                     <Listbox value={config.dateFormat} onChange={(value) => handleConfigChange('dateFormat', value)}>
                                        <Label className="block text-sm font-medium text-gray-700 mb-1">Date Format *</Label>
                                         <div className="relative mt-1">
                                             <ListboxButton className="listbox-button-style">
                                                 <span className="block truncate">{commonDateFormats.find(f => f.value === config.dateFormat)?.label ?? 'Select...'}</span>
                                                 <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                     <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                 </span>
                                             </ListboxButton>
                                             <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                                 <ListboxOptions className="listbox-options-style">
                                                     {commonDateFormats.map((format) => (
                                                         <ListboxOption key={format.value} value={format.value} className={({ active }) => `listbox-option-style ${active ? 'bg-primary/10 text-primary' : 'text-gray-900'}`}>
                                                             {({ selected }) => (
                                                                 <>
                                                                     <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{format.label}</span>
                                                                     {selected ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary"><Check className="h-5 w-5" aria-hidden="true" /></span> : null}
                                                                 </>
                                                             )}
                                                         </ListboxOption>
                                                     ))}
                                                 </ListboxOptions>
                                             </Transition>
                                         </div>
                                     </Listbox>
                                     <p className="text-sm text-muted-foreground mt-1">Select the format matching the date column.</p>
                                </div>

                                <div>
                                     <Listbox value={config.amountFormat} onChange={(value) => handleConfigChange('amountFormat', value)}>
                                        <Label className="block text-sm font-medium text-gray-700 mb-1">Amount Format *</Label>
                                         <div className="relative mt-1">
                                             <ListboxButton className="listbox-button-style">
                                                 <span className="block truncate">{amountFormatOptions.find(f => f.value === config.amountFormat)?.label ?? 'Select...'}</span>
                                                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" /></span>
                                             </ListboxButton>
                                             <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                                 <ListboxOptions className="listbox-options-style">
                                                     {amountFormatOptions.map((format) => (
                                                         <ListboxOption key={format.value} value={format.value} className={({ active }) => `listbox-option-style ${active ? 'bg-primary/10 text-primary' : 'text-gray-900'}`}>
                                                             {({ selected }) => (
                                                                 <>
                                                                     <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{format.label}</span>
                                                                     {selected ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary"><Check className="h-5 w-5" aria-hidden="true" /></span> : null}
                                                                 </>
                                                             )}
                                                         </ListboxOption>
                                                     ))}
                                                 </ListboxOptions>
                                             </Transition>
                                         </div>
                                     </Listbox>
                                </div>

                                {config.amountFormat === 'sign_column' && (
                                    <div>
                                         <Listbox value={config.signColumn} onChange={(value) => handleConfigChange('signColumn', value)}>
                                             <Label className="block text-sm font-medium text-gray-700 mb-1">Sign Column *</Label>
                                             <div className="relative mt-1">
                                                 <ListboxButton className="listbox-button-style">
                                                     <span className="block truncate">{config.signColumn ?? 'Select sign column...'}</span>
                                                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" /></span>
                                                 </ListboxButton>
                                                 <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                                     <ListboxOptions className="listbox-options-style">
                                                         {analyzeMutation.data.headers.map(header => (
                                                             <ListboxOption key={header} value={header} className={({ active }) => `listbox-option-style ${active ? 'bg-primary/10 text-primary' : 'text-gray-900'}`}>
                                                                 {({ selected }) => (
                                                                     <>
                                                                         <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{header}</span>
                                                                         {selected ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary"><Check className="h-5 w-5" aria-hidden="true" /></span> : null}
                                                                     </>
                                                                 )}
                                                             </ListboxOption>
                                                         ))}
                                                     </ListboxOptions>
                                                 </Transition>
                                             </div>
                                         </Listbox>
                                        <p className="text-sm text-muted-foreground mt-1">Column indicating Debit/Credit.</p>
                                    </div>
                                )}
                            </div>
                            {/* ... Other Settings ... */} 
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="skipRows" className="block text-sm font-medium text-gray-700 mb-1">Header Rows to Skip</label>
                                    <input
                                        id="skipRows"
                                        type="number"
                                        min="0"
                                        value={config.skipRows || 0}
                                        onChange={(e) => handleConfigChange('skipRows', parseInt(e.target.value, 10) || 0)}
                                        className="input-style"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="delimiter" className="block text-sm font-medium text-gray-700 mb-1">Delimiter (Optional)</label>
                                    <input
                                        id="delimiter"
                                        value={config.delimiter || ''}
                                        onChange={(e) => handleConfigChange('delimiter', e.target.value)}
                                        placeholder={`Detected: ${analyzeMutation.data.detectedDelimiter || 'Comma (,)'}`}
                                        className="input-style"
                                        disabled={isLoading}
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">Leave blank to auto-detect.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- 3: Preview & Map Columns --- */} 
                    <div className="card-style">
                         <div className="card-header-style">
                             <h3 className="card-title-style">Step 3: Preview Data & Map Columns</h3>
                             <p className="card-description-style">Review the first {analyzeMutation.data.previewRows.length} rows and map columns.</p>
                         </div>
                         <div className="p-6 pt-0">
                             <div className="relative w-full overflow-auto">
                                 <table className="w-full caption-bottom text-sm">
                                     <thead className="[&_tr]:border-b">
                                         <tr className="border-b">
                                              {analyzeMutation.data.headers.map(header => (
                                                  <th key={header} className="h-12 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap pt-2 pb-1 border-r last:border-r-0">
                                                      <div className="font-semibold mb-1 text-gray-800">{header}</div>
                                                       <Listbox value={config.mappings[header] || 'none'} onChange={(value) => handleMappingChange(header, value)}>
                                                          <div className="relative mt-1">
                                                              <ListboxButton className="relative w-full cursor-default rounded bg-white py-1.5 pl-3 pr-8 text-left border border-gray-300 focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/50 text-xs">
                                                                  <span className="block truncate">{mappingOptions.find(o => o.value === (config.mappings[header] || 'none'))?.label}</span>
                                                                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
                                                                      <ChevronsUpDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                                                                  </span>
                                                              </ListboxButton>
                                                              <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                                                  <ListboxOptions className="absolute z-20 mt-1 max-h-60 w-auto min-w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                                                      {mappingOptions.map((option) => (
                                                                          <ListboxOption key={option.value} value={option.value} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 text-xs ${active ? 'bg-primary/10 text-primary' : 'text-gray-900'}`}>
                                                                              {({ selected }) => (
                                                                                  <>
                                                                                      <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>{option.label}</span>
                                                                                      {selected ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary"><Check className="h-4 w-4" aria-hidden="true" /></span> : null}
                                                                                  </>
                                                                              )}
                                                                          </ListboxOption>
                                                                      ))}
                                                                  </ListboxOptions>
                                                              </Transition>
                                                          </div>
                                                      </Listbox>
                                                  </th>
                                              ))}
                                         </tr>
                                     </thead>
                                     <tbody className="[&_tr:last-child]:border-0">
                                          {analyzeMutation.data.previewRows.map((row, index) => (
                                             <tr key={index} className="border-b hover:bg-muted/50">
                                                 {analyzeMutation.data.headers.map(header => (
                                                     <td key={header} className="p-2 align-middle text-xs whitespace-nowrap border-r last:border-r-0">
                                                          {String(row[header] ?? '')}
                                                     </td>
                                                 ))}
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                         </div>
                     </div>

                     {/* --- Button to Proceed - Use custom Button --- */}
                     <Button
                         type="button"
                         onClick={handleProceedToCategoryMapping}
                         disabled={isLoading || !file || !selectedBankAccount}
                         className="mt-6 w-full md:w-auto"
                     >
                          Review & Import
                      </Button>
                </div>
            )}

            {/* --- Step 2b: Map Categories --- */} 
            {sessionStatus === 'authenticated' && analyzeMutation.isSuccess && analyzeMutation.data && currentStep === 'map_categories' && (
                <div className="space-y-6">
                     <div className="card-style">
                         <div className="card-header-style">
                             <h3 className="card-title-style">Step 2b: Map Imported Categories</h3>
                             <p className="card-description-style">Match or create categories for items found in the file.</p>
                         </div>
                         <div className="p-6 pt-0 space-y-3 divide-y divide-gray-200">
                             <div className="grid grid-cols-[1fr_2fr] gap-4 items-center font-medium text-gray-500 text-sm py-2">
                                <div>CSV Category Name</div>
                                <div>Map To</div>
                             </div>
                             {isLoadingCategories && <p>Loading categories...</p>}
                             {categoriesError && <p className="text-red-600">Error loading categories: {categoriesError.message}</p>}

                             {!isLoadingCategories && !categoriesError && uniqueCsvCategories.map((csvCat) => (
                                 <div key={csvCat} className="grid grid-cols-[1fr_2fr] gap-4 items-start pt-3">
                                     <div className="font-medium text-sm pt-2 truncate" title={csvCat}>{csvCat}</div>
                                     <div className="w-full">
                                         <Listbox
                                             value={categoryMappings[csvCat]?.targetId ?? '__SKIP__'}
                                             onChange={(selectedValue) => {
                                                 const targetId = selectedValue === '__SKIP__' ? null : selectedValue === '__CREATE__' ? '__CREATE__' : selectedValue;
                                                 // If creating, default newName to the CSV category name
                                                 // Otherwise, clear newName (when selecting Skip or Existing)
                                                 const update = targetId === '__CREATE__' 
                                                     ? { targetId, newName: csvCat } 
                                                     : { targetId, newName: '' }; 
                                                 handleCategoryMappingChange(csvCat, update);
                                             }}
                                             disabled={isLoading}
                                         >
                                             <div className="relative">
                                                <ListboxButton className="input-style relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border border-gray-300 shadow-sm focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                                                     <span className="block truncate">{getCategoryMappingDisplay(csvCat)}</span>
                                                     <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                         <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                     </span>
                                                 </ListboxButton>
                                                 <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                                     <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                         <ListboxOption value="__SKIP__" className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${ active ? 'bg-blue-100 text-blue-900' : 'text-gray-900' }`}>
                                                             {({ selected }) => (<><span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>- Skip Category -</span>{selected ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600"><Check className="h-5 w-5" aria-hidden="true" /></span> : null}</>)}
                                                         </ListboxOption>
                                                          <ListboxOption value="__CREATE__" className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${ active ? 'bg-blue-100 text-blue-900' : 'text-gray-900' }`}>
                                                             {({ selected }) => (<><span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>-- Create New Category --</span>{selected ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600"><Check className="h-5 w-5" aria-hidden="true" /></span> : null}</>)}
                                                         </ListboxOption>
                                                         <div className="relative cursor-default select-none py-1 px-4 text-gray-500 text-xs">Existing Categories</div>
                                                          {userCategories.map(cat => (
                                                             <ListboxOption key={cat.id} value={cat.id} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${ active ? 'bg-blue-100 text-blue-900' : 'text-gray-900' }`}>
                                                                {({ selected }) => (<><span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{cat.name}</span>{selected ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600"><Check className="h-5 w-5" aria-hidden="true" /></span> : null}</>)}
                                                             </ListboxOption>
                                                         ))}
                                                     </ListboxOptions>
                                                 </Transition>
                                             </div>
                                         </Listbox>

                                         {categoryMappings[csvCat]?.targetId === '__CREATE__' && (
                                             <div className="mt-1">
                                                <input
                                                     type="text"
                                                     placeholder="Enter new category name..."
                                                     value={categoryMappings[csvCat]?.newName || ''}
                                                     onChange={(e) => handleCategoryMappingChange(csvCat, { targetId: '__CREATE__', newName: e.target.value })}
                                                      className="input-style w-full text-sm"
                                                      disabled={isLoading || createCategoryMutation.isPending}
                                                 />
                                             </div>
                                         )}
                                         {createCategoryMutation.isError && createCategoryMutation.variables?.csvCategoryName === csvCat && (
                                             <p className="text-xs text-red-600 mt-1">Creation failed: {createCategoryMutation.error.message}</p>
                                         )}
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>

                     {/* --- Buttons - Use custom Button --- */}
                     <div className="flex space-x-4">
                         <Button
                             type="button"
                             onClick={() => setCurrentStep('configure')}
                             disabled={isLoading}
                             className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500"
                         >
                             Back to Configuration
                         </Button>
                         <Button
                             type="button"
                             onClick={handleSubmit}
                             disabled={isLoading || createCategoryMutation.isPending}
                         >
                             {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Import Transactions'}
                         </Button>
                     </div>
                 </div>
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