'use client';

import React, { Fragment } from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Assuming Category and related types are defined/imported appropriately
interface Category {
    id: string;
    name: string;
}

interface CategoryMapping {
    targetId: string | null | '__CREATE__';
    newName?: string;
}

interface CategoryMappingSectionProps {
    uniqueCsvCategories: string[];
    userCategories: Category[];
    categoryMappings: Record<string, CategoryMapping>;
    onCategoryMappingChange: (csvCategoryName: string, update: CategoryMapping) => void;
    // onCreateCategory: (csvCategoryName: string, newName: string) => void; // Maybe handle creation outside?
    onProceed: () => void; // Proceed to final import
    onBack: () => void; // Go back to config step
    isLoading: boolean; // General loading state
    isCreatingCategory: boolean; // Specific state for category creation mutation
    createCategoryError: Error | null; // Error from category creation
}

const CategoryMappingSection: React.FC<CategoryMappingSectionProps> = ({
    uniqueCsvCategories,
    userCategories,
    categoryMappings,
    onCategoryMappingChange,
    onProceed,
    onBack,
    isLoading,
    isCreatingCategory,
    createCategoryError
}) => {

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

    // Validation logic could potentially live here or be passed down
    // For now, assume validation happens before calling onProceed in the parent

    return (
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
                    {/* Add loading/error state for userCategories if needed */} 
                    {/* {isLoadingCategories && <p>Loading categories...</p>} */} 
                    {/* {categoriesError && <p className="text-red-600">Error loading categories: {categoriesError.message}</p>} */} 

                    {/* {!isLoadingCategories && !categoriesError && */ uniqueCsvCategories.map((csvCat) => (
                        <div key={csvCat} className="grid grid-cols-[1fr_2fr] gap-4 items-start pt-3">
                            <div className="font-medium text-sm pt-2 truncate" title={csvCat}>{csvCat}</div>
                            <div className="w-full">
                                <Listbox
                                    value={categoryMappings[csvCat]?.targetId ?? '__SKIP__'} // Default to skip if no mapping
                                    onChange={(selectedValue) => {
                                        const targetId = selectedValue === '__SKIP__' ? null : selectedValue;
                                        const update: CategoryMapping = { 
                                            targetId, 
                                            // Keep existing newName if target is __CREATE__, clear otherwise
                                            newName: targetId === '__CREATE__' ? (categoryMappings[csvCat]?.newName || csvCat) : '' 
                                        };
                                        onCategoryMappingChange(csvCat, update);
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
                                            onChange={(e) => onCategoryMappingChange(csvCat, { targetId: '__CREATE__', newName: e.target.value })}
                                             className="input-style w-full text-sm"
                                             disabled={isLoading || isCreatingCategory}
                                        />
                                    </div>
                                )}
                                {/* Display create error specifically for this category? Requires more complex error handling state */}
                                {/* {createCategoryMutation.isError && createCategoryMutation.variables?.csvCategoryName === csvCat && ( */}
                                {/*     <p className="text-xs text-red-600 mt-1">Creation failed: {createCategoryMutation.error.message}</p> */}
                                {/* )} */}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Display general category creation error if needed */} 
            {createCategoryError && (
                 <p className="text-xs text-red-600 mt-1">Error during category creation: {createCategoryError.message}</p>
             )}

            {/* --- Buttons --- */}
            <div className="flex space-x-4">
                <Button
                    type="button"
                    onClick={onBack}
                    disabled={isLoading}
                    className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500"
                >
                    Back to Configuration
                </Button>
                <Button
                    type="button"
                    onClick={onProceed} // Assume validation is done before calling this
                    disabled={isLoading || isCreatingCategory} // Disable if general loading or creating category
                >
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Import Transactions'}
                </Button>
            </div>
        </div>
    );
};

export default CategoryMappingSection; 