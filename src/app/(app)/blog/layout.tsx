export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <article className="prose dark:prose-invert lg:prose-xl max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {children}
    </article>
  );
} 