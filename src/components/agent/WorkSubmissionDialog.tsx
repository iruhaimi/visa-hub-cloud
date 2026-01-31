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
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = (files: File[]) => {
    for (const file of files) {
      // Validate file size (max 10MB per file)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`حجم الملف ${file.name} يجب أن يكون أقل من 10 ميجابايت`);
        continue;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/zip', 'application/x-rar-compressed'];
      if (!allowedTypes.some(type => file.type.startsWith(type.split('/')[0]) || file.type === type)) {
        toast.error(`نوع الملف ${file.name} غير مدعوم`);
        continue;
      }

      // Check if already added
      if (selectedFiles.some(sf => sf.file.name === file.name && sf.file.size === file.size)) {
        toast.error(`الملف ${file.name} مضاف مسبقاً`);
        continue;
      }

      setSelectedFiles(prev => [...prev, { file, id: crypto.randomUUID() }]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the drop zone entirely
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
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

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return 'pdf';
    if (['doc', 'docx'].includes(ext || '')) return 'doc';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
    if (['zip', 'rar'].includes(ext || '')) return 'zip';
    return 'file';
  };

  const getFileIconColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'text-red-500 bg-red-50';
      case 'doc': return 'text-blue-500 bg-blue-50';
      case 'image': return 'text-green-500 bg-green-50';
      case 'zip': return 'text-amber-500 bg-amber-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="text-right pb-2">
          <DialogTitle className="flex items-center justify-end gap-3 text-xl">
            تأكيد إتمام العمل
            <div className="p-2 rounded-full bg-primary/10">
              <FileCheck className="h-6 w-6 text-primary" />
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-2">
          <div className="bg-muted/30 rounded-lg p-4 border border-dashed">
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              ارفق الملفات التي تثبت إتمام العمل على هذا الطلب ليتم مراجعتها من قبل المشرف
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                PDF, DOC, صور (حد أقصى 10MB للملف)
              </span>
              <label className="text-sm font-semibold flex items-center gap-2">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-bold">
                  {selectedFiles.length}
                </span>
                الملفات المرفقة
              </label>
            </div>
            
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
              <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin">
                {selectedFiles.map(({ file, id }) => {
                  const fileType = getFileIcon(file.name);
                  const iconColor = getFileIconColor(fileType);
                  return (
                    <div 
                      key={id}
                      className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors group"
                    >
                      <div className={`p-2.5 rounded-lg ${iconColor}`}>
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleRemoveFile(id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
                isDragging 
                  ? 'border-primary bg-primary/10 scale-[1.02]' 
                  : selectedFiles.length === 0 
                    ? 'py-10 border-muted-foreground/30 hover:border-primary hover:bg-primary/5' 
                    : 'py-4 border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10'
              } ${selectedFiles.length === 0 ? 'py-10' : 'py-4'}`}
            >
              {selectedFiles.length === 0 ? (
                <div className="flex flex-col items-center gap-3 pointer-events-none">
                  <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-primary/20' : 'bg-primary/10'}`}>
                    <Upload className={`h-8 w-8 ${isDragging ? 'text-primary animate-bounce' : 'text-primary'}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {isDragging ? 'أفلت الملفات هنا' : 'اضغط لاختيار الملفات'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      أو اسحب الملفات وأفلتها هنا
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-primary font-medium pointer-events-none">
                  <Plus className="h-5 w-5" />
                  {isDragging ? 'أفلت لإضافة المزيد' : 'إضافة ملفات أخرى'}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold block text-right">
              ملاحظات <span className="text-muted-foreground font-normal">(اختياري)</span>
            </label>
            <Textarea
              placeholder="أضف أي ملاحظات توضيحية حول العمل المنجز..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none text-right"
              dir="rtl"
            />
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} className="flex-1 sm:flex-none">
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedFiles.length === 0 || loading}
            className="flex-1 sm:flex-none min-w-[180px]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 ml-2" />
            )}
            رفع {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''} وإرسال للمراجعة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
