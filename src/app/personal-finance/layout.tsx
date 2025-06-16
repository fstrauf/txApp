import { metadata as personalFinanceMetadata } from './metadata';
import { GoogleIdentityLoader } from '@/components/shared/GoogleIdentityLoader';

export const metadata = personalFinanceMetadata;

export default function PersonalFinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <GoogleIdentityLoader />
      {children}
    </>
  );
}
