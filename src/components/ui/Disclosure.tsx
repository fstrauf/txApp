import React from 'react';
import { Disclosure as HeadlessDisclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

interface DisclosureProps {
  buttonContent: React.ReactNode;
  panelContent: React.ReactNode;
  defaultOpen?: boolean;
  buttonClassName?: string;
  panelClassName?: string;
  className?: string;
}

export const Disclosure: React.FC<DisclosureProps> = ({
  buttonContent,
  panelContent,
  defaultOpen = false,
  buttonClassName = '',
  panelClassName = '',
  className = '',
}) => {
  return (
    <HeadlessDisclosure as="div" defaultOpen={defaultOpen} className={className}>
      {({ open }) => (
        <>
          <DisclosureButton
            className={`
              flex w-full items-center justify-between rounded-lg 
              bg-gray-100 dark:bg-gray-800 px-4 py-3 text-left text-sm font-medium 
              text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 
              focus:outline-none focus-visible:ring focus-visible:ring-purple-500 
              focus-visible:ring-opacity-75 group
              transition-colors duration-150 ease-in-out
              ${buttonClassName}
            `}
          >
            {buttonContent}
            <ChevronDownIcon
              className={`
                h-6 w-6 text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2
                transform transition-transform duration-200 ease-in-out
                group-data-[open]:rotate-180
              `}
            />
          </DisclosureButton>
          <DisclosurePanel className={panelClassName}>
            <div className="px-4 pt-4 pb-2 text-sm text-gray-700 dark:text-gray-300">
              {panelContent}
            </div>
          </DisclosurePanel>
        </>
      )}
    </HeadlessDisclosure>
  );
}; 