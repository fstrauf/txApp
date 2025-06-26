'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LoginButton } from '@/app/components/buttons/login-button';
import { SignupButton } from '@/app/components/buttons/signup-button';
import { LogoutButton } from '@/app/components/buttons/logout-button';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: Array<{
    href: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
}

export function MobileMenu({ isOpen, onClose, menuItems }: MobileMenuProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-sm">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200">
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Menu
                      </Dialog.Title>
                      <button
                        type="button"
                        className="relative rounded-md p-3 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        onClick={onClose}
                      >
                        <span className="absolute -inset-2.5" />
                        <span className="sr-only">Close menu</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Navigation Items */}
                    <div className="flex-1 px-4 py-6">
                      <nav className="space-y-1">
                        {menuItems.map((item) => {
                          const isActive = pathname === item.href || 
                            (item.href !== '/' && pathname.startsWith(item.href));
                          
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={onClose}
                              className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                                isActive
                                  ? 'text-primary bg-primary/5 border border-primary/20'
                                  : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                              }`}
                            >
                              {item.icon && (
                                <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                              )}
                              {item.label}
                            </Link>
                          );
                        })}
                      </nav>
                    </div>

                    {/* Authentication Section */}
                    <div className="border-t border-gray-200 p-4">
                      <div className="space-y-3">
                        {!session?.user ? (
                          <>
                            <div className="w-full">
                              <SignupButton />
                            </div>
                            <div className="w-full">
                              <LoginButton />
                            </div>
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div className="text-sm text-gray-600">
                              Signed in as {session.user.email}
                            </div>
                            <div className="w-full">
                              <LogoutButton />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
