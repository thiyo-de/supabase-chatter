import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Download, Image as ImageIcon, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  content?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url?: string;
  };
}

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

export function MessageItem({ message, isOwn, showAvatar }: MessageItemProps) {
  const getInitials = (username: string) => {
    return username?.substring(0, 2).toUpperCase() || '??';
  };

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const isImage = (fileType?: string) => {
    return fileType?.startsWith('image/');
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <div className={`flex items-start space-x-3 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 ${showAvatar ? '' : 'invisible'}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.profiles?.avatar_url} />
          <AvatarFallback className="text-xs">
            {getInitials(message.profiles?.username || '')}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-xs sm:max-w-md lg:max-w-lg ${isOwn ? 'text-right' : 'text-left'}`}>
        {/* Username and timestamp */}
        {showAvatar && (
          <div className={`flex items-center space-x-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs font-medium text-foreground">
              {message.profiles?.username || 'Unknown User'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTime(message.created_at)}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`rounded-lg px-3 py-2 ${
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {/* Text content */}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* File content */}
          {message.file_url && (
            <div className="mt-2">
              {isImage(message.file_type) ? (
                <div className="space-y-2">
                  <img
                    src={message.file_url}
                    alt={message.file_name}
                    className="max-w-full max-h-64 rounded cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(message.file_url, '_blank')}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate">{message.file_name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => handleDownload(message.file_url!, message.file_name!)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={`flex items-center space-x-2 p-2 rounded border ${
                  isOwn ? 'border-primary-foreground/20' : 'border-muted-foreground/20'
                }`}>
                  <FileText className="h-4 w-4" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{message.file_name}</p>
                    <p className="text-xs opacity-70">{message.file_type}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => handleDownload(message.file_url!, message.file_name!)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timestamp for non-avatar messages */}
        {!showAvatar && (
          <div className={`text-xs text-muted-foreground mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
            {formatTime(message.created_at)}
          </div>
        )}
      </div>
    </div>
  );
}