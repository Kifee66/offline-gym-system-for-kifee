import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useMembers } from '@/hooks/useMembers';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/use-toast';
import { calculateMemberStatus } from '@/lib/db';
import { z } from 'zod';

const memberSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(15, "Phone number must be less than 15 characters"),
  subscriptionType: z.enum(['monthly', 'quarterly', 'yearly']),
  amountPaid: z.number().min(1, "Amount must be greater than 0"),
  paymentMethod: z.enum(['cash', 'mpesa']),
  paymentComplete: z.boolean()
});

export default function Register() {
  const { members, addMember } = useMembers();
  const { addTransaction } = useTransactions();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subscriptionType: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    amountPaid: 3000,
    paymentMethod: 'cash' as 'cash' | 'mpesa',
    paymentComplete: true
  });

  // Update amount paid when subscription type changes
  useEffect(() => {
    const subscriptionPrices = {
      monthly: 3000,
      quarterly: 8000,
      yearly: 30000
    };
    setFormData(prev => ({ 
      ...prev, 
      amountPaid: subscriptionPrices[prev.subscriptionType] 
    }));
  }, [formData.subscriptionType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data
      const validatedData = memberSchema.parse(formData);
      
      // Check for duplicate phone numbers
      const existingMember = members.find(member => member.phone === validatedData.phone);
      if (existingMember) {
        toast({
          title: "Error",
          description: "A member with this phone number already exists",
          variant: "destructive",
        });
        return;
      }
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

      const memberId = await addMember({
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

      await addTransaction({
        memberId: memberId as number,
        amount: validatedData.amountPaid,
        type: 'payment',
        description: `New member registration - ${validatedData.subscriptionType}`,
        date: new Date()
      });

      toast({
        title: "Success",
        description: "Member registered successfully",
      });

      // Navigate back to home page
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.issues[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to register member. Please try again.",
          variant: "destructive",
        });
      }
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