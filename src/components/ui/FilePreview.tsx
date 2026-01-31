import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Loader2, 
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FilePreviewProps {
  fileName: string;
  filePath: string;
  className?: string;
  showDownload?: boolean;
  variant?: 'card' | 'compact';
}

export function FilePreview({ 
  fileName, 
  filePath, 
  className,
  showDownload = true,
  variant = 'card'
}: FilePreviewProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const extension = fileName.toLowerCase().split('.').pop() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension);
  const isPDF = extension === 'pdf';
  const isPreviewable = isImage || isPDF;

  const getFileIcon = () => {
    if (isImage) return ImageIcon;
    if (isPDF) return FileText;
    return FileText;
  };

  const FileIcon = getFileIcon();

  const handlePreview = async () => {
    if (!isPreviewable) {
      toast.info('هذا النوع من الملفات لا يدعم المعاينة المباشرة');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      setPreviewUrl(url);
      setZoom(1);
      setRotation(0);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Error loading preview:', error);
      toast.error('حدث خطأ في تحميل المعاينة');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('تم تحميل الملف بنجاح');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('حدث خطأ في تحميل الملف');
    } finally {
      setDownloading(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <>
      <div
        className={cn(
          "rounded-xl border-2 border-dashed transition-all duration-200",
          variant === 'card' 
            ? "border-primary/30 bg-primary/5 p-4 hover:border-primary/50 hover:bg-primary/10" 
            : "border-muted-foreground/20 bg-muted/30 p-3",
          className
        )}
      >
        <div className="flex items-center gap-3">
          {/* File Icon */}
          <div className={cn(
            "p-3 rounded-lg shrink-0 transition-colors",
            isImage ? "bg-success/10" : isPDF ? "bg-destructive/10" : "bg-primary/10"
          )}>
            <FileIcon className={cn(
              "h-6 w-6",
              isImage ? "text-success" : isPDF ? "text-destructive" : "text-primary"
            )} />
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{fileName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isImage ? 'صورة' : isPDF ? 'مستند PDF' : 'ملف'}
              {isPreviewable && (
                <span className="text-primary mr-1">• يدعم المعاينة</span>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isPreviewable && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shadow-sm"
                onClick={handlePreview}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                معاينة
              </Button>
            )}
            {showDownload && (
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 shadow-sm"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                تحميل
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={(open) => !open && handleClosePreview()}>
        <DialogContent 
          dir="rtl" 
          className="max-w-4xl w-[95vw] h-[90vh] p-0 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 shrink-0">
            <DialogHeader className="flex-1">
              <DialogTitle className="flex items-center gap-2 text-base">
                <FileIcon className={cn(
                  "h-5 w-5",
                  isImage ? "text-success" : "text-destructive"
                )} />
                {fileName}
              </DialogTitle>
            </DialogHeader>

            {/* Toolbar */}
            <div className="flex items-center gap-1">
              {isImage && (
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground w-12 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRotate}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-6 bg-border mx-1" />
                </>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1.5"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                تحميل
              </Button>
              {isPDF && previewUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => window.open(previewUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  فتح في نافذة جديدة
                </Button>
              )}
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-auto bg-muted/20 flex items-center justify-center p-4">
            {previewUrl && (
              <>
                {isImage && (
                  <div 
                    className="relative transition-transform duration-200"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt={fileName}
                      className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
                    />
                  </div>
                )}
                {isPDF && (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full rounded-lg border shadow-lg bg-white"
                    title={fileName}
                  />
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
