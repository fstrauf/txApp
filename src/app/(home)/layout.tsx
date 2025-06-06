import { metadata as homeMetadata } from './metadata';

export const metadata = homeMetadata;

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
