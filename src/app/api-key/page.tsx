import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";
import { redirect } from "next/navigation";
import ApiKeyPageClientWrapper from "./ApiKeyPageClientWrapper";
import ApiKeyPageView from "./ApiKeyPageView";

export default async function ApiKeyPage() {
  const session = await getServerSession(authConfig);
  
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/api-key");
  }
  
  return (
    <ApiKeyPageClientWrapper>
      <ApiKeyPageView userId={session.user.id} />
    </ApiKeyPageClientWrapper>
  );
}
