import { usePathname } from 'next/navigation';

export const LoginButton = () => {
  const pathname = usePathname()

  return (
    <a
      className="px-6 py-3 rounded-lg bg-white text-primary border border-primary/10 text-base font-medium hover:bg-gray-50 transition-all duration-200 min-h-[44px] flex items-center justify-center"
      href={`/auth/signin?callbackUrl=${pathname}`}
    >
      Log In
    </a>
  );
};