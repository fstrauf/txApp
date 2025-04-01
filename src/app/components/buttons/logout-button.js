import { signOut } from "next-auth/react";

export const LogoutButton = () => {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-all duration-200"
    >
      Log Out
    </button>
  );
};
