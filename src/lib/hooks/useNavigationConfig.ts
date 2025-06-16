'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { 
  CreditCardIcon,
  ChartBarIcon,
  BuildingLibraryIcon,
  DocumentTextIcon,
  CpuChipIcon,
  ArrowDownTrayIcon,
  LinkIcon,
  KeyIcon,
  UserIcon,
  HandRaisedIcon,
  BanknotesIcon,
  LightBulbIcon,
  ChartPieIcon,
  FlagIcon,
  SparklesIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

export interface NavigationItem {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// Standard navigation items for most pages
const standardNavItems: NavigationItem[] = [
  {
    href: "/personal-finance",
    label: "Financial Check",
    icon: CreditCardIcon,
  },
  {
    href: "/integrations",
    label: "Templates",
    icon: DocumentTextIcon,
  },
  {
    href: "/lunchmoney",
    label: "LunchMoney",
    icon: BuildingLibraryIcon,
  },
  {
    href: "/fuck-you-money-sheet",
    label: "F-You Money Sheet",
    icon: ChartBarIcon,
  },
  {
    href: "/api-landing",
    label: "Try Our API",
    icon: LinkIcon,
  },
  {
    href: "/api-key",
    label: "API Key",
    icon: KeyIcon,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserIcon,
  },
];

// Personal finance mobile navigation items
const personalFinanceNavItems: NavigationItem[] = [
  {
    href: "/personal-finance?screen=welcome",
    label: "Welcome",
    icon: HandRaisedIcon,
  },
  {
    href: "/personal-finance?screen=income",
    label: "Income",
    icon: BanknotesIcon,
  },
  {
    href: "/personal-finance?screen=spending",
    label: "Spending",
    icon: CreditCardIcon,
  },
  {
    href: "/personal-finance?screen=savings",
    label: "Savings",
    icon: BuildingLibraryIcon,
  },
  {
    href: "/personal-finance?screen=initialInsights",
    label: "Your Insights",
    icon: LightBulbIcon,
  },
  {
    href: "/personal-finance?screen=spendingAnalysisUpload",
    label: "Spending Analysis",
    icon: ChartBarIcon,
  },
  {
    href: "/personal-finance?screen=spendingAnalysisResults",
    label: "Spending Results",
    icon: ChartPieIcon,
  },
  {
    href: "/personal-finance?screen=savingsAnalysisInput",
    label: "Savings Analysis",
    icon: FlagIcon,
  },
  {
    href: "/personal-finance?screen=whatHappensNext",
    label: "What Happens Next",
    icon: SparklesIcon,
  },
  {
    href: "/personal-finance?screen=progressSimulator",
    label: "Progress Simulator",
    icon: TrophyIcon,
  },
];

export interface NavigationConfig {
  mobileMenuItems: NavigationItem[];
  showMobileHamburger: boolean;
  useSpecializedSidebar: boolean;
}

export function useNavigationConfig(): NavigationConfig {
  const pathname = usePathname();

  return useMemo(() => {
    // Check if we're on a personal finance page
    if (pathname.startsWith('/personal-finance')) {
      return {
        mobileMenuItems: personalFinanceNavItems,
        showMobileHamburger: true,
        useSpecializedSidebar: true, // Still use PersonalFinanceSidebar for desktop
      };
    }

    // For all other pages, use standard navigation
    return {
      mobileMenuItems: standardNavItems,
      showMobileHamburger: true,
      useSpecializedSidebar: false,
    };
  }, [pathname]);
}

export function useIsPersonalFinancePage(): boolean {
  const pathname = usePathname();
  return pathname.startsWith('/personal-finance');
}
