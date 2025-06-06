import { metadata as apiDocsMetadata } from './metadata';

export const metadata = apiDocsMetadata;

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
