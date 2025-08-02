import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  is_online: boolean;
  last_seen: string;
}

interface UserListSidebarProps {
  currentUserId: string;
  selectedUserId: string | null;
  onUserSelect: (userId: string | null) => void;
}

export function UserListSidebar({ currentUserId, selectedUserId, onUserSelect }: UserListSidebarProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();

    // Subscribe to profile changes
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchProfiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', currentUserId)
        .order('is_online', { ascending: false })
        .order('username');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-sidebar-accent rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-sidebar-accent rounded w-20"></div>
                <div className="h-3 bg-sidebar-accent rounded w-16 mt-1"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden">
      <div className="p-4 space-y-4">
        {/* Public Chat Button */}
        <Button
          variant={selectedUserId === null ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => onUserSelect(null)}
        >
          <Users className="mr-2 h-4 w-4" />
          Public Chat
        </Button>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-sidebar-foreground/70">
            Users ({profiles.length})
          </h3>
          
          <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
            {profiles.map((profile) => (
              <Button
                key={profile.id}
                variant={selectedUserId === profile.user_id ? "secondary" : "ghost"}
                className="w-full justify-start p-3 h-auto"
                onClick={() => onUserSelect(profile.user_id)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {getInitials(profile.username)}
                      </AvatarFallback>
                    </Avatar>
                    {profile.is_online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium truncate">
                        {profile.username}
                      </span>
                      {profile.is_online && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          Online
                        </Badge>
                      )}
                    </div>
                    {!profile.is_online && (
                      <p className="text-xs text-sidebar-foreground/50">
                        {formatLastSeen(profile.last_seen)}
                      </p>
                    )}
                  </div>
                  
                  <MessageSquare className="h-4 w-4 text-sidebar-foreground/50" />
                </div>
              </Button>
            ))}
          </div>
          
          {profiles.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-sidebar-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-sidebar-foreground/50">No other users yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}