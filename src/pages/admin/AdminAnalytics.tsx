import React, { useState } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { useTransactions } from '@/hooks/useTransactions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, Users, DollarSign, Calendar, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { updateTransaction, deleteTransaction } from '@/lib/transactionActions';

const AdminAnalytics = () => {
  const { members, activeMembers, dueMembers, overdueMembers } = useMembers();
  const { revenueThisMonth, totalRevenue, transactions } = useTransactions();

  // Example: Monthly revenue breakdown
  const monthlyRevenue = transactions.reduce((acc, tx) => {
    const month = new Date(tx.date).toLocaleString('default', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  // Example: Member status breakdown
  const statusCounts = {
    active: activeMembers ? activeMembers.length : 0,
    due: dueMembers ? dueMembers.length : 0,
    overdue: overdueMembers ? overdueMembers.length : 0,
    total: members ? members.length : 0
  };

  // Editable transaction state
  const [editId, setEditId] = useState<number|null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');

  const handleEdit = (tx: import('@/lib/db').Transaction) => {
    setEditId(tx.id!);
    setEditAmount(tx.amount.toString());
    setEditDesc(tx.description || '');
  };

  const handleSave = async (id: number) => {
    await updateTransaction(id, { amount: Number(editAmount), description: editDesc });
    setEditId(null);
    setEditAmount('');
    setEditDesc('');
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this transaction?')) {
      await deleteTransaction(id);
    }
  };

  return (
    <div className="min-h-screen bg-muted/50">
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Analytics</h1>
              <p className="text-muted-foreground">Detailed reports and insights</p>
            </div>
            <Link to="/admin">
              <button className="btn btn-outline">Back to Dashboard</button>
            </Link>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold">{statusCounts.total}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                  <p className="text-2xl font-bold">{statusCounts.active}</p>
                </div>
                <Users className="w-8 h-8 text-status-active" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Due Soon</p>
                  <p className="text-2xl font-bold">{statusCounts.due}</p>
                </div>
                <Calendar className="w-8 h-8 text-status-due" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold">{statusCounts.overdue}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-status-overdue" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Revenue This Month</CardTitle>
              <CardDescription>Current month's total revenue</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold">KSh {revenueThisMonth.toLocaleString()}</p>
                <DollarSign className="w-8 h-8 text-fitness-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Revenue</CardTitle>
              <CardDescription>All-time revenue</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold">KSh {totalRevenue.toLocaleString()}</p>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Editable transaction table */}
        <Card>
          <CardHeader>
            <CardTitle>All Transactions (Edit Revenue)</CardTitle>
            <CardDescription>Admins can edit or delete revenue records below.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr>
                    <th className="py-2 px-4">Date</th>
                    <th className="py-2 px-4">Amount (KSh)</th>
                    <th className="py-2 px-4">Type</th>
                    <th className="py-2 px-4">Description</th>
                    <th className="py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(transactions || []).map(tx => (
                    <tr key={tx.id}>
                      <td className="py-2 px-4">{new Date(tx.date).toLocaleString()}</td>
                      <td className="py-2 px-4">
                        {editId === tx.id ? (
                          <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="border rounded px-2 py-1 w-24" />
                        ) : (
                          tx.amount.toLocaleString()
                        )}
                      </td>
                      <td className="py-2 px-4">{tx.type}</td>
                      <td className="py-2 px-4">
                        {editId === tx.id ? (
                          <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} className="border rounded px-2 py-1 w-32" />
                        ) : (
                          tx.description || ''
                        )}
                      </td>
                      <td className="py-2 px-4 flex gap-2">
                        {editId === tx.id ? (
                          <>
                            <button className="btn btn-success px-2 py-1" onClick={() => handleSave(tx.id)}>Save</button>
                            <button className="btn btn-outline px-2 py-1" onClick={() => setEditId(null)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-outline px-2 py-1" onClick={() => handleEdit(tx)}><Pencil className="w-4 h-4" /></button>
                            <button className="btn btn-destructive px-2 py-1" onClick={() => handleDelete(tx.id)}><Trash2 className="w-4 h-4" /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        {/* ...existing code... */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Breakdown</CardTitle>
            <CardDescription>Revenue by month</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr>
                    <th className="py-2 px-4">Month</th>
                    <th className="py-2 px-4">Revenue (KSh)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(monthlyRevenue).map(([month, amount]) => (
                    <tr key={month}>
                      <td className="py-2 px-4">{month}</td>
                      <td className="py-2 px-4">{amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
