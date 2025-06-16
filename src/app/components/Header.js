"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { NavBarButtons } from "@/app/components/nav-bar-buttons";
import { MobileMenu } from "@/components/navigation/MobileMenu";
import { useNavigationConfig } from "@/lib/hooks/useNavigationConfig";
import { useMobileNavigation } from "@/contexts/MobileNavigationContext";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigationConfig = useNavigationConfig();
  const { setIsMobileMenuOpen: setGlobalMobileMenuOpen } = useMobileNavigation();

  const handleMobileMenuToggle = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    setGlobalMobileMenuOpen(newState);
  };

  return (
    <header className="w-full bg-surface shadow-soft sticky top-0 z-50">
      <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between">
        <div className="flex items-center justify-between w-full sm:w-auto mb-4 sm:mb-0">
          <Link href="/" className="flex items-center">
            <Image
              width={220}
              height={40}
              src="/expense_sorted.svg"
              alt="Expense Sorted"
              className="w-[160px] h-auto"
              priority
            />
          </Link>
          
          {/* Mobile hamburger menu - always show on mobile */}
          {navigationConfig.showMobileHamburger && (
            <button 
              className="sm:hidden block text-gray-600 hover:text-primary transition-colors" 
              onClick={handleMobileMenuToggle}
            >
              <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3 5h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
        
        {/* Desktop navigation - unchanged */}
        <nav className="sm:flex hidden">
          <NavBarButtons />
        </nav>
      </div>

      {/* Mobile Menu Component */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => {
          setIsMobileMenuOpen(false);
          setGlobalMobileMenuOpen(false);
        }}
        menuItems={navigationConfig.mobileMenuItems}
      />
    </header>
  );
}
