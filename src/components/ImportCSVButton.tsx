
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { db, addTransaction } from '@/lib/db';

type ImportedMemberRow = {
  Name: string;
  Phone: string;
  Status?: string;
  'Subscription Type'?: string;
  'Start Date'?: string;
  'End Date'?: string;
  'Amount Paid'?: string | number;
  'Payment Method'?: string;
  'Payment Complete'?: string;
};

export const ImportCSVButton = () => {
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Normalize keys and trim values for each row
          const members = (results.data as Record<string, string | undefined>[]).map(row => {
            const normalized: Record<string, string> = {};
            Object.entries(row).forEach(([key, value]) => {
              const cleanKey = key.trim().toLowerCase();
              normalized[cleanKey] = (value ?? '').trim();
            });
            return normalized;
          });
          let added = 0;
          for (const m of members) {
            // Map normalized keys to expected fields
            const name = m['name'];
            const phone = m['phone'];
            if (!name || !phone) continue;
            const startDate = m['start date'] ? new Date(m['start date']) : new Date();
            const endDate = m['end date'] ? new Date(m['end date']) : new Date();
            const amountPaid = Number(m['amount paid']) || 0;
            // Map status to allowed values
            const allowedStatus = ['active', 'due', 'overdue'] as const;
            const statusStr = (m['status'] || '').toLowerCase();
            const status = allowedStatus.find(s => s === statusStr) ?? 'active';
            // Map subscriptionType to allowed values
            const allowedSubs = ['monthly', 'weekly', 'quarterly', 'yearly'] as const;
            const subStr = (m['subscription type'] || '').toLowerCase();
            const subscriptionType = allowedSubs.find(s => s === subStr) ?? 'monthly';
            // Map paymentMethod to allowed values
            const allowedMethods = ['cash', 'mpesa'] as const;
            const methodStr = (m['payment method'] || '').toLowerCase();
            const paymentMethod = allowedMethods.find(meth => meth === methodStr) ?? 'cash';
            const paymentComplete = m['payment complete'] === 'Yes' || m['payment complete'] === 'yes';
            const createdAt = new Date();
            const updatedAt = new Date();
            // Add member
            const memberId = await db.members.add({
              name,
              phone,
              status,
              subscriptionType,
              startDate,
              endDate,
              amountPaid,
              paymentMethod,
              paymentComplete,
              createdAt,
              updatedAt,
              checkInHistory: [],
            });
            // Add transaction for revenue if amountPaid > 0
            if (amountPaid > 0) {
              await addTransaction({
                memberId,
                amount: amountPaid,
                type: 'payment',
                description: 'Imported member payment',
                date: startDate,
              });
            }
            added++;
          }
          toast({
            title: 'Import Complete',
            description: `${added} members imported successfully.`
          });
        } catch (error) {
          toast({
            title: 'Import Failed',
            description: `Error importing members: ${error instanceof Error ? error.message : String(error)}`,
            variant: 'destructive'
          });
        }
      },
      error: (error) => {
        toast({
          title: 'Import Failed',
          description: `CSV parse error: ${error.message}`,
          variant: 'destructive'
        });
      }
    });
  };

  return (
    <label>
      <Button asChild variant="outline" size="sm">
        <span>Import CSV</span>
      </Button>
      <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />
    </label>
  );
};
