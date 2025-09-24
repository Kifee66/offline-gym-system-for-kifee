import { Member } from '@/types/member';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StatusSectionProps {
  title: string;
  members: Member[];
  status: 'active' | 'due' | 'overdue' | 'incomplete';
  icon?: React.ReactNode;
}

export function StatusSection({ title, members, status, icon }: StatusSectionProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-status-active text-white';
      case 'due': return 'bg-status-due text-white';
      case 'overdue': return 'bg-status-overdue text-white';
      case 'incomplete': return 'bg-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'active': return 'border-l-status-active';
      case 'due': return 'border-l-status-due';
      case 'overdue': return 'border-l-status-overdue';
      case 'incomplete': return 'border-l-orange-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow duration-200 border-l-4 ${getBorderColor(status)}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Link to={`/memberships?status=${status}`}>
          <div className="flex items-center justify-between p-4 bg-card-gradient rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-full">
                {icon || <Users className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {title} Members
                </p>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(status)}>
                    {members.length} member{members.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}