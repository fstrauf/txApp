'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext'; // Assuming you have an AuthContext for token
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react"; // For loading spinner

interface BankAccount {
    id: string;
    name: string;
}

interface AnalysisResult {
    headers: string[];
    previewRows: Record<string, any>[];
    detectedDelimiter: string;
}

interface ImportConfig {
    bankAccountId: string;
    mappings: {
        date: string;
        amount: string;
        description: string;
        currency?: string;
    };
    dateFormat: string;
    amountFormat: 'standard' | 'negate' | 'sign_column';
    signColumn?: string;
    skipRows: number;
    delimiter?: string;
}

// Ensure mappings always has all required keys, even if empty initially
type ConfigState = Partial<Omit<ImportConfig, 'mappings'>> & {
    mappings: Partial<ImportConfig['mappings']> & Required<Pick<ImportConfig['mappings'], 'date' | 'amount' | 'description'>>;
};

const ImportTransactionsPage: React.FC = () => {
    const { token } = useAuth(); // Get JWT token from context
    const [file, setFile] = useState<File | null>(null);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [config, setConfig] = useState<ConfigState>({
        mappings: { date: '', amount: '', description: '' }, 
        dateFormat: 'YYYY-MM-DD', // Default example
        amountFormat: 'standard',
        skipRows: 0,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Fetch bank accounts on component mount
    useEffect(() => {
        const fetchBankAccounts = async () => {
            if (!token) return;
            setIsLoading(true);
            try {
                const response = await fetch('/api/bank-accounts', { // Ensure correct API URL if needed
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch bank accounts');
                }
                const data = await response.json();
                setBankAccounts(data.bankAccounts || []);
            } catch (error: any) {
                setFeedback({ type: 'error', message: `Error fetching accounts: ${error.message}` });
            } finally {
                setIsLoading(false);
            }
        };

        fetchBankAccounts();
    }, [token]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setAnalysisResult(null); // Reset analysis if new file is chosen
            setFeedback(null);
            // Automatically trigger analysis
            handleAnalyze(selectedFile);
        }
    };

    const handleAnalyze = async (selectedFile: File) => {
        if (!selectedFile || !token) return;

        setIsLoading(true);
        setFeedback(null);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('/api/transactions/analyze', { // Use relative path to proxy via Next.js
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Analysis failed');
            }

            setAnalysisResult(result);
            // Pre-fill delimiter if detected
            if (result.detectedDelimiter) {
                setConfig(prev => ({ ...prev, delimiter: result.detectedDelimiter, mappings: { ...prev.mappings } })); // Ensure mappings is spread
            }
        } catch (error: any) {
            setFeedback({ type: 'error', message: `Analysis Error: ${error.message}` });
            setAnalysisResult(null); // Clear results on error
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfigChange = (field: keyof ImportConfig | `mappings.${keyof ImportConfig['mappings']}` , value: string | number) => {
        setConfig(prev => {
            let updatedConfig = { ...prev };

            if (field.startsWith('mappings.')) {
                const mappingField = field.split('.')[1] as keyof ImportConfig['mappings'];
                // Update nested mapping field
                updatedConfig = {
                    ...prev,
                    mappings: {
                        ...prev.mappings, // Spread previous mappings first
                        [mappingField]: String(value) // Override specific field
                    }
                };
            } else if (field === 'skipRows') {
                updatedConfig[field] = Number(value);
            } else {
                // Handle other top-level fields (bankAccountId, dateFormat, amountFormat, signColumn, delimiter)
                // Need to cast field to keyof ConfigState for type safety
                updatedConfig[field as keyof Omit<ImportConfig, 'mappings'>] = String(value) as any; // Use `as any` carefully or refine types
            }
            
            // Reset signColumn
            if (field === 'amountFormat' && value !== 'sign_column') {
                updatedConfig.signColumn = undefined;
            }
            
            return updatedConfig;
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!file || !analysisResult || !token || !config.bankAccountId || !config.mappings?.date || !config.mappings?.amount || !config.mappings?.description || !config.dateFormat || !config.amountFormat) {
            setFeedback({ type: 'error', message: 'Please upload a file, ensure analysis is complete, and fill all required configuration fields.' });
            return;
        }

        setIsLoading(true);
        setFeedback(null);

        const submitConfig: ImportConfig = {
            bankAccountId: config.bankAccountId!,
            mappings: {
                date: config.mappings.date!,
                amount: config.mappings.amount!,
                description: config.mappings.description!,
                currency: config.mappings.currency,
            },
            dateFormat: config.dateFormat!,
            amountFormat: config.amountFormat!,
            signColumn: config.amountFormat === 'sign_column' ? config.signColumn : undefined,
            skipRows: Number(config.skipRows || 0),
            delimiter: config.delimiter || undefined, 
        };

        const importData = new FormData();
        importData.append('file', file);
        importData.append('config', JSON.stringify(submitConfig));

        try {
            const response = await fetch('/api/transactions/import', { // Use relative path
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: importData,
            });

            const result = await response.json();

            if (!response.ok) {
                // Provide more specific feedback if available
                const errorDetails = result.details ? ` Details: ${JSON.stringify(result.details)}` : '';
                throw new Error(result.error || 'Import failed' + errorDetails);
            }

            setFeedback({ type: 'success', message: result.message || 'Import successful!' });
            // Optionally clear form/file after successful import
            setFile(null);
            setAnalysisResult(null);
            setConfig({
                mappings: { date: '', amount: '', description: '' }, 
                dateFormat: 'YYYY-MM-DD', 
                amountFormat: 'standard', 
                skipRows: 0,
                bankAccountId: undefined, // Clear selected account
                signColumn: undefined,
                delimiter: undefined
            });
        } catch (error: any) {
            setFeedback({ type: 'error', message: `Import Error: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold">Import Transactions from CSV</h1>

            {/* Feedback Area */}
            {feedback && (
                <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
                    <AlertTitle>{feedback.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
                    <AlertDescription>{feedback.message}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Step 1: Upload CSV File</CardTitle>
                    <CardDescription>Select the CSV file containing your bank transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Input type="file" accept=".csv" onChange={handleFileChange} disabled={isLoading} />
                </CardContent>
            </Card>

            {isLoading && (
                <div className="flex justify-center items-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Processing...</span>
                </div>
            )}

            {analysisResult && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 2: Configure Import</CardTitle>
                            <CardDescription>Map the columns from your CSV file and specify formats.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Bank Account Selection */}
                            <div>
                                <Label htmlFor="bankAccount">Target Bank Account *</Label>
                                <Select 
                                    onValueChange={(value) => handleConfigChange('bankAccountId', value)}
                                    value={config.bankAccountId || ''}
                                    required
                                >
                                    <SelectTrigger id="bankAccount">
                                        <SelectValue placeholder="Select account..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bankAccounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Column Mappings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['date', 'amount', 'description', 'currency'].map(field => (
                                    <div key={field}>
                                        <Label htmlFor={`map-${field}`}>Map "{field}"{field !== 'currency' ? ' *' : ' (Optional)'}</Label>
                                        <Select 
                                            onValueChange={(value) => handleConfigChange(`mappings.${field as keyof ImportConfig['mappings']}`, value)}
                                            value={config.mappings?.[field as keyof ImportConfig['mappings']] || ''}
                                            required={field !== 'currency'}
                                        >
                                            <SelectTrigger id={`map-${field}`}>
                                                <SelectValue placeholder="Select CSV column..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {analysisResult.headers.map(header => (
                                                    <SelectItem key={header} value={header}>{header}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>

                            {/* Format Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="dateFormat">Date Format *</Label>
                                    <Input 
                                        id="dateFormat" 
                                        value={config.dateFormat || ''} 
                                        onChange={e => handleConfigChange('dateFormat', e.target.value)} 
                                        placeholder="e.g., YYYY-MM-DD, MM/DD/YYYY"
                                        required 
                                    />
                                    <p className="text-sm text-muted-foreground">Use YYYY, MM, DD. Example: DD.MM.YYYY</p>
                                </div>
                                <div>
                                    <Label htmlFor="amountFormat">Amount Format *</Label>
                                    <Select 
                                        onValueChange={(value) => handleConfigChange('amountFormat', value)}
                                        value={config.amountFormat || ''}
                                        required
                                    >
                                        <SelectTrigger id="amountFormat">
                                            <SelectValue placeholder="Select amount format..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="standard">Standard (e.g., 100.00, -50.00)</SelectItem>
                                            <SelectItem value="negate">Negate all values (e.g., Expenses are 50.00)</SelectItem>
                                            <SelectItem value="sign_column">Separate Sign Column</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {config.amountFormat === 'sign_column' && (
                                    <div>
                                        <Label htmlFor="signColumn">Sign Column *</Label>
                                        <Select 
                                            onValueChange={(value) => handleConfigChange('signColumn', value)}
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
                                        <p className="text-sm text-muted-foreground">Column indicating Debit/Credit (e.g., 'D'/'C')</p>
                                    </div>
                                )}
                            </div>

                            {/* Other Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="skipRows">Header Rows to Skip</Label>
                                    <Input 
                                        id="skipRows" 
                                        type="number"
                                        min="0"
                                        value={config.skipRows || 0} 
                                        onChange={e => handleConfigChange('skipRows', parseInt(e.target.value, 10) || 0)} 
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="delimiter">Delimiter (Optional)</Label>
                                    <Input 
                                        id="delimiter" 
                                        value={config.delimiter || ''} 
                                        onChange={e => handleConfigChange('delimiter', e.target.value)} 
                                        placeholder={`Detected: ${analysisResult.detectedDelimiter || 'Comma (,)'}`} 
                                    />
                                    <p className="text-sm text-muted-foreground">Leave blank to auto-detect.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Preview Data</CardTitle>
                            <CardDescription>First {analysisResult.previewRows.length} rows from your file.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {analysisResult.headers.map(header => (
                                                <TableHead key={header}>{header}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {analysisResult.previewRows.map((row, index) => (
                                            <TableRow key={index}>
                                                {analysisResult.headers.map(header => (
                                                    <TableCell key={header}>{String(row[header])}</TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</> : 'Import Transactions'}
                    </Button>
                </form>
            )}
        </div>
    );
};

export default ImportTransactionsPage; 