import { useLiveQuery } from 'dexie-react-hooks';
import { db, Member, addMember, updateMember, deleteMember, updateAllMemberStatuses } from '@/lib/db';

export const useMembers = () => {
  const members = useLiveQuery(() => db.members.orderBy('createdAt').reverse().toArray());
  const memberCount = useLiveQuery(() => db.members.count());

  const activeMembers = useLiveQuery(() => 
    db.members.where('status').equals('active').toArray()
  );

  const dueMembers = useLiveQuery(() => 
    db.members.where('status').equals('due').toArray()
  );

  const overdueMembers = useLiveQuery(() => 
    db.members.where('status').equals('overdue').toArray()
  );

  return {
    members: members || [],
    memberCount: memberCount || 0,
    activeMembers: activeMembers || [],
    dueMembers: dueMembers || [],
    overdueMembers: overdueMembers || [],
    addMember,
    updateMember,
    deleteMember,
    updateAllMemberStatuses
  };
};

export const useMemberById = (id: number) => {
  return useLiveQuery(() => db.members.get(id), [id]);
};

export const useSearchMembers = (searchTerm: string) => {
  return useLiveQuery(() => {
    if (!searchTerm) return db.members.orderBy('createdAt').reverse().toArray();
    
    return db.members
      .filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm)
      )
      .toArray();
  }, [searchTerm]);
};