import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useMembers } from '@/hooks/useMembers';
import type { Member } from '@/lib/db';
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
import { db } from '@/lib/db';

const AdminMemberManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'due' | 'overdue'>('all');
  const { toast } = useToast();

  // Clear all members and their transactions
  const handleClearAllMembers = async () => {
    try {
      await db.transactions.clear();
      await db.members.clear();
      toast({
        title: 'All Members Cleared',
        description: 'All members and their transactions have been deleted.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear members.'
      });
    }
  };
  const { members, deleteMember, updateMember } = useMembers();
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState<Partial<Member> | null>(null);
  const handleEditClick = (member: Member) => {
    setEditMember(member);
    setEditForm({
      name: member.name,
      phone: member.phone,
      subscriptionType: member.subscriptionType,
      amountPaid: member.amountPaid,
      paymentMethod: member.paymentMethod,
      paymentComplete: member.paymentComplete,
      startDate: member.startDate,
      endDate: member.endDate
    });
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setEditForm((prev) => ({
      ...prev!,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleEditFormCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditForm((prev) => ({
      ...prev!,
      [name]: checked
    }));
  };

  const handleEditSave = async () => {
    if (!editMember || !editForm) return;
    await updateMember(editMember.id!, editForm);
    toast({ title: 'Success', description: 'Member details updated.' });
    setEditMember(null);
    setEditForm(null);
  };

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

  const handleTogglePaymentStatus = async (member: Member) => {
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
            {/* Clear All Members Button */}
            <div className="ml-auto">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Clear All Members</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all members and their transactions. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAllMembers}>Delete All</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
                    onClick={() => setStatusFilter(status as typeof statusFilter)}
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
                        onClick={() => handleEditClick(member)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>

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
      {/* Edit Member Dialog */}
      <Dialog open={!!editMember} onOpenChange={open => { if (!open) { setEditMember(null); setEditForm(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member Details</DialogTitle>
          </DialogHeader>
          {editForm && (
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleEditSave(); }}>
              <div>
                <label className="block text-sm font-medium">Full Name</label>
                <input className="input w-full" name="name" value={editForm.name} onChange={handleEditFormChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium">Phone</label>
                <input className="input w-full" name="phone" value={editForm.phone} onChange={handleEditFormChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium">Subscription Type</label>
                <select className="input w-full" name="subscriptionType" value={editForm.subscriptionType} onChange={handleEditFormChange} required>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Amount Paid (KSh)</label>
                <input className="input w-full" name="amountPaid" type="number" value={editForm.amountPaid} onChange={handleEditFormChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium">Payment Method</label>
                <select className="input w-full" name="paymentMethod" value={editForm.paymentMethod} onChange={handleEditFormChange} required>
                  <option value="cash">Cash</option>
                  <option value="mpesa">Mpesa</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="paymentComplete" name="paymentComplete" checked={editForm.paymentComplete} onChange={handleEditFormCheckbox} />
                <label htmlFor="paymentComplete">Payment Complete</label>
              </div>
              <div>
                <label className="block text-sm font-medium">Start Date</label>
                <input className="input w-full" name="startDate" type="date" value={editForm.startDate ? new Date(editForm.startDate).toISOString().split('T')[0] : ''} onChange={handleEditFormChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium">End Date</label>
                <input className="input w-full" name="endDate" type="date" value={editForm.endDate ? new Date(editForm.endDate).toISOString().split('T')[0] : ''} onChange={handleEditFormChange} required />
              </div>
              <DialogFooter>
                <Button type="submit" variant="success">Save</Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={() => { setEditMember(null); setEditForm(null); }}>Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

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