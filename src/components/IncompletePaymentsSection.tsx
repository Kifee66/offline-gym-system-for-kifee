import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CreditCard, Check, Phone, Edit3, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMembers } from '@/hooks/useMembers';
import { useTransactions } from '@/hooks/useTransactions';
import { Member } from '@/lib/db';

interface IncompletePaymentsSectionProps {
  members: Member[];
}

export function IncompletePaymentsSection({ members }: IncompletePaymentsSectionProps) {
  const { updateMember } = useMembers();
  const { addTransaction } = useTransactions();
  const { toast } = useToast();
  const [editingMember, setEditingMember] = useState<number | null>(null);
  const [editAmountPaid, setEditAmountPaid] = useState<string>('');
  const [addToMonthlyRevenue, setAddToMonthlyRevenue] = useState<boolean>(true);

  const handleCompletePayment = async (memberId: number, memberName: string) => {
    try {
      await updateMember(memberId, { paymentComplete: true });
      toast({
        title: "Payment Completed",
        description: `Payment marked as complete for ${memberName}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditAmount = (memberId: number, member: Member) => {
    setEditingMember(memberId);
    setEditAmountPaid(member.amountPaid.toString());
  };

  const handleSaveAmount = async (memberId: number, memberName: string) => {
    try {
      const newAmountPaid = parseFloat(editAmountPaid);
      const currentMember = members.find(m => m.id === memberId);
      
      if (isNaN(newAmountPaid) || newAmountPaid < 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid amount.",
          variant: "destructive",
        });
        return;
      }

      if (!currentMember) {
        toast({
          title: "Error",
          description: "Member not found.",
          variant: "destructive",
        });
        return;
      }

      const additionalAmount = newAmountPaid - currentMember.amountPaid;

      // Update member payment details
      await updateMember(memberId, { amountPaid: newAmountPaid });

      // Create transaction if adding to revenue and there's additional amount
      if (addToMonthlyRevenue && additionalAmount !== 0) {
        await addTransaction({
          memberId: memberId,
          amount: Math.abs(additionalAmount),
          type: 'payment',
          description: `Payment adjustment - ${additionalAmount > 0 ? 'increase' : 'decrease'} of KSh ${Math.abs(additionalAmount)}`,
          date: new Date()
        });
      }

      setEditingMember(null);
      setEditAmountPaid('');
      setAddToMonthlyRevenue(true);
      toast({
        title: "Payment Updated",
        description: `Payment details updated for ${memberName}${addToMonthlyRevenue && additionalAmount !== 0 ? ' and recorded in transactions' : ''}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
    setEditAmountPaid('');
  };

  if (members.length === 0) {
    return (
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-500" />
            Incomplete Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">All payments are complete! 🎉</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-orange-500" />
          Incomplete Payments ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.slice(0, 5).map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-card-gradient rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{member.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {member.phone}
                  </div>
                   {editingMember === member.id ? (
                    <div className="mt-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Paid: KSh</span>
                        <Input
                          type="number"
                          value={editAmountPaid}
                          onChange={(e) => setEditAmountPaid(e.target.value)}
                          className="w-24 h-7 text-sm"
                          min="0"
                          step="1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="add-to-revenue"
                          checked={addToMonthlyRevenue}
                          onCheckedChange={setAddToMonthlyRevenue}
                        />
                        <Label htmlFor="add-to-revenue" className="text-sm">
                          Add to current month revenue
                        </Label>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 space-y-1">
                      <Badge variant="outline">
                        Paid: KSh {member.amountPaid.toLocaleString()}
                      </Badge>
                      <Badge variant="secondary" className="ml-2">
                        Status: {member.paymentComplete ? 'Complete' : 'Incomplete'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editingMember === member.id ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleSaveAmount(member.id!, member.name)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditAmount(member.id, member)}
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleCompletePayment(member.id!, member.name)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
          {members.length > 5 && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              And {members.length - 5} more...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}