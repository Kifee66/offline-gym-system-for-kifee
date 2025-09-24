import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useCachedMemberStore } from '@/hooks/useCachedMemberStore';
import { ArrowLeft, Calendar as CalendarIcon, RefreshCw, Search } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Member } from '@/types/member';

const renewalSchema = z.object({
  memberId: z.string().min(1, 'Please select a member'),
  subscriptionType: z.enum(['monthly', 'quarterly', 'yearly']),
  amountPaid: z.number().min(1, 'Amount must be greater than 0'),
  newDueDate: z.date(),
  paymentComplete: z.boolean().optional()
});

type RenewalForm = z.infer<typeof renewalSchema>;

export default function Renew() {
  const [searchParams] = useSearchParams();
  const initialMemberId = searchParams.get('memberId');
  
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [newDueDate, setNewDueDate] = useState<Date>();
  const [memberSearch, setMemberSearch] = useState('');
  const [paymentComplete, setPaymentComplete] = useState(true);
  
  const { members, renewMembership } = useCachedMemberStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<RenewalForm>({
    resolver: zodResolver(renewalSchema)
  });

  const subscriptionType = watch('subscriptionType');

  // Filter members based on search
  const filteredMembers = members.filter(member =>
    member.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
    member.contactNumber.includes(memberSearch)
  );

  // Set initial member if provided in URL
  useEffect(() => {
    if (initialMemberId) {
      const member = members.find(m => m.id === initialMemberId);
      if (member) {
        selectMember(member);
      }
    }
  }, [initialMemberId, members]);

  const selectMember = (member: Member) => {
    setSelectedMember(member);
    setValue('memberId', member.id);
    setMemberSearch(member.fullName);
  };

  const getSubscriptionAmount = (type: string) => {
    switch (type) {
      case 'monthly': return 3000;
      case 'quarterly': return 8500;
      case 'yearly': return 30000;
      default: return 0;
    }
  };

  const calculateNewDueDate = (currentDueDate: Date, subscriptionType: string) => {
    const newDue = new Date(currentDueDate);
    switch (subscriptionType) {
      case 'monthly':
        newDue.setMonth(newDue.getMonth() + 1);
        break;
      case 'quarterly':
        newDue.setMonth(newDue.getMonth() + 3);
        break;
      case 'yearly':
        newDue.setFullYear(newDue.getFullYear() + 1);
        break;
    }
    return newDue;
  };

  const onSubscriptionTypeChange = (type: string) => {
    setValue('subscriptionType', type as 'monthly' | 'quarterly' | 'yearly');
    setValue('amountPaid', getSubscriptionAmount(type));
    
    if (selectedMember) {
      const calculatedDueDate = calculateNewDueDate(selectedMember.dueDate, type);
      setNewDueDate(calculatedDueDate);
      setValue('newDueDate', calculatedDueDate);
    }
  };

  const onSubmit = (data: RenewalForm) => {
    try {
      renewMembership(data.memberId, data.newDueDate, data.amountPaid, data.paymentComplete ?? true);
      
      toast({
        title: "Membership Renewed Successfully!",
        description: `${selectedMember?.fullName}'s membership has been renewed.`,
      });
      
      navigate('/');
    } catch (error) {
      toast({
        title: "Renewal Failed",
        description: "There was an error renewing the membership. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Renew Membership</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
                <RefreshCw className="h-6 w-6" />
                Renew Member Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Member Selection */}
                <div className="space-y-2">
                  <Label>Select Member</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search for member by name or phone..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="pl-10"
                      maxLength={100}
                    />
                  </div>
                  
                  {memberSearch && !selectedMember && (
                    <Card className="mt-2 max-h-60 overflow-y-auto">
                      <CardContent className="p-2">
                        {filteredMembers.length > 0 ? (
                          <div className="space-y-1">
                            {filteredMembers.map((member) => (
                              <div
                                key={member.id}
                                onClick={() => selectMember(member)}
                                className="p-3 hover:bg-muted rounded-lg cursor-pointer border"
                              >
                                <div className="font-medium">{member.fullName}</div>
                                <div className="text-sm text-muted-foreground">{member.contactNumber}</div>
                                <div className="text-xs text-muted-foreground">
                                  Due: {format(member.dueDate, 'MMM dd, yyyy')} • Status: {member.status}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-4">No members found</p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  
                  {selectedMember && (
                    <Card className="mt-2 bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{selectedMember.fullName}</h3>
                            <p className="text-sm text-muted-foreground">{selectedMember.contactNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              Current Due Date: {format(selectedMember.dueDate, 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(null);
                              setMemberSearch('');
                              reset();
                            }}
                          >
                            Change
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {errors.memberId && (
                    <p className="text-sm text-destructive">{errors.memberId.message}</p>
                  )}
                </div>

                {selectedMember && (
                  <>
                    {/* Subscription Type */}
                    <div className="space-y-2">
                      <Label>Subscription Type</Label>
                      <Select onValueChange={onSubscriptionTypeChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subscription type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly - KSh 3,000</SelectItem>
                          <SelectItem value="quarterly">Quarterly - KSh 8,500</SelectItem>
                          <SelectItem value="yearly">Yearly - KSh 30,000</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.subscriptionType && (
                        <p className="text-sm text-destructive">{errors.subscriptionType.message}</p>
                      )}
                    </div>

                    {/* Amount Paid */}
                    <div className="space-y-2">
                      <Label htmlFor="amountPaid">Amount Paid (KSh)</Label>
                      <Input
                        id="amountPaid"
                        type="number"
                        placeholder="Enter amount paid"
                        {...register('amountPaid', { valueAsNumber: true })}
                        className={errors.amountPaid ? 'border-destructive' : ''}
                      />
                      {errors.amountPaid && (
                        <p className="text-sm text-destructive">{errors.amountPaid.message}</p>
                      )}
                    </div>

                    {/* Payment Complete Checkbox */}
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="paymentComplete"
                        checked={paymentComplete}
                        onCheckedChange={(checked) => {
                          setPaymentComplete(checked as boolean);
                          setValue('paymentComplete', checked as boolean);
                        }}
                      />
                      <Label 
                        htmlFor="paymentComplete"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Payment Complete
                      </Label>
                    </div>

                    {/* New Due Date */}
                    <div className="space-y-2">
                      <Label>New Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newDueDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newDueDate ? format(newDueDate, "PPP") : "Select new due date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={newDueDate}
                            onSelect={(date) => {
                              if (date) {
                                setNewDueDate(date);
                                setValue('newDueDate', date);
                              }
                            }}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Button 
                      type="submit" 
                      variant="fitness" 
                      size="lg" 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Processing...' : 'Renew Membership'}
                    </Button>
                  </>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}