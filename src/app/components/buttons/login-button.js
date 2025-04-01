import { usePathname } from 'next/navigation';

export const LoginButton = () => {
  const pathname = usePathname()

  return (
    <a
      className="px-4 py-2 rounded-lg bg-white text-primary border border-primary/10 text-sm font-medium hover:bg-gray-50 transition-all duration-200"
      href={`/auth/signin?callbackUrl=${pathname}`}
    >
      Log In
    </a>
  );
};