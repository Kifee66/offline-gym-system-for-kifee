import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMembers } from '@/hooks/useMembers';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/use-toast';
import { calculateMemberStatus } from '@/lib/db';

export default function Register() {
  const { addMember } = useMembers();
  const { addTransaction } = useTransactions();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subscriptionType: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    amountPaid: 3000,
    paymentMethod: 'cash' as 'cash' | 'mpesa'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const startDate = new Date();
      const endDate = new Date();
      
      switch (formData.subscriptionType) {
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

      const memberId = await addMember({
        name: formData.name,
        phone: formData.phone,
        status,
        startDate,
        endDate,
        subscriptionType: formData.subscriptionType,
        amountPaid: formData.amountPaid,
        paymentMethod: formData.paymentMethod,
        paymentComplete: true
      });

      await addTransaction({
        memberId: memberId as number,
        amount: formData.amountPaid,
        type: 'payment',
        description: 'New member registration',
        date: new Date()
      });

      toast({
        title: "Success",
        description: "Member registered successfully",
      });

      // Reset form
      setFormData({
        name: '',
        phone: '',
        subscriptionType: 'monthly',
        amountPaid: 3000,
        paymentMethod: 'cash'
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register member",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Register New Member</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Member Registration
            </CardTitle>
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
                  onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => 
                    setFormData({...formData, subscriptionType: value})
                  }
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

              <Button type="submit" className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Register Member
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}