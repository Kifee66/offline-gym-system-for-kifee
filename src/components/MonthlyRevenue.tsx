import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '@/hooks/useTransactions';

export function MonthlyRevenue() {
  const navigate = useNavigate();
  const { transactions, totalRevenue } = useTransactions();

  // Calculate monthly revenue
  const monthlyRevenue = transactions.reduce((acc, transaction) => {
    const month = transaction.date.toISOString().slice(0, 7);
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  // Sort months and get recent 6 months
  const sortedMonths = Object.entries(monthlyRevenue)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6);

  return (
    <Card 
      className="bg-card-gradient border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
      onClick={() => navigate('/revenue')}
    >
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Monthly Revenue
          <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-primary/10 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-foreground">KSh {totalRevenue.toLocaleString()}</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Recent Months (Top 3)</h4>
            {sortedMonths.length > 0 ? (
              sortedMonths.slice(0, 3).map(([month, amount]) => (
                <div key={month} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span className="text-sm font-medium">
                    {new Date(month + '-01').toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short' 
                    })}
                  </span>
                  <span className="font-semibold">KSh {amount.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No revenue data available</p>
            )}
            
            {sortedMonths.length > 3 && (
              <div className="text-center pt-2">
                <p className="text-sm text-primary font-medium">Click to view all months →</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}