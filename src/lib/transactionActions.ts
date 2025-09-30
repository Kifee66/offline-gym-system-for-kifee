import { db, addTransaction } from '@/lib/db';

export const updateTransaction = async (id: number, transactionData: Partial<Omit<import('@/lib/db').Transaction, 'id'>>) => {
  return await db.transactions.update(id, {
    ...transactionData,
  });
};

export const deleteTransaction = async (id: number) => {
  return await db.transactions.delete(id);
};
