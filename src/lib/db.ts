// ...existing code...
export const checkInMember = async (memberId: number) => {
  const member = await db.members.get(memberId);
  if (!member) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastCheckIn = member.lastCheckIn ? new Date(member.lastCheckIn) : null;
  if (lastCheckIn) {
    lastCheckIn.setHours(0, 0, 0, 0);
    if (lastCheckIn.getTime() === today.getTime()) {
      // Already checked in today
      return false;
    }
  }
  const history = member.checkInHistory || [];
  history.push({ date: today.toISOString() });
  await db.members.update(memberId, {
    lastCheckIn: today,
    checkInHistory: history,
    updatedAt: new Date()
  });
  return true;
};
import Dexie, { Table } from 'dexie';

export interface Member {
  id?: number;
  name: string;
  phone: string;
  status: 'active' | 'due' | 'overdue';
  startDate: Date;
  endDate: Date;
  subscriptionType: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  amountPaid: number;
  paymentMethod: 'cash' | 'mpesa';
  paymentComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastCheckIn?: Date;
  checkInHistory?: Array<{ date: string }>;
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

export interface AdminSettings {
  id?: number;
  passwordHash: string;
  salt: string;
  isSetup: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class GymDatabase extends Dexie {
  members!: Table<Member>;
  subscriptionTypes!: Table<SubscriptionType>;
  transactions!: Table<Transaction>;
  adminSettings!: Table<AdminSettings>;

  constructor() {
    super('GymDatabase');
    this.version(1).stores({
      members: '++id, name, phone, status, startDate, endDate, subscriptionType, createdAt',
      subscriptionTypes: '++id, name, durationMonths, price, createdAt',
      transactions: '++id, memberId, amount, type, date, createdAt',
      adminSettings: '++id, isSetup, createdAt'
    });
    this.open().then(() => {
      this.populate();
    }).catch(error => {
      console.error('Database initialization error:', error);
    });
  }

  private async populate() {
    try {
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
        console.log('Default subscription types added');
      }
    } catch (error) {
      console.error('Error populating database:', error);
    }
  }
}

export const db = new GymDatabase();

// Ensure database is opened
db.open().catch(error => {
  console.error('Failed to open database:', error);
});

// Helper functions
export const addMember = async (memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    // Ensure database is open before adding
    if (!db.isOpen()) {
      await db.open();
    }
    
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
    // Ensure database is open before adding
    if (!db.isOpen()) {
      await db.open();
    }
    
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