'use client';

import React, { Fragment } from 'react';
import { Combobox, Label, Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CsvImportProfile } from '@/app/api/import-profiles/route';
import { commonDateFormats, amountFormatOptions, mappingOptions } from '../page';
import { BankAccount, MappedFieldType, ConfigState, AnalysisResult } from '../page';

interface ConfigurationSectionProps {
    config: ConfigState;
    onConfigChange: <K extends keyof ConfigState>(field: K, value: ConfigState[K] | undefined) => void;
    onMappingChange: (csvHeader: string, fieldType: MappedFieldType) => void;
    bankAccounts: BankAccount[];
    selectedBankAccount: BankAccount | null;
    onBankAccountChange: (account: BankAccount | null) => void;
    onBankAccountQueryChange: (query: string) => void;
    bankAccountQuery: string;
    onBankAccountCreate: (name: string) => void;
    isCreatingBankAccount: boolean;
    createBankAccountError: Error | null;
    importProfiles: CsvImportProfile[];
    selectedProfile: CsvImportProfile | null;
    onProfileChange: (profile: CsvImportProfile | null) => void;
    isLoadingProfiles: boolean;
    analysisResult: AnalysisResult | null;
    onProceed: (event: React.MouseEvent<HTMLButtonElement>) => void;
    isLoading: boolean;
}

const ConfigurationSection: React.FC<ConfigurationSectionProps> = ({
    config,
    onConfigChange,
    onMappingChange,
    bankAccounts,
    selectedBankAccount,
    onBankAccountChange,
    onBankAccountQueryChange,
    bankAccountQuery,
    onBankAccountCreate,
    isCreatingBankAccount,
    createBankAccountError,
    importProfiles,
    selectedProfile,
    onProfileChange,
    isLoadingProfiles,
    analysisResult,
    onProceed,
    isLoading
}) => {

    if (!analysisResult) {
        // Optionally render a message or skeleton if analysis isn't done yet
        return <p>Waiting for file analysis...</p>; 
    }

    const filteredBankAccounts =
        bankAccountQuery === ''
        ? bankAccounts
        : bankAccounts.filter((account) =>
            account.name.toLowerCase().includes(bankAccountQuery.toLowerCase())
        );

    const queryMatchesExisting = bankAccounts.some(acc => acc.name.toLowerCase() === bankAccountQuery.toLowerCase());
    const isValidNewName = bankAccountQuery.trim() !== '' && !queryMatchesExisting;

    return (
        <div className="space-y-6"> 
            {/* --- 2a: Configure Settings --- */}
            <div className="card-style">
                 <div className="card-header-style">
                    <h3 className="card-title-style">Step 2: Configure Import Settings</h3>
                     <p className="card-description-style">Select an existing profile or configure manually. Map columns in the preview below.</p>
                 </div>
                <div className="p-6 pt-0 space-y-4">
                    {/* --- Profile Selection --- */}
                    <div className="space-y-2 p-4 border border-blue-200 rounded-md bg-blue-50/30">
                        <h4 className="text-sm font-medium text-blue-800">Import Profiles (Optional)</h4>
                        <div>
                             <Listbox value={selectedProfile} onChange={onProfileChange} by="id" disabled={isLoading || isLoadingProfiles} >
                                <Label className="block text-sm font-medium text-gray-700 mb-1">Load Settings from Profile</Label>
                                 <div className="relative mt-1">
                                     <ListboxButton className="listbox-button-style">
                                         <span className="block truncate">{selectedProfile?.name ?? (isLoadingProfiles ? 'Loading profiles...' : 'Manual Configuration')}</span>
                                         <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                             <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                         </span>
                                     </ListboxButton>
                                     <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                         <ListboxOptions className="listbox-options-style z-20">
                                             <ListboxOption value={null} className={({ active }) => `listbox-option-style ${active ? 'bg-primary/10 text-primary' : 'text-gray-900'}`}>
                                                  {({ selected }) => (
                                                      <>
                                                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>-- Manual Configuration --</span>
                                                          {selected ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary"><Check className="h-5 w-5" aria-hidden="true" /></span> : null}
                                                      </>
                                                  )}
                                             </ListboxOption>
                                             {importProfiles.map((profile) => (
                                                 <ListboxOption key={profile.id} value={profile} className={({ active }) => `listbox-option-style ${active ? 'bg-primary/10 text-primary' : 'text-gray-900'}`}>
                                                     {({ selected }) => (
                                                         <>
                                                             <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{profile.name}</span>
                                                             {selected ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary"><Check className="h-5 w-5" aria-hidden="true" /></span> : null}
                                                         </>
                                                     )}
                                                 </ListboxOption>
                                             ))}
                                             {importProfiles.length === 0 && !isLoadingProfiles && (
                                                 <div className="relative cursor-default select-none py-2 px-4 text-gray-700">No saved profiles found.</div>
                                             )}
                                         </ListboxOptions>
                                     </Transition>
                                 </div>
                             </Listbox>
                        </div>
                    </div>
                    {/* --- End Profile Selection --- */}

                    {/* --- Bank Account Combobox --- */}
                    <div>
                         <Combobox value={selectedBankAccount} onChange={onBankAccountChange} by="id" nullable disabled={isLoading || isCreatingBankAccount}>
                             {({ open }) => (
                                <div className="relative mt-1">
                                    <Combobox.Label className="block text-sm font-medium text-gray-700 mb-1">Target Bank Account *</Combobox.Label>
                                    <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/10 sm:text-sm">
                                        <Combobox.Input
                                             className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                                             onChange={(event) => onBankAccountQueryChange(event.target.value)}
                                             displayValue={(account: BankAccount | null) => account?.name ?? ""}
                                             placeholder="Select or type to create..."
                                             autoComplete='off'
                                        />
                                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
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
                                                    value={{ id: '__create__', name: bankAccountQuery } as any} // Use as any cautiously or define a proper type
                                                    className={({ active }) => `relative cursor-pointer select-none py-2 px-4 ${active ? 'bg-primary text-white' : 'text-gray-900'}`}
                                                    onClick={() => onBankAccountCreate(bankAccountQuery.trim())}
                                                >
                                                     Create "{bankAccountQuery.trim()}"
                                                     {isCreatingBankAccount && (
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
                         {createBankAccountError && (
                             <p className="mt-1 text-xs text-red-600">Creation failed: {createBankAccountError.message}</p>
                         )}
                     </div>
                    {/* --- End Bank Account Combobox --- */}

                    {/* --- Format Settings --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <Listbox value={config.dateFormat} onChange={(value) => onConfigChange('dateFormat', value)} disabled={isLoading}>
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
                             <Listbox value={config.amountFormat} onChange={(value) => onConfigChange('amountFormat', value)} disabled={isLoading}>
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
                                 <Listbox value={config.signColumn} onChange={(value) => onConfigChange('signColumn', value)} disabled={isLoading}>
                                     <Label className="block text-sm font-medium text-gray-700 mb-1">Sign Column *</Label>
                                     <div className="relative mt-1">
                                         <ListboxButton className="listbox-button-style">
                                             <span className="block truncate">{config.signColumn ?? 'Select sign column...'}</span>
                                              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" /></span>
                                         </ListboxButton>
                                         <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                             <ListboxOptions className="listbox-options-style">
                                                 {analysisResult.headers.map(header => (
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
                    {/* --- End Format Settings --- */}

                    {/* --- Other Settings --- */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="skipRows" className="block text-sm font-medium text-gray-700 mb-1">Header Rows to Skip</label>
                            <input
                                id="skipRows"
                                type="number"
                                min="0"
                                value={config.skipRows || 0}
                                onChange={(e) => onConfigChange('skipRows', parseInt(e.target.value, 10) || 0)}
                                className="input-style"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label htmlFor="delimiter" className="block text-sm font-medium text-gray-700 mb-1">Delimiter (Optional)</label>
                            <input
                                id="delimiter"
                                value={config.delimiter || ''}
                                onChange={(e) => onConfigChange('delimiter', e.target.value)}
                                placeholder={`Detected: ${analysisResult.detectedDelimiter || 'Comma (,)'}`}
                                className="input-style"
                                disabled={isLoading}
                            />
                            <p className="text-sm text-muted-foreground mt-1">Leave blank to auto-detect.</p>
                        </div>
                    </div>
                    {/* --- End Other Settings --- */}
                </div>
            </div>

            {/* --- 3: Preview & Map Columns --- */}
            <div className="card-style">
                 <div className="card-header-style">
                     <h3 className="card-title-style">Step 3: Preview Data & Map Columns</h3>
                     <p className="card-description-style">Review the first {analysisResult.previewRows.length} rows and map columns.</p>
                 </div>
                 <div className="p-6 pt-0">
                     <div className="relative w-full overflow-auto">
                         <table className="w-full caption-bottom text-sm">
                             <thead className="[&_tr]:border-b">
                                 <tr className="border-b">
                                      {analysisResult.headers.map(header => (
                                          <th key={header} className="h-12 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap pt-2 pb-1 border-r last:border-r-0">
                                              <div className="font-semibold mb-1 text-gray-800 truncate" title={header}>{header}</div>
                                               <Listbox value={config.mappings[header] || 'none'} onChange={(value) => onMappingChange(header, value)} disabled={isLoading}>
                                                  <div className="relative mt-1 max-w-48">
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
                                  {analysisResult.previewRows.map((row, index) => (
                                     <tr key={index} className="border-b hover:bg-muted/50">
                                         {analysisResult.headers.map(header => (
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
             {/* --- End Preview & Map Columns --- */}

            {/* --- Button to Proceed --- */}
            <Button
                type="button"
                onClick={onProceed}
                disabled={isLoading || !selectedBankAccount}
                className="mt-6 w-full md:w-auto"
            >
                 Review & Import
             </Button>
        </div>
    );
};

export default ConfigurationSection; 