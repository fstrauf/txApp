'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
// import { useAuth } from '@/context/AuthContext'; // Removed useAuth
import { useSession } from 'next-auth/react'; // Import useSession
// Removed shadcn imports for simple elements
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Keep/Uncomment complex component imports, but usage will be commented out temporarily
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

import { Loader2, Check, ChevronsUpDown } from "lucide-react"; // Keep icon imports
import { cn } from "@/lib/utils"; // Assuming you have this utility function

interface BankAccount {
    id: string;
    name: string;
}

interface AnalysisResult {
    headers: string[];
    previewRows: Record<string, any>[];
    detectedDelimiter: string;
}

// Define the types a column can be mapped to
type MappedFieldType = 'date' | 'amount' | 'description' | 'currency' | 'none';

// Update ImportConfig interface
interface ImportConfig {
    bankAccountId: string;
    // Mappings structure changed: Key is CSV Header, Value is the field type
    mappings: Record<string, MappedFieldType>; 
    dateFormat: string;
    amountFormat: 'standard' | 'negate' | 'sign_column';
    signColumn?: string;
    skipRows: number;
    delimiter?: string;
}

// Update ConfigState: Mappings type changed, remove specific required fields here
// Validation will happen during submit based on the Record values
type ConfigState = Partial<Omit<ImportConfig, 'mappings' | 'bankAccountId'>> & {
    mappings: Record<string, MappedFieldType>; 
};

// Define common date formats compatible with date-fns
const commonDateFormats = [
    { value: 'yyyy-MM-dd HH:mm:ss', label: 'YYYY-MM-DD HH:MM:SS (e.g., 2023-12-31 14:30:00)' },
    { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (e.g., 2023-12-31)' },
    { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (e.g., 12/31/2023)' },
    { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (e.g., 31/12/2023)' },
    { value: 'dd.MM.yyyy', label: 'DD.MM.YYYY (e.g., 31.12.2023)' },
    { value: 'yyyy/MM/dd', label: 'YYYY/MM/DD (e.g., 2023/12/31)' },
];

const ImportTransactionsPage: React.FC = () => {
    // const { token, isLoading: isAuthLoading } = useAuth(); // Removed useAuth
    const { status: sessionStatus } = useSession(); // Get session status from NextAuth
    const [file, setFile] = useState<File | null>(null);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    // Initialize mappings as an empty object
    const [config, setConfig] = useState<ConfigState>({
        mappings: {}, 
        // Set initial default format from the list
        dateFormat: commonDateFormats[1].value, // Default to yyyy-MM-dd
        amountFormat: 'standard',
        skipRows: 0,
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const isLoading = sessionStatus === 'loading' || isProcessing;
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    // const [comboboxOpen, setComboboxOpen] = useState(false); // Comment out state for commented components
    const [selectedAccountIdOrNewName, setSelectedAccountIdOrNewName] = useState("");

    // Fetch bank accounts on component mount, wait for session
    useEffect(() => {
        const fetchBankAccounts = async () => {
            // Wait until session is authenticated
            if (sessionStatus !== 'authenticated') return;
            
            setIsProcessing(true);
            try {
                // Remove Authorization header - rely on cookie
                const response = await fetch('/api/bank-accounts'); 
                if (!response.ok) {
                    // Handle potential 401/403 if session is invalid server-side
                    if (response.status === 401 || response.status === 403) {
                         throw new Error('Unauthorized. Please log in again.');
                    }
                    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch bank accounts' }));
                    throw new Error(errorData.error || 'Failed to fetch bank accounts');
                }
                const data = await response.json();
                setBankAccounts(data.bankAccounts || []);
            } catch (error: any) {
                setFeedback({ type: 'error', message: `Error fetching accounts: ${error.message}` });
            } finally {
                setIsProcessing(false);
            }
        };

        fetchBankAccounts();
    }, [sessionStatus]); // Depend on sessionStatus

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        console.log("handleFileChange triggered");
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setAnalysisResult(null); 
            setFeedback(null);
            setSelectedAccountIdOrNewName(""); // Reset account selection
            console.log("Calling handleAnalyze...");
            // No need to pass auth loading state anymore
            handleAnalyze(selectedFile);
        }
    };

    const handleAnalyze = async (selectedFile: File) => {
        console.log("handleAnalyze called");
        
        // Check session status before making request
        if (sessionStatus !== 'authenticated') {
            console.error('Analysis stopped: User not authenticated.');
            setFeedback({ type: 'error', message: 'You must be logged in to analyze files.'});
            return;
        }
        
        // Check if file exists (already done in handleFileChange but good practice)
        if (!selectedFile) {
             console.error('Analysis stopped: No file selected.'); 
             setFeedback({ type: 'error', message: 'Please select a file first.'});
             return;
        }

        setIsProcessing(true);
        setFeedback(null);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            console.log("Sending request to /api/transactions/analyze");
             // Remove Authorization header - rely on cookie
            const response = await fetch('/api/transactions/analyze', { 
                method: 'POST',
                // headers: { 'Authorization': `Bearer ${token}` }, // Removed header
                body: formData,
            });
            console.log("Analyze Response Status:", response.status);

            const result = await response.json();
            console.log("Analyze Response Body:", result);

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Unauthorized. Please log in again.');
                }
                throw new Error(result.error || `Analysis failed with status ${response.status}`);
            }

            setAnalysisResult(result);
            // Initialize mappings: Set all columns to 'none' initially
            let initialMappings = result.headers.reduce((acc: Record<string, MappedFieldType>, header: string) => {
                acc[header] = 'none';
                // Simple auto-detection based on common keywords
                const lowerHeader = header.toLowerCase();
                if (lowerHeader.includes('date') || lowerHeader.includes('created')) acc[header] = 'date';
                else if (lowerHeader.includes('amount') || lowerHeader.includes('value') || lowerHeader.includes('source amount')) acc[header] = 'amount';
                else if (lowerHeader.includes('desc') || lowerHeader.includes('payee') || lowerHeader.includes('memo') || lowerHeader.includes('target name') || lowerHeader.includes('reference')) acc[header] = 'description';
                else if (lowerHeader.includes('currency')) acc[header] = 'currency';
                return acc;
            }, {});

            // --- Enforce Uniqueness for Auto-Detected Required Fields --- 
            // Update to include 'currency' as a field needing unique auto-assignment
            const uniqueAutoAssignFields: MappedFieldType[] = ['date', 'amount', 'description', 'currency'];
            uniqueAutoAssignFields.forEach(fieldType => {
                let foundFirst = false;
                Object.keys(initialMappings).forEach(header => {
                    if (initialMappings[header] === fieldType) {
                        if (foundFirst) {
                            initialMappings[header] = 'none'; // Reset subsequent matches
                        } else {
                            foundFirst = true; // Keep the first match
                        }
                    }
                });
            });
            // --- End Uniqueness Enforcement ---

            // --- Auto-detect Date Format from Preview --- 
            let detectedDateFormat = commonDateFormats[1].value; // Default to yyyy-MM-dd
            const dateHeader = Object.keys(initialMappings).find(h => initialMappings[h] === 'date');
            if (dateHeader && result.previewRows.length > 0) {
                const firstDateValue = String(result.previewRows[0][dateHeader] || '');
                // Check for formats in our common list
                if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(firstDateValue)) {
                    detectedDateFormat = commonDateFormats[0].value; // yyyy-MM-dd HH:mm:ss
                } else if (/^\d{4}-\d{2}-\d{2}$/.test(firstDateValue)) {
                     detectedDateFormat = commonDateFormats[1].value; // yyyy-MM-dd
                 } else if (/^\d{2}\/\d{2}\/\d{4}/.test(firstDateValue)) {
                     detectedDateFormat = commonDateFormats[2].value; // MM/dd/yyyy
                 } else if (/^\d{2}\/\d{2}\/\d{4}/.test(firstDateValue)) {
                     detectedDateFormat = commonDateFormats[3].value; // dd/MM/yyyy
                 } else if (/^\d{2}\.\d{2}\.\d{4}/.test(firstDateValue)) {
                     detectedDateFormat = commonDateFormats[4].value; // dd.MM.yyyy
                 } else if (/^\d{4}\/\d{2}\/\d{2}/.test(firstDateValue)) {
                     detectedDateFormat = commonDateFormats[5].value; // yyyy/MM/dd
                 }
                 // Add more sophisticated detection if needed
            }
            // --- End Auto-detect --- 

            setConfig(prev => ({
                 ...prev, 
                 mappings: initialMappings, 
                 delimiter: result.detectedDelimiter || prev.delimiter, 
                 dateFormat: detectedDateFormat // Pre-select the detected format
            }));

        } catch (error: any) {
            console.error("Error during analysis fetch:", error);
            setFeedback({ type: 'error', message: `Analysis Error: ${error.message}` });
            setAnalysisResult(null); 
        } finally {
            console.log("handleAnalyze finished");
            setIsProcessing(false);
        }
    };

    const handleConfigChange = (field: keyof Omit<ImportConfig, 'mappings' | 'bankAccountId'>, value: string | number) => {
        setConfig(prev => {
            const updatedConfig = { ...prev, mappings: { ...prev.mappings } }; // Ensure mappings is copied
             if (field === 'skipRows') {
                updatedConfig[field] = Number(value);
            } else {
                // Explicitly cast field to the correct type excluding mappings and bankAccountId
                 updatedConfig[field as keyof Omit<ConfigState, 'mappings' | 'bankAccountId'>] = String(value) as any;
            }
            if (field === 'amountFormat' && value !== 'sign_column') {
                updatedConfig.signColumn = undefined;
            }
            return updatedConfig;
        });
    };

    // New handler for mapping changes directly from the table header
    const handleMappingChange = (csvHeader: string, fieldType: MappedFieldType) => {
        setConfig(prevConfig => {
            const newMappings = { ...prevConfig.mappings };

            // If assigning a unique field (date, amount, description, currency), ensure it's unique
            // Updated list to include 'currency'
            const uniqueFields: MappedFieldType[] = ['date', 'amount', 'description', 'currency'];
            if (uniqueFields.includes(fieldType)) {
                // Find if any other header is currently mapped to this fieldType
                const currentHeaderForField = Object.keys(newMappings).find(
                    header => newMappings[header] === fieldType
                );
                // If another header has this mapping, set it back to 'none'
                if (currentHeaderForField && currentHeaderForField !== csvHeader) {
                    newMappings[currentHeaderForField] = 'none';
                }
            }
            
            // Update the mapping for the current header
            newMappings[csvHeader] = fieldType;
            
            return { ...prevConfig, mappings: newMappings };
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
         // Check session status before making request
        if (sessionStatus !== 'authenticated') {
            console.error('Import stopped: User not authenticated.');
            setFeedback({ type: 'error', message: 'You must be logged in to import files.'});
            return;
        }
        
        // --- Validation --- 
        let apiMappings: { date?: string; amount?: string; description?: string; currency?: string } = {};
        let requiredFieldsFound = { date: false, amount: false, description: false };
        let mappingErrors: string[] = [];

        if (config.mappings) {
            for (const header in config.mappings) {
                const fieldType = config.mappings[header];
                if (fieldType !== 'none') {
                    // Check uniqueness only for required fields
                    const isRequiredField = requiredFieldsFound.hasOwnProperty(fieldType);
                    
                    if (apiMappings[fieldType as keyof typeof apiMappings]) {
                        // If it's a required field OR the optional field we care about (currency), and it's already mapped, error.
                        // Allow other optional fields to be mapped multiple times if needed in the future, but currency should ideally be unique or first-wins.
                        if (isRequiredField || fieldType === 'currency') { 
                            mappingErrors.push(`Field '${fieldType}' is mapped to multiple columns ('${apiMappings[fieldType as keyof typeof apiMappings]}' and '${header}'). Consider mapping only one or skipping duplicates.`);
                            // Don't assign the duplicate for required fields or currency
                            continue; // Skip assignment for this duplicate header
                        }
                        // If it's another optional field type in the future, we might allow multiple mappings
                        // For now, just skip assigning duplicates without erroring.

                    } else {
                        // Assign the header if the field type slot is empty
                        apiMappings[fieldType as keyof typeof apiMappings] = header;
                        if (isRequiredField) {
                            requiredFieldsFound[fieldType as keyof typeof requiredFieldsFound] = true;
                        }
                    }
                }
            }
        }

        if (!requiredFieldsFound.date) mappingErrors.push("A column must be mapped to 'date'.");
        if (!requiredFieldsFound.amount) mappingErrors.push("A column must be mapped to 'amount'.");
        if (!requiredFieldsFound.description) mappingErrors.push("A column must be mapped to 'description'.");

        // Other validations
        if (!file || !analysisResult || !selectedAccountIdOrNewName || !config.dateFormat || !config.amountFormat) {
            mappingErrors.push("Please select a file, account, date format, and amount format.");
        }
        if (config.amountFormat === 'sign_column' && !config.signColumn) {
             mappingErrors.push("Sign Column must be selected when Amount Format is 'Separate Sign Column'.");
        }
        // Make sure signColumn is one of the headers if needed
        if (config.amountFormat === 'sign_column' && config.signColumn && !analysisResult?.headers.includes(config.signColumn)) {
             mappingErrors.push(`Selected Sign Column '${config.signColumn}' not found in CSV headers.`);
        }
        
        if (mappingErrors.length > 0) {
            setFeedback({ type: 'error', message: `Configuration errors: ${mappingErrors.join(' ')}` });
            return;
        }
        // --- End Validation ---

        setIsProcessing(true);
        setFeedback(null);
        let targetAccountId = '';

        try {
            // Check if selected value is an existing ID or a new name
            const existingAccount = bankAccounts.find(acc => acc.id === selectedAccountIdOrNewName);
            
            if (existingAccount) {
                targetAccountId = existingAccount.id;
                console.log(`Using existing account ID: ${targetAccountId}`);
            } else {
                // Assume it's a new name, try to create it
                const newAccountName = selectedAccountIdOrNewName.trim();
                if (!newAccountName) {
                    throw new Error("Bank account name cannot be empty.");
                }
                console.log(`Attempting to create new account: ${newAccountName}`);
                const createResponse = await fetch('/api/bank-accounts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newAccountName })
                });
                const createResult = await createResponse.json();
                if (!createResponse.ok) {
                    throw new Error(createResult.error || 'Failed to create bank account');
                }
                targetAccountId = createResult.bankAccount.id;
                console.log(`New account created with ID: ${targetAccountId}`);
                // Add to local list and re-select it for UI consistency (optional but nice)
                setBankAccounts(prev => [...prev, createResult.bankAccount]);
                setSelectedAccountIdOrNewName(targetAccountId); 
            }

            // Construct the final config for the API using validated mappings
            const submitConfig: Omit<ImportConfig, 'mappings' | 'bankAccountId'> & { bankAccountId: string; mappings: Required<Pick<typeof apiMappings, 'date' | 'amount' | 'description'>> & Pick<typeof apiMappings, 'currency'> } = {
                bankAccountId: targetAccountId,
                mappings: {
                    date: apiMappings.date!,
                    amount: apiMappings.amount!,
                    description: apiMappings.description!,
                    currency: apiMappings.currency,
                },
                dateFormat: config.dateFormat!,
                amountFormat: config.amountFormat!,
                signColumn: config.amountFormat === 'sign_column' ? config.signColumn : undefined,
                skipRows: Number(config.skipRows || 0),
                delimiter: config.delimiter || undefined,
            };

            const importData = new FormData();
            // Add explicit check for file to satisfy TypeScript
            if (file) {
                importData.append('file', file);
            } else {
                // Should not happen due to validation, but handle defensively
                throw new Error("File became unavailable during submission process.");
            }
            importData.append('config', JSON.stringify(submitConfig));

            console.log(`Submitting import for account ID: ${targetAccountId}`);
            const importResponse = await fetch('/api/transactions/import', { 
                method: 'POST', body: importData,
            });
            const importResult = await importResponse.json();
            if (!importResponse.ok) {
                 if (importResponse.status === 401 || importResponse.status === 403) { throw new Error('Unauthorized.'); }
                const errorDetails = importResult.details ? ` Details: ${JSON.stringify(importResult.details)}` : '';
                throw new Error(importResult.error || 'Import failed' + errorDetails);
            }
            setFeedback({ type: 'success', message: importResult.message || 'Import successful!' });
            // Reset form, including mappings
            setFile(null); setAnalysisResult(null); setSelectedAccountIdOrNewName("");
            setConfig({
                mappings: {}, // Reset mappings
                dateFormat: commonDateFormats[1].value, 
                amountFormat: 'standard', 
                skipRows: 0,
                signColumn: undefined, 
                delimiter: undefined
             });
        } catch (error: any) {
            setFeedback({ type: 'error', message: `Operation Failed: ${error.message}` });
        } finally {
            setIsProcessing(false);
        }
    };

    // Render loading state or content based on session status
    if (sessionStatus === 'loading') {
        return (
            <div className="container mx-auto p-4 flex justify-center items-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading session...</span>
            </div>
        );
    }
    
    // Optional: Redirect or show message if not authenticated
    // You might want a more robust way to handle this, e.g., redirecting in middleware
    if (sessionStatus === 'unauthenticated') {
         return (
            <div className="container mx-auto p-4">
                <div className={`p-4 rounded-md bg-red-50 border border-red-200 text-red-800`} role="alert">
                    <h5 className="font-bold">Not Authenticated</h5>
                    <p>Please log in to import transactions.</p>
                 </div>
            </div>
        ); 
     }

    // Main component render when authenticated
    return (
        <div className="container mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold">Import Transactions from CSV</h1>

            {/* Feedback Area - Replaced Alert */}
             {feedback && (
                <div className={`p-4 rounded-md ${feedback.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-green-50 border border-green-200 text-green-800'}`} role="alert">
                    <h5 className="font-bold">{feedback.type === 'error' ? 'Error' : 'Success'}</h5>
                    <p>{feedback.message}</p>
                </div>
            )}

            {/* Replaced Card with div */}
            <div className="border bg-card text-card-foreground shadow rounded-lg">
                {/* Replaced CardHeader */}
                <div className="flex flex-col space-y-1.5 p-6">
                    {/* Replaced CardTitle */}
                    <h3 className="font-semibold leading-none tracking-tight text-lg">Step 1: Upload CSV File</h3>
                    {/* Replaced CardDescription */}
                    <p className="text-sm text-muted-foreground">Select the CSV file containing your bank transactions.</p>
                </div>
                {/* Replaced CardContent */}
                <div className="p-6 pt-0">
                    {/* Replaced Input */}
                    <input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleFileChange} 
                        disabled={isLoading} 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
            </div>

            {/* Spinner only shows for processing, not initial session load */}
            {isProcessing && (
                <div className="flex justify-center items-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Processing...</span>
                </div>
            )}

            {/* Config form only shows if analysis is done (implicitly authenticated already) */}
            {sessionStatus === 'authenticated' && analysisResult && (
                <form onSubmit={handleSubmit} className="space-y-6">
                     {/* Replaced Card */}
                     <div className="border bg-card text-card-foreground shadow rounded-lg">
                        {/* Replaced CardHeader */}
                        <div className="flex flex-col space-y-1.5 p-6">
                            <h3 className="font-semibold leading-none tracking-tight text-lg">Step 2: Configure Import Settings</h3>
                            <p className="text-sm text-muted-foreground">Select target account, formats, and map columns in the preview table below.</p>
                        </div>
                        {/* Replaced CardContent */}
                        <div className="p-6 pt-0 space-y-4">
                            {/* Bank Account Combobox - Temporarily Commented Out */} 
                            <div>
                                <label htmlFor="bankAccount" className="block text-sm font-medium mb-1">Target Bank Account *</label>
                                <p className="text-sm text-red-600 p-2 bg-red-50 rounded">[Account Selector temporarily disabled - needs Headless UI implementation]</p>
                                {/* 
                                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <button // Replaced Button
                                            // variant="outline"
                                            type="button" // Important for buttons inside forms
                                            role="combobox"
                                            aria-expanded={comboboxOpen}
                                            className="w-full justify-between mt-1 flex h-10 items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            disabled={isLoading}
                                        >
                                            {selectedAccountIdOrNewName
                                                ? bankAccounts.find((acc) => acc.id === selectedAccountIdOrNewName)?.name ?? selectedAccountIdOrNewName
                                                : "Select or create account..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                                        <Command>
                                            <CommandInput 
                                                placeholder="Search account or type name..." 
                                                value={selectedAccountIdOrNewName && !bankAccounts.find(a => a.id === selectedAccountIdOrNewName) ? selectedAccountIdOrNewName : ''}
                                                onValueChange={setSelectedAccountIdOrNewName} 
                                            />
                                            <CommandList>
                                                <CommandEmpty>No account found. Type name to create.</CommandEmpty>
                                                <CommandGroup>
                                                    {bankAccounts.map((account) => (
                                                        <CommandItem
                                                            key={account.id}
                                                            value={account.id} 
                                                            onSelect={(currentValue: string) => { // Added type
                                                                setSelectedAccountIdOrNewName(currentValue === selectedAccountIdOrNewName ? "" : currentValue);
                                                                setComboboxOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedAccountIdOrNewName === account.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {account.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                */}
                            </div>

                            {/* Format Settings - Selects Temporarily Replaced/Commented Out */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="dateFormat" className="block text-sm font-medium mb-1">Date Format *</label>
                                    <p className="text-sm text-red-600 p-2 bg-red-50 rounded">[Date Format Select temporarily disabled - needs Headless UI]</p>
                                    {/* 
                                    <Select
                                        value={config.dateFormat || ''}
                                        onValueChange={(value: string) => handleConfigChange('dateFormat', value)}
                                        required
                                    >
                                        <SelectTrigger id="dateFormat">
                                            <SelectValue placeholder="Select date format..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {commonDateFormats.map(format => (
                                                <SelectItem key={format.value} value={format.value}>
                                                    {format.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    */}
                                     <input type="hidden" value={config.dateFormat} /> {/* Keep value for submission */} 
                                    <p className="text-sm text-muted-foreground">
                                        Select the format matching the date column in your file.
                                    </p>
                                </div>
                                
                                <div>
                                    <label htmlFor="amountFormat" className="block text-sm font-medium mb-1">Amount Format *</label>
                                     <p className="text-sm text-red-600 p-2 bg-red-50 rounded">[Amount Format Select temporarily disabled - needs Headless UI]</p>
                                    {/* 
                                    <Select 
                                        onValueChange={(value: string) => handleConfigChange('amountFormat', value as any)}
                                        value={config.amountFormat || ''}
                                        required
                                    >
                                        <SelectTrigger id="amountFormat">
                                            <SelectValue placeholder="Select amount format..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="standard">Standard</SelectItem>
                                            <SelectItem value="negate">Negate all</SelectItem>
                                            <SelectItem value="sign_column">Separate Sign Column</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    */}
                                    <input type="hidden" value={config.amountFormat} /> {/* Keep value for submission */} 
                                </div>
                                
                                {config.amountFormat === 'sign_column' && (
                                    <div>
                                        <label htmlFor="signColumn" className="block text-sm font-medium mb-1">Sign Column *</label>
                                        <p className="text-sm text-red-600 p-2 bg-red-50 rounded">[Sign Column Select temporarily disabled - needs Headless UI]</p>
                                        {/* 
                                        <Select 
                                            onValueChange={(value: string) => handleConfigChange('signColumn', value)}
                                            value={config.signColumn || ''}
                                            required={config.amountFormat === 'sign_column'}
                                        >
                                            <SelectTrigger id="signColumn">
                                                <SelectValue placeholder="Select sign column..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {analysisResult.headers.map(header => (
                                                    <SelectItem key={header} value={header}>{header}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        */}
                                        <input type="hidden" value={config.signColumn} /> {/* Keep value for submission */} 
                                        <p className="text-sm text-muted-foreground">Column indicating Debit/Credit (e.g., 'D'/'C')</p>
                                    </div>
                                )}
                            </div>

                            {/* Other Settings - Replaced Input */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="skipRows" className="block text-sm font-medium mb-1">Header Rows to Skip</label>
                                    <input 
                                        id="skipRows" 
                                        type="number"
                                        min="0"
                                        value={config.skipRows || 0} 
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleConfigChange('skipRows', parseInt(e.target.value, 10) || 0)} 
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="delimiter" className="block text-sm font-medium mb-1">Delimiter (Optional)</label>
                                    <input 
                                        id="delimiter" 
                                        value={config.delimiter || ''} 
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleConfigChange('delimiter', e.target.value)} 
                                        placeholder={`Detected: ${analysisResult.detectedDelimiter || 'Comma (,)'}`} 
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    <p className="text-sm text-muted-foreground">Leave blank to auto-detect.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Table - Replaced Table components */} 
                    <div className="border bg-card text-card-foreground shadow rounded-lg">
                        <div className="flex flex-col space-y-1.5 p-6">
                            <h3 className="font-semibold leading-none tracking-tight text-lg">Step 3: Preview Data & Map Columns</h3>
                            <p className="text-sm text-muted-foreground">Review the first {analysisResult.previewRows.length} rows and assign 'Date', 'Amount', and 'Description' columns.</p>
                        </div>
                        <div className="p-6 pt-0">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            {analysisResult.headers.map(header => (
                                                <th key={header} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 whitespace-nowrap pt-2">
                                                    <div className="font-semibold mb-1">{header}</div>
                                                    <p className="text-sm text-red-600 p-1 bg-red-50 rounded">[Select temporarily disabled]</p>
                                                    {/* Mapping Select Temporarily Commented Out */}
                                                    {/* 
                                                    <Select 
                                                        value={config.mappings[header] || 'none'} 
                                                        onValueChange={(value: string) => handleMappingChange(header, value as MappedFieldType)} 
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue placeholder="Map column..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">- Skip Column -</SelectItem>
                                                            <SelectItem value="date">Map to: Date *</SelectItem>
                                                            <SelectItem value="amount">Map to: Amount *</SelectItem>
                                                            <SelectItem value="description">Map to: Description *</SelectItem>
                                                            <SelectItem value="currency">Map to: Currency</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    */}
                                                    <input type="hidden" value={config.mappings[header]} /> {/* Keep value */} 
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {analysisResult.previewRows.map((row, index) => (
                                            <tr key={index} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                {analysisResult.headers.map(header => (
                                                    <td key={header} className="p-4 align-middle [&:has([role=checkbox])]:pr-0 py-1 px-2 text-sm whitespace-nowrap">
                                                        {String(row[header])}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Replaced Button */}
                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 mt-6" // Basic primary button styles
                    >
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</> : 'Import Transactions'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default ImportTransactionsPage; 