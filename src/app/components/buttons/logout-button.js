import { signOut } from "next-auth/react";

export const LogoutButton = () => {
  return (
    <button
      className="px-6 py-3 rounded-xl bg-white text-primary border border-primary/10 font-semibold hover:bg-gray-50 transition-all duration-200 shadow-soft flex items-center justify-center"
      onClick={() => signOut({ callbackUrl: '/' })}
    >
      Log Out
    </button>
  );
};
