'use client';

import React, { Fragment, useState } from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CsvImportProfile } from '@/app/api/import-profiles/route';

interface SaveProfilePromptProps {
    lastSuccessfulConfig: Omit<CsvImportProfile['config'], 'id'> | null;
    importProfiles: CsvImportProfile[];
    onSaveNewProfile: (name: string) => void;
    onUpdateProfile: (profileId: string) => void;
    onSkipSave: () => void;
    isSavingProfile: boolean; // Covers both create and update pending
    saveError: Error | null; // Error from create or update mutation
}

const SaveProfilePrompt: React.FC<SaveProfilePromptProps> = ({
    lastSuccessfulConfig,
    importProfiles,
    onSaveNewProfile,
    onUpdateProfile,
    onSkipSave,
    isSavingProfile,
    saveError
}) => {
    const [postImportProfileName, setPostImportProfileName] = useState('');
    // Selection state: '__CREATE__', '__SKIP__', or profile.id
    const [postImportSaveSelection, setPostImportSaveSelection] = useState<string | null>('__SKIP__');

    const handleSaveNewClick = () => {
        if (postImportProfileName.trim()) {
            onSaveNewProfile(postImportProfileName.trim());
        }
    };

    const handleSelectionChange = (value: string | null) => {
        setPostImportSaveSelection(value);
        // Clear name input if not creating
        if (value !== '__CREATE__') {
            setPostImportProfileName('');
        }
        // If an existing profile ID is selected, trigger update immediately
        const selectedExistingProfile = importProfiles.find(p => p.id === value);
        if (selectedExistingProfile) {
             console.log("Updating existing profile via dropdown:", selectedExistingProfile.name);
             onUpdateProfile(selectedExistingProfile.id);
        } else if (value === '__SKIP__') {
            onSkipSave();
        }
    };

    if (!lastSuccessfulConfig) return null; // Don't render if config isn't available

    return (
        <div className="card-style p-4 space-y-3 bg-green-50 border border-green-300">
            <div className="alert-success mb-3">
                 <Check className="h-5 w-5" />
                 <div>
                     <h5 className="font-bold">Import Successful!</h5>
                 </div>
             </div>
             
            <p className="text-sm font-medium text-gray-700">Save these import settings for next time?</p>
            
            <Listbox 
                value={postImportSaveSelection} 
                onChange={handleSelectionChange} // Use internal handler
                disabled={isSavingProfile}
            >
                 <div className="relative mt-1">
                    <ListboxButton className="listbox-button-style">
                         <span className="block truncate">
                            {postImportSaveSelection === '__CREATE__' ? 'Create New Profile...' : 
                             postImportSaveSelection === '__SKIP__' ? '-- Select Action --' : 
                             `Update: ${importProfiles.find(p => p.id === postImportSaveSelection)?.name ?? '...'}`
                             }
                         </span>
                         <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                             <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                         </span>
                     </ListboxButton>
                     <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                         <ListboxOptions className="listbox-options-style z-20">
                             <ListboxOption value="__SKIP__" className={({ active }) => `listbox-option-style ${active ? 'bg-primary/10 text-primary' : 'text-gray-900'}`}>
                                  <span>-- Select Action --</span> 
                              </ListboxOption>
                              <ListboxOption value="__CREATE__" className={({ active }) => `listbox-option-style ${active ? 'bg-primary/10 text-primary' : 'text-gray-900'}`}>
                                  <span>Create New Profile...</span> 
                              </ListboxOption>
                              {importProfiles.length > 0 && <div className="relative cursor-default select-none py-1 px-4 text-gray-500 text-xs">Update Existing</div>}
                              {importProfiles.map((profile) => (
                                  <ListboxOption key={profile.id} value={profile.id} className={({ active }) => `listbox-option-style ${active ? 'bg-primary/10 text-primary' : 'text-gray-900'}`}>
                                      <span>Update: {profile.name}</span>
                                  </ListboxOption>
                              ))}
                         </ListboxOptions>
                     </Transition>
                 </div>
            </Listbox>

            {postImportSaveSelection === '__CREATE__' && (
                <div className="flex items-center space-x-2 pt-2">
                    <input 
                        type="text"
                        placeholder="Enter new profile name"
                        value={postImportProfileName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setPostImportProfileName(e.target.value);
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm input-style flex-grow"
                        disabled={isSavingProfile}
                    />
                    <Button
                        type="button"
                        onClick={handleSaveNewClick}
                        disabled={isSavingProfile || !postImportProfileName.trim()}
                        className="whitespace-nowrap text-sm"
                    >
                        {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save New
                    </Button>
                </div>
            )}
            
             {saveError && (
                 <p className="mt-1 text-xs text-red-600">
                    {saveError.message}
                 </p>
             )}
        </div>
    );
};

export default SaveProfilePrompt; 