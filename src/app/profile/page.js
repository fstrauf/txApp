import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";

export default async function ProfilePage() {
  const session = await getServerSession(authConfig);
  
  if (!session) {
    redirect("/auth/signin");
  }
  
  return <ProfileClient user={session.user} />;
}
