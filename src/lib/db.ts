import Dexie, { Table } from 'dexie';

export interface Member {
  id?: number;
  name: string;
  phone: string;
  status: 'active' | 'due' | 'overdue';
  startDate: Date;
  endDate: Date;
  subscriptionType: 'monthly' | 'quarterly' | 'yearly';
  amountPaid: number;
  paymentMethod: 'cash' | 'mpesa';
  paymentComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionType {
  id?: number;
  name: string;
  durationMonths: number;
  price: number;
  createdAt: Date;
}

export interface Transaction {
  id?: number;
  memberId: number;
  amount: number;
  type: 'payment' | 'renewal' | 'refund';
  description?: string;
  date: Date;
  createdAt: Date;
}

export class GymDatabase extends Dexie {
  members!: Table<Member>;
  subscriptionTypes!: Table<SubscriptionType>;
  transactions!: Table<Transaction>;

  constructor() {
    super('GymDatabase');
    
    this.version(1).stores({
      members: '++id, name, phone, status, startDate, endDate, subscriptionType, createdAt',
      subscriptionTypes: '++id, name, durationMonths, price, createdAt',
      transactions: '++id, memberId, amount, type, date, createdAt'
    });

    this.on('ready', this.populate);
  }

  private async populate() {
    // Add default subscription types if they don't exist
    const subscriptionCount = await this.subscriptionTypes.count();
    if (subscriptionCount === 0) {
      await this.subscriptionTypes.bulkAdd([
        {
          name: 'Monthly',
          durationMonths: 1,
          price: 3000,
          createdAt: new Date()
        },
        {
          name: 'Quarterly',
          durationMonths: 3,
          price: 8000,
          createdAt: new Date()
        },
        {
          name: 'Yearly',
          durationMonths: 12,
          price: 30000,
          createdAt: new Date()
        }
      ]);
    }
  }
}

export const db = new GymDatabase();

// Helper functions
export const addMember = async (memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const now = new Date();
    const result = await db.members.add({
      ...memberData,
      createdAt: now,
      updatedAt: now
    });
    console.log('Member added successfully:', result);
    return result;
  } catch (error) {
    console.error('Error adding member:', error);
    throw error;
  }
};

export const updateMember = async (id: number, memberData: Partial<Member>) => {
  return await db.members.update(id, {
    ...memberData,
    updatedAt: new Date()
  });
};

export const deleteMember = async (id: number) => {
  // Delete related transactions first
  await db.transactions.where('memberId').equals(id).delete();
  return await db.members.delete(id);
};

export const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
  try {
    const result = await db.transactions.add({
      ...transactionData,
      createdAt: new Date()
    });
    console.log('Transaction added successfully:', result);
    return result;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

// Calculate member status based on end date
export const calculateMemberStatus = (endDate: Date): 'active' | 'due' | 'overdue' => {
  const now = new Date();
  const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry > 7) return 'active';
  if (daysUntilExpiry >= 0) return 'due';
  return 'overdue';
};

// Update all member statuses
export const updateAllMemberStatuses = async () => {
  const members = await db.members.toArray();
  
  for (const member of members) {
    const newStatus = calculateMemberStatus(member.endDate);
    if (newStatus !== member.status) {
      await updateMember(member.id!, { status: newStatus });
    }
  }
};