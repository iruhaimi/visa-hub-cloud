import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, FileCheck, X } from 'lucide-react';
import { toast } from 'sonner';

interface WorkSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  onSuccess?: () => void;
}

export function WorkSubmissionDialog({
  open,
  onOpenChange,
  applicationId,
  onSuccess,
}: WorkSubmissionDialogProps) {
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('حجم الملف يجب أن يكون أقل من 10 ميجابايت');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !profile) return;

    setLoading(true);
    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `work-submissions/${applicationId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Create work submission record
      const { error: insertError } = await supabase
        .from('agent_work_submissions')
        .insert({
          application_id: applicationId,
          agent_id: profile.id,
          file_path: filePath,
          file_name: selectedFile.name,
          notes: notes.trim() || null,
        });

      if (insertError) throw insertError;

      toast.success('تم رفع ملف إتمام العمل بنجاح. سيتم مراجعته من قبل المشرف');
      onOpenChange(false);
      setSelectedFile(null);
      setNotes('');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting work:', error);
      toast.error('حدث خطأ في رفع الملف');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            تأكيد إتمام العمل
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            ارفق ملف يثبت إتمام العمل على هذا الطلب ليتم مراجعته من قبل المشرف والتأكيد على اكتماله.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">الملف المرفق *</label>
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
              className="hidden"
            />
            
            {selectedFile ? (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCheck className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm truncate">{selectedFile.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-24 border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    اضغط لاختيار ملف (PDF, DOC, صور)
                  </span>
                </div>
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">ملاحظات (اختياري)</label>
            <Textarea
              placeholder="أضف أي ملاحظات توضيحية حول العمل المنجز..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || loading}
          >
            {loading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
            رفع وإرسال للمراجعة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
