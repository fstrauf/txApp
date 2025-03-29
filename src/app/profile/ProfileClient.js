"use client";

import Image from "next/image";
import { signOut } from "next-auth/react";

// Use a data URL for the default avatar to avoid domain configuration issues
const defaultPicture = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

export default function ProfileClient({ user }) {
  if (!user) {
    return null;
  }

  // Handle logout with NextAuth
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="bg-gradient-to-br from-first via-second to-third min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-third p-6 rounded-xl shadow-lg text-white">
        <h1 className="text-2xl font-semibold mb-4">Profile Page</h1>
        <div className="flex items-center">
          <Image
            src={user.image || defaultPicture}
            alt="Profile"
            className="w-20 h-20 rounded-full mr-4"
            width={80}
            height={80}
          />
          <div>
            <h2 className="text-xl font-semibold">{user.name || 'User'}</h2>
            <span className="text-white">{user.email}</span>
          </div>
        </div>
        <div className="mt-8 border-t pt-4">
          <a
            href="/api-key"
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark inline-block mt-4 mr-2"
          >
            Manage API Key
          </a>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 inline-block mt-4"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
