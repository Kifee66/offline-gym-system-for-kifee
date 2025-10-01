import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type MemberWithCheckIn = import('@/lib/db').Member & { checkInHistory?: { date: string }[] };
export const ExportButtons = () => {
  const { members } = useMembers() as { members: MemberWithCheckIn[] };
  const { transactions } = useTransactions();
  const { toast } = useToast();

  const exportToCSV = () => {
    try {
      const memberData = members.map(member => {
        const startDate = member.startDate instanceof Date ? member.startDate : new Date(member.startDate);
        const endDate = member.endDate instanceof Date ? member.endDate : new Date(member.endDate);
        return {
          Name: member.name,
          Phone: member.phone,
          Status: member.status,
          'Subscription Type': member.subscriptionType,
          'Start Date': startDate.toLocaleDateString(),
          'End Date': endDate.toLocaleDateString(),
          'Amount Paid': member.amountPaid,
          'Payment Method': member.paymentMethod,
          'Payment Complete': member.paymentComplete ? 'Yes' : 'No',
          'Check-In History': member.checkInHistory ? member.checkInHistory.map(c => new Date(c.date).toLocaleDateString()).join(', ') : ''
        };
      });

      // Add total revenue row (all fields as string for summary row)
      const totalRevenue = members.reduce((sum, m) => sum + (typeof m.amountPaid === 'number' ? m.amountPaid : 0), 0);
      const summaryRow = {
        Name: '',
        Phone: '',
        Status: '',
        'Subscription Type': '',
        'Start Date': '',
        'End Date': '',
        'Amount Paid': `TOTAL: ${totalRevenue}`,
        'Payment Method': '',
        'Payment Complete': '',
        'Check-In History': ''
      };

  const csv = Papa.unparse([...memberData, summaryRow]);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gym-members-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Member data exported to CSV file"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export data to CSV",
        variant: "destructive"
      });
    }
  };

  const exportToPDF = () => {
  try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Gym Members Report', 20, 20);
      
      // Add generation date
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);

      // Prepare table data
      const tableData = members.map(member => {
        const startDate = member.startDate instanceof Date ? member.startDate : new Date(member.startDate);
        const endDate = member.endDate instanceof Date ? member.endDate : new Date(member.endDate);
        return [
          member.name,
          member.phone,
          member.status,
          member.subscriptionType,
          startDate.toLocaleDateString(),
          endDate.toLocaleDateString(),
          `KES ${member.amountPaid.toLocaleString()}`,
          member.paymentMethod,
          member.paymentComplete ? 'Yes' : 'No',
          member.checkInHistory ? member.checkInHistory.map(c => new Date(c.date).toLocaleDateString()).join(', ') : ''
        ];
      });

      // Add table
      autoTable(doc, {
        head: [['Name', 'Phone', 'Status', 'Subscription', 'Start Date', 'End Date', 'Amount', 'Payment Method', 'Paid', 'Check-In History']],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 70, 229] }
      });

  // Add summary section
  // @ts-expect-error: autoTable attaches lastAutoTable to doc
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 65;
  doc.setFontSize(14);
  doc.text('Summary', 20, finalY);
      
  doc.setFontSize(10);
  doc.text(`Total Members: ${members.length}`, 20, finalY + 10);
  doc.text(`Active Members: ${members.filter(m => m.status === 'active').length}`, 20, finalY + 20);
  doc.text(`Due Members: ${members.filter(m => m.status === 'due').length}`, 20, finalY + 30);
  doc.text(`Overdue Members: ${members.filter(m => m.status === 'overdue').length}`, 20, finalY + 40);
  const totalRevenue = members.reduce((sum, m) => sum + (typeof m.amountPaid === 'number' ? m.amountPaid : 0), 0);
  doc.text(`Total Revenue Collected: KSh ${totalRevenue.toLocaleString()}`, 20, finalY + 50);

      // Save the PDF
      doc.save(`gym-members-report-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "Export Successful",
        description: "Member data exported to PDF file"
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: `Could not export data to PDF: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={exportToCSV} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
      <Button onClick={exportToPDF} variant="outline" size="sm">
        <FileText className="h-4 w-4 mr-2" />
        Export PDF
      </Button>
    </div>
  );
};