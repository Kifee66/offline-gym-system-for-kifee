import { useState, useEffect } from 'react'; // Fixed LogIn reference error
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusSection } from '@/components/StatusSection';
import { MemberSearch } from '@/components/MemberSearch';
import { IncompletePaymentsSection } from '@/components/IncompletePaymentsSection';
import { MonthlyRevenue } from '@/components/MonthlyRevenue';
import { useCachedMemberStore } from '@/hooks/useCachedMemberStore';
import { 
  UserPlus, 
  RefreshCw, 
  Users, 
  Activity,
  AlertTriangle,
  Clock,
  TrendingUp,
  CreditCard,
  LogOut
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { 
    members, 
    searchQuery, 
    searchMembers, 
    activeMembers, 
    dueMembers, 
    overdueMembers,
    incompletePaymentMembers
  } = useCachedMemberStore();
  
  const { logout } = useAuth();
  const [incompletePaymentsCount, setIncompletePaymentsCount] = useState(0);

  const totalRevenue = members.reduce((sum, member) => sum + member.amountPaid, 0);

  useEffect(() => {
    const fetchIncompletePaymentsCount = async () => {
      try {
        const { count, error } = await supabase
          .from('payment_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('transaction_type', 'incomplete');

        if (error) throw error;
        setIncompletePaymentsCount(count || 0);
      } catch (error) {
        console.error('Error fetching incomplete payments count:', error);
      }
    };

    fetchIncompletePaymentsCount();

    // Set up real-time subscription for incomplete payments
    const channel = supabase
      .channel('incomplete-payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_transactions',
          filter: 'transaction_type=eq.incomplete'
        },
        () => {
          fetchIncompletePaymentsCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-hero-gradient">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-fitness-gradient bg-clip-text text-transparent">
                FitTrack Pro
              </h1>
              <p className="text-muted-foreground mt-1">
                Complete gym membership management system
              </p>
            </div>
            <div className="flex items-center gap-4">
              <MemberSearch onSearch={searchMembers} searchQuery={searchQuery} />
              <Button 
                variant="outline" 
                onClick={() => logout()}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card-gradient border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                  <p className="text-3xl font-bold text-foreground">{members.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-gradient border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                  <p className="text-3xl font-bold text-status-active">{activeMembers.length}</p>
                </div>
                <Activity className="h-8 w-8 text-status-active" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-gradient border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Due Soon</p>
                  <p className="text-3xl font-bold text-status-due">{dueMembers.length}</p>
                </div>
                <Clock className="h-8 w-8 text-status-due" />
              </div>
            </CardContent>
          </Card>

          <MonthlyRevenue />
        </div>

        {/* Main Action Buttons */}
        <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-foreground">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link to="/register">
                <Button variant="fitness" size="lg" className="w-full h-20 text-base flex flex-col items-center justify-center gap-2">
                  <UserPlus className="h-6 w-6" />
                  <span className="text-center leading-tight">Register New Member</span>
                </Button>
              </Link>
              
              <Link to="/renew">
                <Button variant="fitness" size="lg" className="w-full h-20 text-base flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-6 w-6" />
                  <span className="text-center leading-tight">Renew Subscription</span>
                </Button>
              </Link>
              
              <Link to="/memberships">
                <Button variant="fitness" size="lg" className="w-full h-20 text-base flex flex-col items-center justify-center gap-2">
                  <Users className="h-6 w-6" />
                  <span className="text-center leading-tight">Access Memberships</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Status Overview */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Membership Overview</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StatusSection 
              title="Active" 
              members={activeMembers} 
              status="active"
              icon={<Activity className="h-5 w-5 text-status-active" />}
            />
            
            <StatusSection 
              title="Due" 
              members={dueMembers} 
              status="due"
              icon={<Clock className="h-5 w-5 text-status-due" />}
            />
            
            <StatusSection 
              title="Overdue" 
              members={overdueMembers} 
              status="overdue"
              icon={<AlertTriangle className="h-5 w-5 text-status-overdue" />}
            />
          </div>

          {/* Incomplete Payments Detail Section */}
          <IncompletePaymentsSection members={incompletePaymentMembers} />
        </div>
      </div>
    </div>
  );
}