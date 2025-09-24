import { useState, useEffect } from 'react';
import { Member, MemberFormData } from '@/types/member';
import { supabase } from '@/integrations/supabase/client';

export function useMemberStore() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
    
    // Set up real-time subscription for member changes
    const channel = supabase
      .channel('member-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'members'
        },
        (payload) => {
          const newMember = payload.new;
          if (newMember) {
            const memberWithStatus = {
              id: newMember.id,
              fullName: newMember.full_name,
              contactNumber: newMember.contact_number,
              registrationDate: new Date(newMember.registration_date),
              subscriptionType: 'monthly' as 'monthly' | 'quarterly' | 'yearly', // Will be updated with join
              amountPaid: newMember.amount_paid,
              dueDate: new Date(newMember.due_date),
              paymentMethod: newMember.payment_method as 'cash' | 'mpesa',
              paymentComplete: newMember.payment_complete,
              status: determineStatus(new Date(newMember.due_date))
            };
            setMembers(prev => [...prev, memberWithStatus]);
            // Fetch the complete member data with subscription type
            fetchSingleMember(newMember.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'members'
        },
        (payload) => {
          const updatedMember = payload.new;
          if (updatedMember) {
            setMembers(prev => 
              prev.map(member => 
                member.id === updatedMember.id 
                  ? {
                      ...member,
                      fullName: updatedMember.full_name,
                      contactNumber: updatedMember.contact_number,
                      registrationDate: new Date(updatedMember.registration_date),
                      amountPaid: updatedMember.amount_paid,
                      dueDate: new Date(updatedMember.due_date),
                      paymentMethod: updatedMember.payment_method as 'cash' | 'mpesa',
                      paymentComplete: updatedMember.payment_complete,
                      status: determineStatus(new Date(updatedMember.due_date))
                    }
                  : member
              )
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'members'
        },
        (payload) => {
          const deletedMember = payload.old;
          if (deletedMember) {
            setMembers(prev => prev.filter(member => member.id !== deletedMember.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMembers = async () => {
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
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleMember = async (memberId: string) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          subscription_types(name, duration_months)
        `)
        .eq('id', memberId)
        .single();

      if (error) throw error;

      if (data) {
        const memberWithStatus = {
          id: data.id,
          fullName: data.full_name,
          contactNumber: data.contact_number,
          registrationDate: new Date(data.registration_date),
          subscriptionType: data.subscription_types.name as 'monthly' | 'quarterly' | 'yearly',
          amountPaid: data.amount_paid,
          dueDate: new Date(data.due_date),
          paymentMethod: data.payment_method as 'cash' | 'mpesa',
          paymentComplete: data.payment_complete,
          status: determineStatus(new Date(data.due_date))
        };

        setMembers(prev => 
          prev.map(member => 
            member.id === memberId ? memberWithStatus : member
          )
        );
      }
    } catch (error) {
      console.error('Error fetching single member:', error);
    }
  };

  const addMember = async (memberData: MemberFormData): Promise<Member> => {
    try {
      // Get subscription type ID
      const { data: subscriptionType } = await supabase
        .from('subscription_types')
        .select('id')
        .eq('name', memberData.subscriptionType)
        .single();

      if (!subscriptionType) throw new Error('Subscription type not found');

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

      // Create payment transaction for registration
      await supabase
        .from('payment_transactions')
        .insert({
          member_id: data.id,
          amount: memberData.amountPaid,
          transaction_type: 'registration',
          transaction_date: memberData.registrationDate.toISOString().split('T')[0],
          description: `Registration payment for ${memberData.subscriptionType} subscription`
        });

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

      setMembers(prev => [...prev, newMember]);
      return newMember;
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  };

  const renewMembership = async (memberId: string, newDueDate: Date, amountPaid: number, paymentComplete = true) => {
    try {
      const member = members.find(m => m.id === memberId);
      
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

      // Create payment transaction for renewal
      await supabase
        .from('payment_transactions')
        .insert({
          member_id: memberId,
          amount: amountPaid,
          transaction_type: 'renewal',
          transaction_date: new Date().toISOString().split('T')[0],
          description: `Membership renewal payment for ${member?.subscriptionType || 'subscription'}`
        });

      setMembers(prev => 
        prev.map(member => 
          member.id === memberId 
            ? { 
                ...member, 
                dueDate: newDueDate, 
                amountPaid,
                paymentComplete,
                status: determineStatus(newDueDate)
              }
            : member
        )
      );
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
      const member = members.find(m => m.id === memberId);
      
      const { error } = await supabase
        .from('members')
        .update({ payment_complete: true })
        .eq('id', memberId);

      if (error) throw error;

      // Create payment transaction for completing payment
      if (member) {
        await supabase
          .from('payment_transactions')
          .insert({
            member_id: memberId,
            amount: member.amountPaid,
            transaction_type: 'payment_completion',
            description: `Payment completion for ${member.subscriptionType} subscription`
          });
      }

      setMembers(prev => 
        prev.map(member => 
          member.id === memberId 
            ? { ...member, paymentComplete: true }
            : member
        )
      );
    } catch (error) {
      console.error('Error completing payment:', error);
      throw error;
    }
  };

  const updateMemberPayment = async (memberId: string, newAmount: number) => {
    try {
      const { error } = await supabase
        .from('members')
        .update({ amount_paid: newAmount })
        .eq('id', memberId);

      if (error) throw error;

      setMembers(prev => 
        prev.map(member => 
          member.id === memberId 
            ? { ...member, amountPaid: newAmount }
            : member
        )
      );
    } catch (error) {
      console.error('Error updating payment amount:', error);
      throw error;
    }
  };

  const updateMemberPaymentDetails = async (memberId: string, amountPaid: number, amountRemaining: number) => {
    try {
      const currentMember = members.find(m => m.id === memberId);
      const { error } = await supabase
        .from('members')
        .update({ amount_paid: amountPaid })
        .eq('id', memberId);

      if (error) throw error;

      // Create payment transaction for the payment update if amount changed
      if (currentMember && currentMember.amountPaid !== amountPaid) {
        const difference = amountPaid - currentMember.amountPaid;
        await supabase
          .from('payment_transactions')
          .insert({
            member_id: memberId,
            amount: difference,
            transaction_type: difference > 0 ? 'payment_increase' : 'payment_adjustment',
            description: `Payment ${difference > 0 ? 'increase' : 'adjustment'} of KSh ${Math.abs(difference).toLocaleString()}`
          });
      }

      setMembers(prev => 
        prev.map(member => 
          member.id === memberId 
            ? { ...member, amountPaid: amountPaid }
            : member
        )
      );
    } catch (error) {
      console.error('Error updating payment details:', error);
      throw error;
    }
  };

  return {
    members: filteredMembers,
    searchQuery,
    loading,
    addMember,
    renewMembership,
    searchMembers,
    getMembersByStatus,
    activeMembers: getMembersByStatus('active'),
    dueMembers: getMembersByStatus('due'),
    overdueMembers: getMembersByStatus('overdue'),
    incompletePaymentMembers: getIncompletePaymentMembers(),
    completePayment,
    updateMemberPayment,
    updateMemberPaymentDetails,
    refetch: fetchMembers
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