import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageItem } from '@/components/MessageItem';
import { MessageInput } from '@/components/MessageInput';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender_id: string;
  receiver_id?: string;
  content?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  is_public: boolean;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url?: string;
  };
}

interface ChatRoomProps {
  currentUserId: string;
  selectedUserId: string | null;
  onBackToPublic: () => void;
}

export function ChatRoom({ currentUserId, selectedUserId, onBackToPublic }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchMessages();
    
    if (selectedUserId) {
      fetchSelectedUserProfile();
    }

    // Subscribe to new messages
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // Check if this message should be displayed in current view
          const shouldShow = selectedUserId 
            ? (!newMessage.is_public && 
               ((newMessage.sender_id === currentUserId && newMessage.receiver_id === selectedUserId) ||
                (newMessage.sender_id === selectedUserId && newMessage.receiver_id === currentUserId)))
            : newMessage.is_public;

          if (shouldShow) {
            fetchMessages(); // Refresh to get profile data
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, selectedUserId]);

  const fetchSelectedUserProfile = async () => {
    if (!selectedUserId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('user_id', selectedUserId)
        .single();

      if (error) throw error;
      setSelectedUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      // First get messages
      let messageQuery = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (selectedUserId) {
        // Private messages between current user and selected user
        messageQuery = messageQuery
          .eq('is_public', false)
          .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${currentUserId})`);
      } else {
        // Public messages
        messageQuery = messageQuery.eq('is_public', true);
      }

      const { data: messagesData, error: messagesError } = await messageQuery;
      if (messagesError) throw messagesError;

      // Then get profiles for the senders
      const senderIds = [...new Set(messagesData?.map(m => m.sender_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', senderIds);

      if (profilesError) throw profilesError;

      // Combine messages with profile data
      const messagesWithProfiles = messagesData?.map(message => ({
        ...message,
        profiles: profilesData?.find(profile => profile.user_id === message.sender_id)
      })) || [];

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content?: string, file?: File) => {
    try {
      let fileUrl = null;
      let fileName = null;
      let fileType = null;

      // Upload file if provided
      if (file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${currentUserId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chat-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('chat-files')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = file.name;
        fileType = file.type;
      }

      // Insert message
      const messageData = {
        sender_id: currentUserId,
        receiver_id: selectedUserId,
        content,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        is_public: !selectedUserId,
      };

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) throw error;

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const getChatTitle = () => {
    if (selectedUserId) {
      return selectedUserProfile?.username || 'Private Chat';
    }
    return 'Public Chat';
  };

  const getChatIcon = () => {
    return selectedUserId ? <User className="h-5 w-5" /> : <Users className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-3">
          {selectedUserId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBackToPublic}
              className="md:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {getChatIcon()}
          <div>
            <h2 className="text-lg font-semibold">{getChatTitle()}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedUserId ? 'Private conversation' : 'Everyone can see these messages'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">{selectedUserId ? '💬' : '👋'}</div>
            <h3 className="text-lg font-medium mb-2">
              {selectedUserId ? 'Start your conversation!' : 'Welcome to the public chat!'}
            </h3>
            <p className="text-muted-foreground">
              {selectedUserId 
                ? 'Send a message to start chatting privately.'
                : 'Be the first to say hello to everyone.'
              }
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={message.sender_id === currentUserId}
              showAvatar={
                index === 0 || 
                messages[index - 1].sender_id !== message.sender_id
              }
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-border p-4">
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}