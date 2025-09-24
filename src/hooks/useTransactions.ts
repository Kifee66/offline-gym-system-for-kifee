import { useLiveQuery } from 'dexie-react-hooks';
import { db, addTransaction } from '@/lib/db';

export const useTransactions = () => {
  const transactions = useLiveQuery(() => 
    db.transactions.orderBy('createdAt').reverse().toArray()
  );

  const revenueThisMonth = useLiveQuery(async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyTransactions = await db.transactions
      .where('date')
      .between(startOfMonth, endOfMonth)
      .and(transaction => transaction.type === 'payment' || transaction.type === 'renewal')
      .toArray();

    return monthlyTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  });

  const totalRevenue = useLiveQuery(async () => {
    const allTransactions = await db.transactions
      .where('type')
      .anyOf(['payment', 'renewal'])
      .toArray();
    
    return allTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  });

  return {
    transactions: transactions || [],
    revenueThisMonth: revenueThisMonth || 0,
    totalRevenue: totalRevenue || 0,
    addTransaction
  };
};