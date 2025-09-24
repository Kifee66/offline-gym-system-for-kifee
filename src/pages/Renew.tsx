import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMembers } from '@/hooks/useMembers';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/use-toast';

export default function Renew() {
  const { members, updateMember } = useMembers();
  const { addTransaction } = useTransactions();
  const { toast } = useToast();
  const [selectedMember, setSelectedMember] = useState<number | null>(null);

  const handleRenew = async (memberId: number) => {
    try {
      const member = members.find(m => m.id === memberId);
      if (!member) return;

      const newEndDate = new Date();
      newEndDate.setMonth(newEndDate.getMonth() + 1); // Add 1 month

      await updateMember(memberId, {
        endDate: newEndDate,
        status: 'active'
      });

      await addTransaction({
        memberId,
        amount: 3000, // Default monthly amount
        type: 'renewal',
        description: 'Membership renewal',
        date: new Date()
      });

      toast({
        title: "Success",
        description: "Membership renewed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to renew membership",
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
            <h1 className="text-2xl font-bold text-foreground">Renew Membership</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{member.name}</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    member.status === 'active' ? 'bg-green-100 text-green-800' :
                    member.status === 'due' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {member.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Phone: {member.phone}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Expires: {member.endDate.toLocaleDateString()}
                </p>
                <Button 
                  onClick={() => handleRenew(member.id!)} 
                  className="w-full"
                  variant={member.status === 'active' ? 'outline' : 'default'}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Renew Membership
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}