import { useState } from 'react';
import { Search, X, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNavigate } from 'react-router-dom';
import { useMemberStore } from '@/hooks/useMemberStore';
import { Member } from '@/types/member';

interface MemberSearchProps {
  onSearch: (query: string) => void;
  searchQuery: string;
}

export function MemberSearch({ onSearch, searchQuery }: MemberSearchProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [open, setOpen] = useState(false);
  const { members } = useMemberStore();
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    setLocalQuery(query);
    onSearch(query);
    // Show dropdown for queries longer than 1 character with results
    setOpen(query.trim().length > 1 && filteredMembers.length > 0);
  };

  const clearSearch = () => {
    setLocalQuery('');
    onSearch('');
    setOpen(false);
  };

  const handleMemberSelect = (member: Member) => {
    setLocalQuery(member.fullName);
    setOpen(false);
    // Navigate to memberships page with search params to show this specific member
    navigate(`/memberships?search=${encodeURIComponent(member.fullName)}`);
  };

  // Filter members based on search query with improved matching
  const filteredMembers = localQuery.length > 1 ? members.filter(member => {
    const query = localQuery.toLowerCase().trim();
    const name = member.fullName.toLowerCase();
    const phone = member.contactNumber;
    
    return name.includes(query) || 
           phone.includes(query) ||
           name.split(' ').some(word => word.startsWith(query));
  }).slice(0, 10) : []; // Limit to 10 suggestions

  return (
    <div className="relative w-full max-w-md">
      <Popover open={open && localQuery.trim().length > 1 && filteredMembers.length > 0} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search members by name or phone..."
              value={localQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10"
              maxLength={100}
            />
            {localQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-popover border shadow-lg z-50" align="start">
          <Command>
            <CommandList>
              <CommandEmpty>No members found.</CommandEmpty>
              <CommandGroup>
                {filteredMembers.map((member) => (
                  <CommandItem
                    key={member.id}
                    onSelect={() => handleMemberSelect(member)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-medium">{member.fullName}</span>
                      <span className="text-sm text-muted-foreground">{member.contactNumber}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}