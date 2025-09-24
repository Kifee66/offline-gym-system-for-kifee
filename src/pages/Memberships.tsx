import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MemberCard } from '@/components/MemberCard';
import { MemberSearch } from '@/components/MemberSearch';
import { useCachedMemberStore } from '@/hooks/useCachedMemberStore';
import { ArrowLeft, Users, Activity, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
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

type StatusFilter = 'all' | 'active' | 'due' | 'overdue';

export default function Memberships() {
  const [searchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') as StatusFilter) || 'all';
  const initialSearch = searchParams.get('search') || '';
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);

  const { 
    members, 
    searchQuery, 
    searchMembers, 
    activeMembers, 
    dueMembers, 
    overdueMembers,
    deleteOverdueMembers,
    deleteMember 
  } = useCachedMemberStore();
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Set initial search query from URL params
  useEffect(() => {
    if (initialSearch && initialSearch !== searchQuery) {
      searchMembers(initialSearch);
    }
  }, [initialSearch, searchMembers, searchQuery]);

  const getFilteredMembers = () => {
    switch (statusFilter) {
      case 'active': return activeMembers;
      case 'due': return dueMembers;
      case 'overdue': return overdueMembers;
      default: return members;
    }
  };

  const filteredMembers = getFilteredMembers();

  const getStatusInfo = (status: StatusFilter) => {
    switch (status) {
      case 'active':
        return {
          title: 'Active Members',
          icon: <Activity className="h-5 w-5" />,
          color: 'text-status-active',
          bgColor: 'bg-status-active'
        };
      case 'due':
        return {
          title: 'Due Soon',
          icon: <Clock className="h-5 w-5" />,
          color: 'text-status-due',
          bgColor: 'bg-status-due'
        };
      case 'overdue':
        return {
          title: 'Overdue Members',
          icon: <AlertTriangle className="h-5 w-5" />,
          color: 'text-status-overdue',
          bgColor: 'bg-status-overdue'
        };
      default:
        return {
          title: 'All Members',
          icon: <Users className="h-5 w-5" />,
          color: 'text-primary',
          bgColor: 'bg-primary'
        };
    }
  };

  const statusInfo = getStatusInfo(statusFilter);

  const handleDeleteOverdueMembers = async () => {
    try {
      await deleteOverdueMembers();
      toast({
        title: "Success",
        description: `Successfully deleted ${overdueMembers.length} overdue members.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete overdue members.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      await deleteMember(memberId);
      toast({
        title: "Success",
        description: "Member deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete member.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className={`p-2 ${statusInfo.bgColor} rounded-full`}>
                  <div className="text-white">
                    {statusInfo.icon}
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-foreground">{statusInfo.title}</h1>
              </div>
            </div>
            <MemberSearch onSearch={searchMembers} searchQuery={searchQuery} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Status Filter Buttons */}
        <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-center">Filter by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant={statusFilter === 'all' ? 'fitness' : 'outline'}
                onClick={() => setStatusFilter('all')}
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                All ({members.length})
              </Button>
              
              <Button
                variant={statusFilter === 'active' ? 'success' : 'outline'}
                onClick={() => setStatusFilter('active')}
                className="w-full"
              >
                <Activity className="h-4 w-4 mr-2" />
                Active ({activeMembers.length})
              </Button>
              
              <Button
                variant={statusFilter === 'due' ? 'warning' : 'outline'}
                onClick={() => setStatusFilter('due')}
                className="w-full"
              >
                <Clock className="h-4 w-4 mr-2" />
                Due ({dueMembers.length})
              </Button>
              
              <Button
                variant={statusFilter === 'overdue' ? 'danger' : 'outline'}
                onClick={() => setStatusFilter('overdue')}
                className="w-full"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Overdue ({overdueMembers.length})
              </Button>
            </div>
          </CardContent>
        </Card>


        {/* Members Grid */}
        {filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <MemberCard 
                key={member.id} 
                member={member}
                onRenew={(memberId) => {
                  // Navigate to renewal page with member ID
                  navigate(`/renew?memberId=${memberId}`);
                }}
                onDelete={handleDeleteMember}
                showDeleteButton={member.status === 'overdue'}
              />
            ))}
          </div>
        ) : (
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <Users className="h-16 w-16 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">No Members Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? `No members match your search "${searchQuery}"`
                      : `No ${statusFilter === 'all' ? '' : statusFilter} members found`
                    }
                  </p>
                </div>
                {statusFilter === 'all' && !searchQuery && (
                  <Link to="/register">
                    <Button variant="fitness">
                      Register New Member
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}