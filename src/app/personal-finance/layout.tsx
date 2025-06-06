import { metadata as personalFinanceMetadata } from './metadata';

export const metadata = personalFinanceMetadata;

export default function PersonalFinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
