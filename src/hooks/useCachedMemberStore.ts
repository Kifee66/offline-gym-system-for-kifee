import { useState, useEffect, useCallback } from 'react';
import { Member, MemberFormData } from '@/types/member';
import { supabase } from '@/integrations/supabase/client';

const CACHE_KEY = 'gym_members_cache';
const CACHE_TIMESTAMP_KEY = 'gym_members_cache_timestamp';
const PAYMENT_HISTORY_CACHE_KEY = 'gym_payment_history_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface PaymentHistoryItem {
  id: string;
  memberName: string;
  amount: number;
  date: Date;
  method: 'cash' | 'mpesa';
  type: 'registration' | 'renewal';
}

export function useCachedMemberStore() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return false;
    
    const cacheTime = parseInt(timestamp);
    const now = Date.now();
    return (now - cacheTime) < CACHE_DURATION;
  }, []);

  // Load from cache
  const loadFromCache = useCallback(() => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedHistory = localStorage.getItem(PAYMENT_HISTORY_CACHE_KEY);
      
      if (cachedData && isCacheValid()) {
        const parsedMembers = JSON.parse(cachedData).map((member: any) => ({
          ...member,
          registrationDate: new Date(member.registrationDate),
          dueDate: new Date(member.dueDate)
        }));
        setMembers(parsedMembers);
        
        if (cachedHistory) {
          const parsedHistory = JSON.parse(cachedHistory).map((item: any) => ({
            ...item,
            date: new Date(item.date)
          }));
          setPaymentHistory(parsedHistory);
        }
        
        return true;
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
    }
    return false;
  }, [isCacheValid]);

  // Save to cache
  const saveToCache = useCallback((membersData: Member[], historyData?: PaymentHistoryItem[]) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(membersData));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      
      if (historyData) {
        localStorage.setItem(PAYMENT_HISTORY_CACHE_KEY, JSON.stringify(historyData));
      }
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, []);

  const fetchMembers = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && loadFromCache()) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          subscription_types(name, duration_months)
        `);

      if (error) throw error;

      const membersWithStatus = data?.map(member => ({
        id: member.id,
        fullName: member.full_name,
        contactNumber: member.contact_number,
        registrationDate: new Date(member.registration_date),
        subscriptionType: member.subscription_types.name as 'monthly' | 'quarterly' | 'yearly',
        amountPaid: member.amount_paid,
        dueDate: new Date(member.due_date),
        paymentMethod: member.payment_method as 'cash' | 'mpesa',
        paymentComplete: member.payment_complete,
        status: determineStatus(new Date(member.due_date))
      })) || [];

      setMembers(membersWithStatus);
      
      // Generate payment history from members
      const history = generatePaymentHistory(membersWithStatus);
      setPaymentHistory(history);
      
      saveToCache(membersWithStatus, history);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  }, [loadFromCache, saveToCache]);

  const generatePaymentHistory = useCallback((membersData: Member[]): PaymentHistoryItem[] => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    return membersData
      .filter(member => member.registrationDate >= threeMonthsAgo)
      .map(member => ({
        id: member.id,
        memberName: member.fullName,
        amount: member.amountPaid,
        date: member.registrationDate,
        method: member.paymentMethod,
        type: 'registration' as const
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, []);

  const getPaymentHistoryByMonth = useCallback((month: string): PaymentHistoryItem[] => {
    return paymentHistory.filter(payment => {
      const paymentMonth = payment.date.toISOString().slice(0, 7);
      return paymentMonth === month;
    });
  }, [paymentHistory]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = async (memberData: MemberFormData): Promise<Member> => {
    try {
      const { data: subscriptionType } = await supabase
        .from('subscription_types')
        .select('id')
        .eq('name', memberData.subscriptionType)
        .single();

      if (!subscriptionType) throw new Error('Subscription type not found');

      // Insert member
      const { data, error } = await supabase
        .from('members')
        .insert({
          full_name: memberData.fullName,
          contact_number: memberData.contactNumber,
          registration_date: memberData.registrationDate.toISOString().split('T')[0],
          subscription_type_id: subscriptionType.id,
          amount_paid: memberData.amountPaid,
          due_date: memberData.dueDate.toISOString().split('T')[0],
          payment_method: memberData.paymentMethod,
          payment_complete: memberData.paymentComplete,
          status: determineStatus(memberData.dueDate)
        })
        .select()
        .single();

      if (error) throw error;

      // Create payment transaction record
      const { error: paymentError } = await supabase
        .from('payment_transactions')
        .insert({
          member_id: data.id,
          amount: memberData.amountPaid,
          transaction_date: memberData.registrationDate.toISOString().split('T')[0],
          transaction_type: 'registration',
          description: `Initial registration payment - ${memberData.subscriptionType} membership`
        });

      if (paymentError) {
        console.error('Error creating payment transaction:', paymentError);
        // Don't throw here as member creation succeeded
      }

      const newMember: Member = {
        id: data.id,
        fullName: data.full_name,
        contactNumber: data.contact_number,
        registrationDate: new Date(data.registration_date),
        subscriptionType: memberData.subscriptionType,
        amountPaid: data.amount_paid,
        dueDate: new Date(data.due_date),
        paymentMethod: data.payment_method as 'cash' | 'mpesa',
        paymentComplete: data.payment_complete,
        status: determineStatus(new Date(data.due_date))
      };

      // Update local state and cache
      const updatedMembers = [...members, newMember];
      setMembers(updatedMembers);
      
      const updatedHistory = [...paymentHistory, {
        id: newMember.id,
        memberName: newMember.fullName,
        amount: newMember.amountPaid,
        date: newMember.registrationDate,
        method: newMember.paymentMethod,
        type: 'registration' as const
      }];
      setPaymentHistory(updatedHistory);
      
      saveToCache(updatedMembers, updatedHistory);
      
      return newMember;
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  };

  const renewMembership = async (memberId: string, newDueDate: Date, amountPaid: number, paymentComplete = true) => {
    try {
      // Get member details first
      const member = members.find(m => m.id === memberId);
      if (!member) throw new Error('Member not found');

      // Update member record
      const { error } = await supabase
        .from('members')
        .update({
          due_date: newDueDate.toISOString().split('T')[0],
          amount_paid: amountPaid,
          payment_complete: paymentComplete,
          status: determineStatus(newDueDate)
        })
        .eq('id', memberId);

      if (error) throw error;

      // Create payment transaction record for renewal
      const { error: paymentError } = await supabase
        .from('payment_transactions')
        .insert({
          member_id: memberId,
          amount: amountPaid,
          transaction_date: new Date().toISOString().split('T')[0],
          transaction_type: 'renewal',
          description: `Membership renewal payment - ${member.subscriptionType} membership`
        });

      if (paymentError) {
        console.error('Error creating payment transaction:', paymentError);
        // Don't throw here as member update succeeded
      }

      const updatedMembers = members.map(member => 
        member.id === memberId 
          ? { 
              ...member, 
              dueDate: newDueDate, 
              amountPaid,
              paymentComplete,
              status: determineStatus(newDueDate)
            }
          : member
      );
      
      setMembers(updatedMembers);
      
      // Add renewal to payment history
      const renewedMember = updatedMembers.find(m => m.id === memberId);
      if (renewedMember) {
        const updatedHistory = [...paymentHistory, {
          id: memberId + '_renewal_' + Date.now(),
          memberName: renewedMember.fullName,
          amount: amountPaid,
          date: new Date(),
          method: renewedMember.paymentMethod,
          type: 'renewal' as const
        }];
        setPaymentHistory(updatedHistory);
        saveToCache(updatedMembers, updatedHistory);
      }
    } catch (error) {
      console.error('Error renewing membership:', error);
      throw error;
    }
  };

  const searchMembers = (query: string) => {
    setSearchQuery(query);
  };

  const filteredMembers = members.filter(member =>
    member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.contactNumber.includes(searchQuery)
  );

  const getMembersByStatus = (status: 'active' | 'due' | 'overdue') => {
    return filteredMembers.filter(member => member.status === status);
  };

  const getIncompletePaymentMembers = () => {
    return filteredMembers.filter(member => !member.paymentComplete);
  };

  const completePayment = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('members')
        .update({ payment_complete: true })
        .eq('id', memberId);

      if (error) throw error;

      const updatedMembers = members.map(member => 
        member.id === memberId 
          ? { ...member, paymentComplete: true }
          : member
      );
      setMembers(updatedMembers);
      saveToCache(updatedMembers, paymentHistory);
    } catch (error) {
      console.error('Error completing payment:', error);
      throw error;
    }
  };

  const updateMemberPaymentDetails = async (memberId: string, amountPaid: number, amountRemaining: number) => {
    try {
      const { error } = await supabase
        .from('members')
        .update({ amount_paid: amountPaid })
        .eq('id', memberId);

      if (error) throw error;

      const updatedMembers = members.map(member => 
        member.id === memberId 
          ? { ...member, amountPaid: amountPaid }
          : member
      );
      setMembers(updatedMembers);
      saveToCache(updatedMembers, paymentHistory);
    } catch (error) {
      console.error('Error updating payment details:', error);
      throw error;
    }
  };

  const deleteOverdueMembers = async (): Promise<void> => {
    try {
      const currentOverdueMembers = getMembersByStatus('overdue');
      const overdueIds = currentOverdueMembers.map(member => member.id);
      
      if (overdueIds.length === 0) {
        throw new Error('No overdue members to delete');
      }

      // Delete from Supabase (payment_transactions will be deleted automatically due to CASCADE)
      const { error } = await supabase
        .from('members')
        .delete()
        .in('id', overdueIds);

      if (error) throw error;

      // Update local state by removing deleted members
      const updatedMembers = members.filter(member => !overdueIds.includes(member.id));
      setMembers(updatedMembers);
      saveToCache(updatedMembers, paymentHistory);
    } catch (error) {
      console.error('Error deleting overdue members:', error);
      throw error;
    }
  };

  const deleteMember = async (memberId: string): Promise<void> => {
    try {
      // Delete from Supabase (payment_transactions will be deleted automatically due to CASCADE)
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Update local state by removing the deleted member
      const updatedMembers = members.filter(member => member.id !== memberId);
      setMembers(updatedMembers);
      saveToCache(updatedMembers, paymentHistory);
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  };

  return {
    members: filteredMembers,
    searchQuery,
    loading,
    paymentHistory,
    addMember,
    renewMembership,
    searchMembers,
    getMembersByStatus,
    activeMembers: getMembersByStatus('active'),
    dueMembers: getMembersByStatus('due'),
    overdueMembers: getMembersByStatus('overdue'),
    incompletePaymentMembers: getIncompletePaymentMembers(),
    completePayment,
    updateMemberPaymentDetails,
    deleteOverdueMembers,
    deleteMember,
    getPaymentHistoryByMonth,
    refetch: () => fetchMembers(true)
  };
}

function determineStatus(dueDate: Date): 'active' | 'due' | 'overdue' {
  const today = new Date();
  const due = new Date(dueDate);
  const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 3) return 'due';
  return 'active';
}