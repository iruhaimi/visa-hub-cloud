import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquarePlus, 
  Loader2, 
  MessageCircle,
  Shield,
  User,
  Clock,
  Lock,
  Send,
  Reply
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

interface Note {
  id: string;
  author_id: string;
  author_name: string | null;
  note_type: 'agent' | 'admin' | 'system';
  content: string;
  created_at: string;
}

interface NotesHistoryProps {
  applicationId: string;
}

export function NotesHistory({ applicationId }: NotesHistoryProps) {
  const { isAdmin, profile } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [applicationId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('application_notes')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes((data as Note[]) || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !profile) return;

    setSubmitting(true);
    try {
      const noteType = isAdmin ? 'admin' : 'agent';
      
      const { error } = await supabase
        .from('application_notes')
        .insert({
          application_id: applicationId,
          author_id: profile.id,
          author_name: profile.full_name,
          note_type: noteType,
          content: newNote.trim(),
        });

      if (error) throw error;

      toast.success('تمت إضافة الملاحظة بنجاح');
      setNewNote('');
      fetchNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('حدث خطأ في إضافة الملاحظة');
    } finally {
      setSubmitting(false);
    }
  };

  const getNoteTypeConfig = (type: string) => {
    switch (type) {
      case 'admin':
        return {
          label: 'مشرف',
          icon: Shield,
          bgColor: 'bg-red-50 dark:bg-red-950/30',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-700 dark:text-red-300',
          badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-200',
          avatarBg: 'bg-red-100 dark:bg-red-900',
          avatarText: 'text-red-700 dark:text-red-300',
        };
      case 'agent':
        return {
          label: 'وكيل',
          icon: User,
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-700 dark:text-blue-300',
          badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200',
          avatarBg: 'bg-blue-100 dark:bg-blue-900',
          avatarText: 'text-blue-700 dark:text-blue-300',
        };
      case 'system':
        return {
          label: 'نظام',
          icon: MessageCircle,
          bgColor: 'bg-gray-50 dark:bg-gray-900/50',
          borderColor: 'border-gray-200 dark:border-gray-700',
          textColor: 'text-gray-600 dark:text-gray-400',
          badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200',
          avatarBg: 'bg-gray-100 dark:bg-gray-800',
          avatarText: 'text-gray-600 dark:text-gray-400',
        };
      default:
        return {
          label: type,
          icon: MessageCircle,
          bgColor: 'bg-gray-50 dark:bg-gray-900/50',
          borderColor: 'border-gray-200 dark:border-gray-700',
          textColor: 'text-gray-600 dark:text-gray-400',
          badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200',
          avatarBg: 'bg-gray-100 dark:bg-gray-800',
          avatarText: 'text-gray-600 dark:text-gray-400',
        };
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '؟';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.slice(0, 2);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5 text-primary" />
            سجل الملاحظات
          </CardTitle>
          <Badge variant="outline" className="gap-1 text-xs font-normal">
            <Lock className="h-3 w-3" />
            للموظفين فقط
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* Add new note */}
        <div className="space-y-3">
          <div className="relative">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="اكتب ملاحظتك هنا..."
              rows={3}
              className="resize-none pr-4 pb-12 text-sm"
            />
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'ستظهر كملاحظة مشرف' : 'ستظهر كملاحظة وكيل'}
              </p>
              <Button 
                onClick={handleAddNote} 
                disabled={!newNote.trim() || submitting}
                size="sm"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 ml-1" />
                    إرسال
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Notes header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            جميع الملاحظات
          </p>
          <Badge variant="secondary" className="text-xs">
            {notes.length} ملاحظة
          </Badge>
        </div>
        
        {/* Notes list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">لا توجد ملاحظات بعد</p>
            <p className="text-muted-foreground/60 text-xs mt-1">ابدأ بإضافة أول ملاحظة</p>
          </div>
        ) : (
          <ScrollArea className="h-[350px]">
            <div className="space-y-3 pl-2">
              {notes.map((note, index) => {
                const config = getNoteTypeConfig(note.note_type);
                const Icon = config.icon;
                
                return (
                  <div 
                    key={note.id}
                    className={`rounded-lg border-2 p-4 ${config.bgColor} ${config.borderColor} transition-all hover:shadow-sm`}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <Avatar className={`h-10 w-10 ${config.avatarBg} border-2 ${config.borderColor}`}>
                        <AvatarFallback className={`text-sm font-bold ${config.avatarText}`}>
                          {getInitials(note.author_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-semibold text-sm ${config.textColor}`}>
                            {note.author_name || 'مستخدم غير معروف'}
                          </span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${config.badgeClass}`}>
                            <Icon className="h-3 w-3 ml-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(note.created_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="mt-3 mr-13">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
                        {note.content}
                      </p>
                    </div>
                    
                    {/* Reply button for admins on agent notes */}
                    {isAdmin && note.note_type === 'agent' && (
                      <div className="mt-3 mr-13">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground hover:text-primary"
                          onClick={() => setNewNote(`رداً على ${note.author_name}: `)}
                        >
                          <Reply className="h-3 w-3 ml-1" />
                          رد على الملاحظة
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
