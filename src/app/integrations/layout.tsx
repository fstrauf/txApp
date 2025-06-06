import { metadata as integrationsMetadata } from './metadata';

export const metadata = integrationsMetadata;

export default function IntegrationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
