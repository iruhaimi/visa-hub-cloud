import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquarePlus, 
  Loader2, 
  MessageCircle,
  Shield,
  User,
  Clock,
  Lock
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
          className: 'bg-destructive/10 text-destructive border-destructive/20',
        };
      case 'agent':
        return {
          label: 'وكيل',
          icon: User,
          className: 'bg-primary/10 text-primary border-primary/20',
        };
      case 'system':
        return {
          label: 'نظام',
          icon: MessageCircle,
          className: 'bg-muted text-muted-foreground',
        };
      default:
        return {
          label: type,
          icon: MessageCircle,
          className: 'bg-muted text-muted-foreground',
        };
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          سجل الملاحظات
          <Badge variant="secondary" className="mr-auto">
            <Lock className="h-3 w-3 ml-1" />
            لا يمكن تعديلها
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new note */}
        <div className="space-y-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="أضف ملاحظة جديدة..."
            rows={3}
            className="resize-none"
          />
          <Button 
            onClick={handleAddNote} 
            disabled={!newNote.trim() || submitting}
            className="w-full"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <MessageSquarePlus className="h-4 w-4 ml-2" />
            )}
            إضافة ملاحظة
          </Button>
        </div>

        {/* Notes list */}
        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
            <Clock className="h-4 w-4" />
            جميع الملاحظات ({notes.length})
          </p>
          
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              لا توجد ملاحظات بعد
            </p>
          ) : (
            <ScrollArea className="h-[300px] pr-3">
              <div className="space-y-3">
                {notes.map((note) => {
                  const config = getNoteTypeConfig(note.note_type);
                  const Icon = config.icon;
                  
                  return (
                    <div 
                      key={note.id}
                      className={`rounded-lg border p-3 ${config.className}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium text-sm">
                            {note.author_name || 'غير معروف'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(note.created_at), 'dd/MM/yyyy - HH:mm', { locale: ar })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
