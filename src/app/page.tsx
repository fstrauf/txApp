import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        Track Your Finances
      </h1>
      <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
        A simple and secure way to manage your money. Track expenses, set budgets,
        and achieve your financial goals.
      </p>
      <div className="flex gap-4">
        <Link
          href="/auth/register"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Get Started
        </Link>
        <Link
          href="/auth/signin"
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Sign In
        </Link>
        <Link
          href="/banking"
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Connect Bank
        </Link>
      </div>
    </div>
  );
}
