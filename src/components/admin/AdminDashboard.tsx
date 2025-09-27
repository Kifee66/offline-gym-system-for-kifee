import { useMembers } from '@/hooks/useMembers';
import { useTransactions } from '@/hooks/useTransactions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/useAdmin';
import { Link } from 'react-router-dom';
import { 
  Users, 
  DollarSign, 
  AlertTriangle, 
  Calendar,
  Settings,
  UserCog,
  BarChart3,
  LogOut 
} from 'lucide-react';

const AdminDashboard = () => {
  const { members, activeMembers, dueMembers, overdueMembers } = useMembers();
  const { revenueThisMonth, totalRevenue } = useTransactions();
  const { logout } = useAdmin();

  const stats = [
    {
      title: 'Total Members',
      value: members.length,
      icon: Users,
      color: 'text-primary'
    },
    {
      title: 'Active Members',
      value: activeMembers.length,
      icon: Users,
      color: 'text-status-active'
    },
    {
      title: 'Due Soon',
      value: dueMembers.length,
      icon: Calendar,
      color: 'text-status-due'
    },
    {
      title: 'Overdue',
      value: overdueMembers.length,
      icon: AlertTriangle,
      color: 'text-status-overdue'
    }
  ];

  const revenueStats = [
    {
      title: 'This Month',
      value: `KSh ${revenueThisMonth.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-fitness-success'
    },
    {
      title: 'Total Revenue',
      value: `KSh ${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-primary'
    }
  ];

  const quickActions = [
    {
      title: 'Manage Members',
      description: 'View, edit, and manage all gym members',
      icon: UserCog,
      href: '/admin/members',
      color: 'bg-primary'
    },
    {
      title: 'Analytics',
      description: 'View detailed reports and analytics',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'bg-fitness-success'
    },
    {
      title: 'Settings',
      description: 'Change password and system settings',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-secondary'
    }
  ];

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage your gym system</p>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="outline">View Site</Button>
              </Link>
              <Button variant="destructive" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Member Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {revenueStats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access key admin functions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link key={action.title} to={action.href}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center`}>
                          <action.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{action.title}</h3>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;