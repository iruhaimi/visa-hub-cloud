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
import { Loader2, Upload, FileCheck, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface WorkSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  onSuccess?: () => void;
}

interface SelectedFile {
  file: File;
  id: string;
}

export function WorkSubmissionDialog({
  open,
  onOpenChange,
  applicationId,
  onSuccess,
}: WorkSubmissionDialogProps) {
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      // Validate file size (max 10MB per file)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`حجم الملف ${file.name} يجب أن يكون أقل من 10 ميجابايت`);
        continue;
      }

      // Check if already added
      if (selectedFiles.some(sf => sf.file.name === file.name && sf.file.size === file.size)) {
        toast.error(`الملف ${file.name} مضاف مسبقاً`);
        continue;
      }

      setSelectedFiles(prev => [...prev, { file, id: crypto.randomUUID() }]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0 || !profile) return;

    setLoading(true);
    try {
      // Upload all files and create records
      for (const { file } of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const filePath = `work-submissions/${applicationId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create work submission record
        const { error: insertError } = await supabase
          .from('agent_work_submissions')
          .insert({
            application_id: applicationId,
            agent_id: profile.id,
            file_path: filePath,
            file_name: file.name,
            notes: notes.trim() || null,
          });

        if (insertError) throw insertError;
      }

      toast.success(`تم رفع ${selectedFiles.length} ملف بنجاح. سيتم مراجعتها من قبل المشرف`);
      onOpenChange(false);
      setSelectedFiles([]);
      setNotes('');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting work:', error);
      toast.error('حدث خطأ في رفع الملفات');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedFiles([]);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            تأكيد إتمام العمل
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            ارفق الملفات التي تثبت إتمام العمل على هذا الطلب ليتم مراجعتها من قبل المشرف.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">الملفات المرفقة ({selectedFiles.length})</label>
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
              className="hidden"
              multiple
            />
            
            {/* File List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {selectedFiles.map(({ file, id }) => (
                  <div 
                    key={id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCheck className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleRemoveFile(id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add More Button */}
            <Button
              type="button"
              variant="outline"
              className={selectedFiles.length === 0 ? "w-full h-24 border-dashed" : "w-full"}
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFiles.length === 0 ? (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    اضغط لاختيار الملفات (PDF, DOC, صور)
                  </span>
                </div>
              ) : (
                <>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة ملفات أخرى
                </>
              )}
            </Button>
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
          <Button variant="outline" onClick={handleClose}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedFiles.length === 0 || loading}
          >
            {loading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
            رفع {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''} وإرسال للمراجعة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
