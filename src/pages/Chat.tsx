import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { ChatRoom } from '@/components/ChatRoom';
import { UserListSidebar } from '@/components/UserListSidebar';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function Chat() {
  const { user, signOut, loading } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Update user online status
      const updateOnlineStatus = async () => {
        await supabase
          .from('profiles')
          .update({ is_online: true, last_seen: new Date().toISOString() })
          .eq('user_id', user.id);
      };

      updateOnlineStatus();

      // Set up periodic updates to maintain online status
      const interval = setInterval(updateOnlineStatus, 30000); // Every 30 seconds

      // Update offline status when user leaves
      const handleBeforeUnload = async () => {
        await supabase
          .from('profiles')
          .update({ is_online: false, last_seen: new Date().toISOString() })
          .eq('user_id', user.id);
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        clearInterval(interval);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        // Update offline status when component unmounts
        supabase
          .from('profiles')
          .update({ is_online: false, last_seen: new Date().toISOString() })
          .eq('user_id', user.id);
      };
    }
  }, [user]);

  const handleSignOut = async () => {
    if (user) {
      // Set offline status before signing out
      await supabase
        .from('profiles')
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq('user_id', user.id);
    }

    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-sidebar">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-sidebar-foreground">College Chat</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <UserListSidebar
          currentUserId={user.id}
          selectedUserId={selectedUserId}
          onUserSelect={setSelectedUserId}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatRoom
          currentUserId={user.id}
          selectedUserId={selectedUserId}
          onBackToPublic={() => setSelectedUserId(null)}
        />
      </div>
    </div>
  );
}