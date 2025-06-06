import { metadata as apiLandingMetadata } from './metadata';

export const metadata = apiLandingMetadata;

export default function ApiLandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
