import { Member } from '@/types/member';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Calendar, DollarSign, CreditCard, Clock, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format, differenceInDays } from 'date-fns';

interface MemberCardProps {
  member: Member;
  onRenew?: (memberId: string) => void;
  onDelete?: (memberId: string) => void;
  showDeleteButton?: boolean;
}

export function MemberCard({ member, onRenew, onDelete, showDeleteButton }: MemberCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-status-active text-white';
      case 'due': return 'bg-status-due text-white';
      case 'overdue': return 'bg-status-overdue text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'due': return 'Due Soon';
      case 'overdue': return 'Overdue';
      default: return status;
    }
  };

  const getDuePeriodInfo = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    const dueDate = new Date(member.dueDate);
    dueDate.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    const daysDifference = differenceInDays(dueDate, today);
    
    if (member.status === 'overdue') {
      const daysOverdue = Math.abs(daysDifference);
      return {
        text: `${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue`,
        color: 'text-status-overdue'
      };
    } else if (member.status === 'due') {
      return {
        text: `Due in ${daysDifference} day${daysDifference === 1 ? '' : 's'}`,
        color: 'text-status-due'
      };
    }
    return null;
  };

  const duePeriodInfo = getDuePeriodInfo();

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{member.fullName}</CardTitle>
          <Badge className={getStatusColor(member.status)}>
            {getStatusLabel(member.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{member.contactNumber}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Due: {format(member.dueDate, 'MMM dd, yyyy')}</span>
        </div>

        {duePeriodInfo && (
          <div className={`flex items-center gap-2 text-sm font-medium ${duePeriodInfo.color}`}>
            <Clock className="h-4 w-4" />
            <span>{duePeriodInfo.text}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DollarSign className="h-4 w-4" />
          <span>Last Payment: KSh {member.amountPaid.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CreditCard className="h-4 w-4" />
          <span className="capitalize">{member.paymentMethod}</span>
        </div>
        
        <div className="flex gap-2 mt-4">
          {onRenew && (
            <Button 
              variant={member.status === 'active' ? 'outline' : 'fitness'}
              size="sm" 
              className="flex-1"
              onClick={() => onRenew(member.id)}
            >
              Renew Membership
            </Button>
          )}
          
          {showDeleteButton && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="px-3"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Member</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {member.fullName}? This action cannot be undone and will permanently remove their data and payment history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDelete(member.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Member
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}