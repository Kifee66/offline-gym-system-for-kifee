import { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useCachedMemberStore } from '@/hooks/useCachedMemberStore';
import { ArrowLeft, Calendar as CalendarIcon, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MemberFormData } from '@/types/member';

const memberSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  contactNumber: z.string().min(10, 'Contact number must be at least 10 digits'),
  registrationDate: z.date(),
  subscriptionType: z.enum(['monthly', 'quarterly', 'yearly']),
  amountPaid: z.number().min(1, 'Amount must be greater than 0'),
  dueDate: z.date(),
  paymentMethod: z.enum(['cash', 'mpesa']),
  paymentComplete: z.boolean()
});

type MemberForm = z.infer<typeof memberSchema>;

export default function Register() {
  const [registrationDate, setRegistrationDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>();
  const { addMember } = useCachedMemberStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      registrationDate: new Date(),
      paymentMethod: 'cash',
      paymentComplete: false
    }
  });

  const subscriptionType = watch('subscriptionType');
  const paymentMethod = watch('paymentMethod');

  const getSubscriptionAmount = (type: string) => {
    switch (type) {
      case 'monthly': return 3000;
      case 'quarterly': return 8500;
      case 'yearly': return 30000;
      default: return 0;
    }
  };

  const calculateDueDate = (registrationDate: Date, subscriptionType: string) => {
    const due = new Date(registrationDate);
    switch (subscriptionType) {
      case 'monthly':
        due.setMonth(due.getMonth() + 1);
        break;
      case 'quarterly':
        due.setMonth(due.getMonth() + 3);
        break;
      case 'yearly':
        due.setFullYear(due.getFullYear() + 1);
        break;
    }
    return due;
  };

  const onSubscriptionTypeChange = (type: string) => {
    setValue('subscriptionType', type as 'monthly' | 'quarterly' | 'yearly');
    setValue('amountPaid', getSubscriptionAmount(type));
    
    if (registrationDate) {
      const newDueDate = calculateDueDate(registrationDate, type);
      setDueDate(newDueDate);
      setValue('dueDate', newDueDate);
    }
  };

  const onRegistrationDateChange = (date: Date | undefined) => {
    if (date) {
      setRegistrationDate(date);
      setValue('registrationDate', date);
      
      if (subscriptionType) {
        const newDueDate = calculateDueDate(date, subscriptionType);
        setDueDate(newDueDate);
        setValue('dueDate', newDueDate);
      }
    }
  };

  const onSubmit = async (data: MemberForm) => {
    try {
      const memberData: MemberFormData = {
        fullName: data.fullName,
        contactNumber: data.contactNumber,
        registrationDate: data.registrationDate,
        subscriptionType: data.subscriptionType,
        amountPaid: data.amountPaid,
        dueDate: data.dueDate,
        paymentMethod: data.paymentMethod,
        paymentComplete: data.paymentComplete
      };
      const newMember = await addMember(memberData);
      
      toast({
        title: "Member Registered Successfully!",
        description: `${newMember.fullName} has been added to the system.`,
      });
      
      navigate('/');
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "There was an error registering the member. Please try again.",
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
            <h1 className="text-2xl font-bold text-foreground">New Member Registration</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
                <UserPlus className="h-6 w-6" />
                Register New Member
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter full name"
                    {...register('fullName')}
                    className={errors.fullName ? 'border-destructive' : ''}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Contact Number */}
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    placeholder="Enter contact number"
                    {...register('contactNumber')}
                    className={errors.contactNumber ? 'border-destructive' : ''}
                  />
                  {errors.contactNumber && (
                    <p className="text-sm text-destructive">{errors.contactNumber.message}</p>
                  )}
                </div>

                {/* Registration Date */}
                <div className="space-y-2">
                  <Label>Registration Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !registrationDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {registrationDate ? format(registrationDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={registrationDate}
                        onSelect={onRegistrationDateChange}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Subscription Type */}
                <div className="space-y-2">
                  <Label>Subscription Type</Label>
                  <Select onValueChange={onSubscriptionTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subscription type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
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

                {/* Due Date */}
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : "Select due date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={(date) => {
                          if (date) {
                            setDueDate(date);
                            setValue('dueDate', date);
                          }
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <Label>Payment Method</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setValue('paymentMethod', value as 'cash' | 'mpesa')}
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="flex-1 cursor-pointer">Cash</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="mpesa" id="mpesa" />
                      <Label htmlFor="mpesa" className="flex-1 cursor-pointer">M-Pesa</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Payment Complete */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Checkbox 
                      id="paymentComplete"
                      checked={watch('paymentComplete')}
                      onCheckedChange={(checked) => setValue('paymentComplete', !!checked)}
                    />
                    <Label htmlFor="paymentComplete" className="cursor-pointer">
                      Payment completed
                    </Label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="fitness" 
                  size="lg" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering...' : 'Register Member'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}