import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCachedMemberStore } from '@/hooks/useCachedMemberStore';
import { TrendingUp, ArrowLeft, Calendar, DollarSign, Users, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface PaymentTransaction {
  id: string;
  member_id: string;
  amount: number;
  transaction_type: 'registration' | 'renewal' | 'additional_payment' | 'incomplete';
  transaction_date: string;
  description?: string;
}

interface MemberWithPayments {
  id: string;
  full_name: string;
  payment_method: string;
}

export default function Revenue() {
  const { members } = useCachedMemberStore();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<Record<string, number>>({});
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [includeIncompletePayments, setIncludeIncompletePayments] = useState(false);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const { data: transactionData, error } = await supabase
          .from('payment_transactions')
          .select('*')
          .order('transaction_date', { ascending: false });

        if (error) throw error;

        const typedTransactions = (transactionData || []).map(t => ({
          ...t,
          transaction_type: t.transaction_type as PaymentTransaction['transaction_type']
        }));
        setTransactions(typedTransactions);
        calculateRevenue(typedTransactions, includeIncompletePayments);
      } catch (error) {
        console.error('Error fetching revenue:', error);
      }
    };

    fetchRevenue();
  }, []);

  useEffect(() => {
    calculateRevenue(transactions, includeIncompletePayments);
  }, [includeIncompletePayments, transactions]);

  const calculateRevenue = (transactionData: PaymentTransaction[], includeIncomplete: boolean) => {
    const monthlyTotals: Record<string, number> = {};
    let total = 0;

    transactionData.forEach(transaction => {
      // Skip incomplete payments if toggle is off
      if (transaction.transaction_type === 'incomplete' && !includeIncomplete) {
        return;
      }

      const month = transaction.transaction_date.slice(0, 7);
      if (!monthlyTotals[month]) {
        monthlyTotals[month] = 0;
      }
      monthlyTotals[month] += Number(transaction.amount);
      total += Number(transaction.amount);
    });

    setMonthlyRevenue(monthlyTotals);
    setTotalRevenue(total);
  };

  // Sort months chronologically (newest first)
  const sortedMonths = Object.entries(monthlyRevenue)
    .sort(([a], [b]) => b.localeCompare(a));

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthRevenue = monthlyRevenue[currentMonth] || 0;

  const getPaymentsByMonth = (month: string) => {
    return transactions
      .filter(t => {
        const transactionMonth = t.transaction_date.slice(0, 7);
        const isInMonth = transactionMonth === month;
        const shouldInclude = t.transaction_type !== 'incomplete' || includeIncompletePayments;
        return isInMonth && shouldInclude;
      })
      .map(transaction => {
        const member = members.find(m => m.id === transaction.member_id);
        return {
          id: transaction.id,
          amount: Number(transaction.amount),
          type: transaction.transaction_type,
          date: new Date(transaction.transaction_date),
          memberName: member?.fullName || 'Unknown Member',
          method: member?.paymentMethod || 'unknown',
          description: transaction.description
        };
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Revenue Analytics</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {auth?.user?.name}
            </span>
            <Button
              variant="outline"
              onClick={auth?.logout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="bg-card-gradient border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">KSh {totalRevenue.toLocaleString()}</p>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="include-incomplete"
                  checked={includeIncompletePayments}
                  onChange={(e) => setIncludeIncompletePayments(e.target.checked)}
                  className="rounded border border-muted-foreground"
                />
                <label htmlFor="include-incomplete" className="text-sm text-muted-foreground">
                  Include Incomplete Payments
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-gradient border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">KSh {currentMonthRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-card-gradient border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Total Months
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{sortedMonths.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card-gradient border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Monthly Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedMonths.length > 0 ? (
                sortedMonths.map(([month, amount]) => {
                  const monthDate = new Date(month + '-01');
                  const isCurrentMonth = month === currentMonth;
                  const isSelected = selectedMonth === month;
                  
                  return (
                    <div key={month}>
                      <div 
                        className={`flex justify-between items-center p-4 rounded-lg border transition-colors cursor-pointer hover:bg-primary/5 ${
                          isCurrentMonth 
                            ? 'bg-primary/10 border-primary/20' 
                            : isSelected
                            ? 'bg-primary/5 border-primary/10'
                            : 'bg-muted/50 border-muted'
                        }`}
                        onClick={() => setSelectedMonth(isSelected ? null : month)}
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-semibold text-foreground">
                              {monthDate.toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long' 
                              })}
                            </p>
                            {isCurrentMonth && (
                              <p className="text-sm text-primary font-medium">Current Month</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Click to view payment history
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-foreground">KSh {amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {((amount / totalRevenue) * 100).toFixed(1)}% of total
                          </p>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="mt-2 ml-8 p-4 bg-muted/30 rounded-lg border">
                          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Payment History - {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </h4>
                          {getPaymentsByMonth(month).length > 0 ? (
                            <div className="space-y-2">
                              {getPaymentsByMonth(month).map((payment) => (
                                <div key={payment.id} className="flex justify-between items-center py-2 px-3 bg-background/50 rounded border">
                                  <div className="flex items-center gap-3">
                                     <div className={`w-2 h-2 rounded-full ${
                                       payment.type === 'registration' 
                                         ? 'bg-green-500' 
                                         : payment.type === 'renewal' 
                                         ? 'bg-blue-500' 
                                         : payment.type === 'incomplete'
                                         ? 'bg-red-500'
                                         : 'bg-orange-500'
                                     }`} />
                                    <div>
                                      <p className="font-medium text-foreground">{payment.memberName}</p>
                                       <p className="text-xs text-muted-foreground">
                                         {payment.type === 'registration' 
                                           ? 'Registration' 
                                           : payment.type === 'renewal' 
                                           ? 'Renewal' 
                                           : payment.type === 'incomplete'
                                           ? 'Incomplete Payment'
                                           : 'Additional Payment'} • {payment.method.toUpperCase()}
                                       </p>
                                      {payment.description && (
                                        <p className="text-xs text-muted-foreground/80">{payment.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-foreground">KSh {payment.amount.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {payment.date.toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No payments recorded for this month</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">No revenue data available</p>
                  <p className="text-sm text-muted-foreground">Revenue will appear here as members make payments</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}