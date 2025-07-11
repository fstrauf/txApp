
import { Transaction } from '@/types/personalFinance';

export const createTransactionKey = (transaction: Partial<Transaction>): string => {
  const date = new Date(transaction.date!).toISOString().split('T')[0];
  const amount = Math.abs(transaction.amount!).toFixed(2);
  const description = (transaction.description || '').toLowerCase().trim().substring(0, 50);
  return `${date}-${amount}-${description}`;
};

export const createTransactionFingerprint = (
  transaction: Partial<Transaction>,
  strategy: 'strict' | 'moderate' | 'loose' = 'moderate'
): string => {
  const date = new Date(transaction.date!).toISOString().split('T')[0];
  const amount = Math.abs(transaction.amount!).toFixed(2);
  const description = (transaction.description || '').toLowerCase().trim();
  const isDebit = transaction.amount! < 0;

  switch (strategy) {
    case 'strict':
      return `${date}-${amount}-${isDebit ? 'debit' : 'credit'}-${description}-${
        transaction.account || 'unknown'
      }`;

    case 'moderate':
      return `${date}-${amount}-${isDebit ? 'debit' : 'credit'}-${description.substring(0, 100)}`;

    case 'loose':
    default:
      return `${date}-${amount}-${isDebit ? 'debit' : 'credit'}-${description.substring(0, 50)}`;
  }
};

export const detectDuplicateTransactions = (
  newTransactions: Partial<Transaction>[],
  existingTransactions: Transaction[],
  strategy: 'strict' | 'moderate' | 'loose' = 'moderate'
) => {
  if (!existingTransactions || existingTransactions.length === 0) {
    return {
      uniqueTransactions: newTransactions,
      duplicates: [],
      duplicateCount: 0,
      strategy,
      stats: {
        total: newTransactions.length,
        unique: newTransactions.length,
        duplicateWithExisting: 0,
        duplicateWithinBatch: 0,
      },
    };
  }

  const existingFingerprints = new Map<string, Transaction[]>();
  existingTransactions.forEach((tx) => {
    const fingerprint = createTransactionFingerprint(tx, strategy);
    if (!existingFingerprints.has(fingerprint)) {
      existingFingerprints.set(fingerprint, []);
    }
    existingFingerprints.get(fingerprint)!.push(tx);
  });

  const newFingerprints = new Map<string, (Partial<Transaction> & { originalIndex: number })[]>();
  const duplicates: any[] = [];
  const uniqueTransactions: Partial<Transaction>[] = [];

  newTransactions.forEach((transaction, index) => {
    const fingerprint = createTransactionFingerprint(transaction, strategy);

    const existingMatches = existingFingerprints.get(fingerprint);
    const newMatches = newFingerprints.get(fingerprint);

    if (existingMatches || newMatches) {
      duplicates.push({
        transaction,
        index,
        fingerprint,
        existingMatches: existingMatches || [],
        newMatches: newMatches ? newMatches.map((m) => m.transaction) : [],
        reason: existingMatches ? 'existing' : 'within_batch',
      });
    } else {
      uniqueTransactions.push(transaction);
      if (!newFingerprints.has(fingerprint)) {
        newFingerprints.set(fingerprint, []);
      }
      newFingerprints.get(fingerprint)!.push({ ...transaction, originalIndex: index });
    }
  });

  return {
    uniqueTransactions,
    duplicates,
    duplicateCount: duplicates.length,
    strategy,
    stats: {
      total: newTransactions.length,
      unique: uniqueTransactions.length,
      duplicateWithExisting: duplicates.filter((d) => d.reason === 'existing').length,
      duplicateWithinBatch: duplicates.filter((d) => d.reason === 'within_batch').length,
    },
  };
};

export const filterDuplicateTransactions = (
  newTransactions: Partial<Transaction>[],
  existingTransactions: Transaction[]
): Partial<Transaction>[] => {
  if (!existingTransactions || existingTransactions.length === 0) {
    return newTransactions;
  }

  const existingKeys = new Set(existingTransactions.map((t) => createTransactionKey(t)));

  return newTransactions.filter((t) => {
    const key = createTransactionKey(t);
    return !existingKeys.has(key);
  });
}; 