import { ToastProvider } from "@/components/ui/toast";

export default function LunchMoneyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        <main className="flex-1">{children}</main>
      </div>
    </ToastProvider>
  );
} 