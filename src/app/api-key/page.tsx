import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";
import ApiKeyManager from "./ApiKeyManager";
import { redirect } from "next/navigation";

export default async function ApiKeyPage() {
  const session = await getServerSession(authConfig);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/api-key");
  }
  
  return (
    <div className="min-h-screen bg-background-default">
      <main className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="bg-surface rounded-2xl shadow-soft p-8 space-y-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary-dark via-primary to-secondary animate-gradient">
            API Key Management
          </h1>
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-gray-700 text-center mb-8">
              Generate and manage your API key to use with the Google Sheets™ integration.
            </p>
            <ApiKeyManager userId={session.user.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
