import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Member } from '@/lib/db';
import { useMembers } from '@/hooks/useMembers';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/use-toast';
import { calculateMemberStatus } from '@/lib/db';
import { z } from 'zod';

const renewalSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(15, "Phone number must be less than 15 characters"),
  subscriptionType: z.enum(['monthly', 'quarterly', 'yearly']),
  amountPaid: z.number().min(1, "Amount must be greater than 0"),
  paymentMethod: z.enum(['cash', 'mpesa']),
  paymentComplete: z.boolean()
});

interface RenewMemberFormProps {
  member: Member;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RenewMemberForm({ member, onSuccess, onCancel }: RenewMemberFormProps) {
  const { updateMember } = useMembers();
  const { addTransaction } = useTransactions();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: member.name,
    phone: member.phone,
    subscriptionType: member.subscriptionType,
    amountPaid: getSubscriptionPrice(member.subscriptionType),
    paymentMethod: member.paymentMethod,
    paymentComplete: true
  });

  function getSubscriptionPrice(subscriptionType: string): number {
    const prices = {
      monthly: 3000,
      quarterly: 8000,
      yearly: 30000
    };
    return prices[subscriptionType as keyof typeof prices] || 3000;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = renewalSchema.parse(formData);
      
      const startDate = new Date();
      const endDate = new Date();
      
      switch (validatedData.subscriptionType) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'quarterly':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }

      const status = calculateMemberStatus(endDate);

      await updateMember(member.id!, {
        name: validatedData.name,
        phone: validatedData.phone,
        status,
        startDate,
        endDate,
        subscriptionType: validatedData.subscriptionType,
        amountPaid: validatedData.amountPaid,
        paymentMethod: validatedData.paymentMethod,
        paymentComplete: validatedData.paymentComplete
      });

      if (validatedData.paymentComplete) {
        await addTransaction({
          memberId: member.id!,
          amount: validatedData.amountPaid,
          type: 'renewal',
          description: `Membership renewal - ${validatedData.subscriptionType}`,
          date: new Date()
        });
      }

      toast({
        title: "Success",
        description: "Member renewed successfully",
      });

      onSuccess();
    } catch (error) {
      console.error('Renewal error:', error);
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.issues[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to renew member. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Renew Member: {member.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="subscription">Subscription Type</Label>
            <Select 
              value={formData.subscriptionType} 
              onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => {
                const newAmount = getSubscriptionPrice(value);
                setFormData({...formData, subscriptionType: value, amountPaid: newAmount});
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly - KSh 3,000</SelectItem>
                <SelectItem value="quarterly">Quarterly - KSh 8,000</SelectItem>
                <SelectItem value="yearly">Yearly - KSh 30,000</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Amount Paid (KSh)</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amountPaid}
              onChange={(e) => setFormData({...formData, amountPaid: Number(e.target.value)})}
              required
            />
          </div>

          <div>
            <Label htmlFor="payment">Payment Method</Label>
            <Select 
              value={formData.paymentMethod} 
              onValueChange={(value: 'cash' | 'mpesa') => 
                setFormData({...formData, paymentMethod: value})
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="paymentComplete"
              checked={formData.paymentComplete}
              onCheckedChange={(checked) => 
                setFormData({...formData, paymentComplete: checked as boolean})
              }
            />
            <Label htmlFor="paymentComplete">Payment Complete</Label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1">
              Renew Member
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}