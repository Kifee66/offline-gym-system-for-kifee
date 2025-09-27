import { useState } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  AlertTriangle 
} from 'lucide-react';
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
} from "@/components/ui/alert-dialog";

const AdminMemberManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'due' | 'overdue'>('all');
  const { members, deleteMember, updateMember } = useMembers();
  const { toast } = useToast();

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteMember = async (id: number, name: string) => {
    try {
      await deleteMember(id);
      toast({
        title: "Success",
        description: `${name} has been deleted successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete member",
        variant: "destructive"
      });
    }
  };

  const handleTogglePaymentStatus = async (member: any) => {
    try {
      await updateMember(member.id, { 
        paymentComplete: !member.paymentComplete 
      });
      toast({
        title: "Success",
        description: `Payment status updated for ${member.name}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'default' as const, className: 'bg-status-active text-white' },
      due: { variant: 'secondary' as const, className: 'bg-status-due text-white' },
      overdue: { variant: 'destructive' as const, className: 'bg-status-overdue text-white' }
    };
    return variants[status as keyof typeof variants] || variants.active;
  };

  const statusCounts = {
    all: members.length,
    active: members.filter(m => m.status === 'active').length,
    due: members.filter(m => m.status === 'due').length,
    overdue: members.filter(m => m.status === 'overdue').length
  };

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Member Management</h1>
              <p className="text-muted-foreground">Manage all gym members</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status as any)}
                    className="capitalize"
                  >
                    {status} ({count})
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Members ({filteredMembers.length})</CardTitle>
            <CardDescription>
              View and manage all gym members
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No members found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{member.name}</h3>
                        <Badge {...getStatusBadge(member.status)}>
                          {member.status}
                        </Badge>
                        {!member.paymentComplete && (
                          <Badge variant="outline" className="border-status-overdue text-status-overdue">
                            Payment Incomplete
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Phone: {member.phone}</p>
                        <p>Subscription: {member.subscriptionType} (KSh {member.amountPaid.toLocaleString()})</p>
                        <p>Period: {new Date(member.startDate).toLocaleDateString()} - {new Date(member.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePaymentStatus(member)}
                      >
                        {member.paymentComplete ? (
                          <>
                            <UserX className="w-4 h-4 mr-1" />
                            Mark Unpaid
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-1" />
                            Mark Paid
                          </>
                        )}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-status-overdue" />
                              Delete Member
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{member.name}</strong>? 
                              This action cannot be undone and will also delete all associated transactions.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteMember(member.id!, member.name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminMemberManager;