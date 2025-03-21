import { ToastProvider } from "@/components/ui/toast";

export default function LunchMoneyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </ToastProvider>
  );
} 