import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CalendarDays, Phone, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMembers } from '@/hooks/useMembers';
import { format } from 'date-fns';
import RenewMemberForm from '@/components/RenewMemberForm';
import { Member } from '@/lib/db';

export default function Renew() {
  const { members } = useMembers();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [search, setSearch] = useState('');

  if (selectedMember) {
    return (
      <div className="min-h-screen bg-hero-gradient">
        <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Members
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Renew Membership</h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <RenewMemberForm
            member={selectedMember}
            onSuccess={() => setSelectedMember(null)}
            onCancel={() => setSelectedMember(null)}
          />
        </div>
      </div>
    );
  }

  // Filter members by search
  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.includes(search)
  );

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Renew Membership</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 max-w-md">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input w-full px-4 py-2 border rounded focus:outline-none focus:ring"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className={`pb-3 ${
                member.status === 'active' ? 'bg-green-50' :
                member.status === 'due' ? 'bg-yellow-50' :
                'bg-red-50'
              }`}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {member.name}
                  </CardTitle>
                  <Badge variant={
                    member.status === 'active' ? 'default' :
                    member.status === 'due' ? 'secondary' : 
                    'destructive'
                  }>
                    {member.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {member.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  Expires: {format(new Date(member.endDate), 'PPP')}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Subscription:</span> {member.subscriptionType}
                </div>
                <div className="pt-2">
                  <Button 
                    size="sm" 
                    onClick={() => setSelectedMember(member)}
                    className="w-full"
                  >
                    Renew Membership
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}