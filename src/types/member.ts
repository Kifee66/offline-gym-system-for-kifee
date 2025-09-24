export interface Member {
  id: string;
  fullName: string;
  contactNumber: string;
  registrationDate: Date;
  subscriptionType: 'monthly' | 'quarterly' | 'yearly';
  amountPaid: number;
  dueDate: Date;
  paymentMethod: 'cash' | 'mpesa';
  paymentComplete: boolean;
  status: 'active' | 'due' | 'overdue';
}

export interface MemberFormData {
  fullName: string;
  contactNumber: string;
  registrationDate: Date;
  subscriptionType: 'monthly' | 'quarterly' | 'yearly';
  amountPaid: number;
  dueDate: Date;
  paymentMethod: 'cash' | 'mpesa';
  paymentComplete: boolean;
}