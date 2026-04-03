
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  verification_notes: string | null;
}

const STATUS_MAP = {
  pending: { labelAr: 'قيد المراجعة', labelEn: 'Pending', icon: Clock, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  verified: { labelAr: 'مقبول', labelEn: 'Verified', icon: CheckCircle2, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { labelAr: 'مرفوض', labelEn: 'Rejected', icon: XCircle, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export function DocumentsSection({ applicationId }: { applicationId: string }) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      const { data } = await supabase
        .from('application_documents_safe')
        .select('id, document_type, file_name, status, created_at, verification_notes')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });
      setDocs((data || []) as Document[]);
      setLoading(false);
    };
    fetchDocs();
  }, [applicationId]);

  if (loading || docs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          {isRTL ? 'المستندات المرفوعة' : 'Uploaded Documents'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {docs.map(doc => {
            const st = STATUS_MAP[doc.status];
            const Icon = st.icon;
            return (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.document_type}</p>
                    <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                    {doc.status === 'rejected' && doc.verification_notes && (
                      <p className="text-xs text-destructive mt-1">{doc.verification_notes}</p>
                    )}
                  </div>
                </div>
                <Badge className={`${st.className} gap-1 shrink-0`}>
                  <Icon className="h-3 w-3" />
                  {isRTL ? st.labelAr : st.labelEn}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
