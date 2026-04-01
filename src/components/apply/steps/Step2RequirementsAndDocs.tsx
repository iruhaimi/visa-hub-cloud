import { useEffect, useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, ArrowRight, FileText, Image, CreditCard, Building,
  Plane, Shield, CheckCircle2, AlertCircle, Upload, XCircle, Loader2, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Requirements Icons ────────────────────────────────────
const requirementIcons: Record<string, any> = {
  passport: FileText, photo: Image, bank_statement: CreditCard,
  hotel_booking: Building, flight_booking: Plane, travel_insurance: Shield, default: FileText,
};

const defaultRequirements = [
  { id: 'passport', key: 'requirements.passport', icon: 'passport', forAll: true },
  { id: 'photo', key: 'requirements.photo', icon: 'photo', forAll: true },
  { id: 'bank_statement', key: 'requirements.bankStatement', icon: 'bank_statement', forAdult: true },
  { id: 'hotel_booking', key: 'requirements.hotelBooking', icon: 'hotel_booking', forAll: true },
  { id: 'flight_booking', key: 'requirements.flightBooking', icon: 'flight_booking', forAll: true },
  { id: 'travel_insurance', key: 'requirements.travelInsurance', icon: 'travel_insurance', forAll: true },
];

// ─── Document Types ────────────────────────────────────────
const documentTypes: Record<string, { label: { ar: string; en: string } }> = {
  passport: { label: { ar: 'جواز السفر', en: 'Passport' } },
  photo: { label: { ar: 'الصورة الشخصية', en: 'Personal Photo' } },
  bank_statement: { label: { ar: 'كشف الحساب البنكي', en: 'Bank Statement' } },
  hotel_booking: { label: { ar: 'حجز الفندق', en: 'Hotel Booking' } },
  flight_booking: { label: { ar: 'حجز الطيران', en: 'Flight Booking' } },
  travel_insurance: { label: { ar: 'تأمين السفر', en: 'Travel Insurance' } },
};

interface FileUploadState {
  file: File | null;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function Step2RequirementsAndDocs() {
  const { t, direction, language } = useLanguage();
  const { applicationData, updateApplicationData, goToNextStep, goToPreviousStep } = useApplication();
  const [uploads, setUploads] = useState<Record<string, FileUploadState>>({});

  const ArrowNextIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const ArrowPrevIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  // ─── Requirements Logic ──────────────────────────────────
  const { data: visaType } = useQuery({
    queryKey: ['visa-type-requirements', applicationData.visaTypeId],
    queryFn: async () => {
      if (!applicationData.visaTypeId) return null;
      const { data, error } = await supabase.from('visa_types').select('requirements').eq('id', applicationData.visaTypeId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!applicationData.visaTypeId,
  });

  const getRequirements = () => {
    const { travelers } = applicationData;
    const reqs: { id: string; label: string; forCategory?: string }[] = [];
    const baseReqs = visaType?.requirements as string[] || defaultRequirements.map(r => r.id);

    defaultRequirements.forEach(req => {
      if (baseReqs.includes(req.id) || req.forAll) {
        if (travelers.adults > 0 && (req.forAll || req.forAdult)) {
          for (let i = 1; i <= travelers.adults; i++) {
            reqs.push({ id: `${req.id}_adult_${i}`, label: `${t(req.key)} - ${direction === 'rtl' ? `بالغ ${i}` : `Adult ${i}`}`, forCategory: 'adult' });
          }
        }
        if (travelers.children > 0 && req.forAll) {
          for (let i = 1; i <= travelers.children; i++) {
            reqs.push({ id: `${req.id}_child_${i}`, label: `${t(req.key)} - ${direction === 'rtl' ? `طفل ${i}` : `Child ${i}`}`, forCategory: 'child' });
          }
        }
        if (travelers.infants > 0 && (req.id === 'passport' || req.id === 'photo')) {
          for (let i = 1; i <= travelers.infants; i++) {
            reqs.push({ id: `${req.id}_infant_${i}`, label: `${t(req.key)} - ${direction === 'rtl' ? `رضيع ${i}` : `Infant ${i}`}`, forCategory: 'infant' });
          }
        }
      }
    });
    return reqs;
  };

  const requirements = getRequirements();
  const checkedCount = applicationData.checkedRequirements.length;
  const totalCount = requirements.length;
  const allChecked = checkedCount === totalCount;

  const toggleRequirement = (reqId: string) => {
    const current = applicationData.checkedRequirements;
    updateApplicationData({ checkedRequirements: current.includes(reqId) ? current.filter(id => id !== reqId) : [...current, reqId] });
  };

  const toggleAll = () => {
    updateApplicationData({ checkedRequirements: allChecked ? [] : requirements.map(r => r.id) });
  };

  // ─── Document Upload Logic ──────────────────────────────
  const requiredDocTypes = useMemo(() => {
    const checkedReqs = applicationData.checkedRequirements;
    if (!checkedReqs || checkedReqs.length === 0) return Object.keys(documentTypes);
    const baseTypes = new Set<string>();
    checkedReqs.forEach(reqId => {
      const match = reqId.match(/^(.+?)_(adult|child|infant)_\d+$/);
      if (match) baseTypes.add(match[1]);
      else baseTypes.add(reqId);
    });
    return Array.from(baseTypes).filter(type => type in documentTypes);
  }, [applicationData.checkedRequirements]);

  const handleFileSelect = useCallback((docType: string, file: File) => {
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

    if (!allowedTypes.includes(file.type)) {
      setUploads(prev => ({ ...prev, [docType]: { file: null, progress: 0, status: 'error', error: direction === 'rtl' ? 'نوع الملف غير مدعوم' : 'File type not supported' } }));
      return;
    }
    if (file.size > maxSize) {
      setUploads(prev => ({ ...prev, [docType]: { file: null, progress: 0, status: 'error', error: direction === 'rtl' ? 'حجم الملف كبير جداً' : 'File size too large' } }));
      return;
    }

    setUploads(prev => ({ ...prev, [docType]: { file, progress: 0, status: 'uploading' } }));
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploads(prev => ({ ...prev, [docType]: { file, progress: 100, status: 'success' } }));
        updateApplicationData({
          uploadedDocuments: [...applicationData.uploadedDocuments.filter(d => d.type !== docType), { type: docType, fileName: file.name, fileSize: file.size, uploaded: true }],
        });
      } else {
        setUploads(prev => ({ ...prev, [docType]: { ...prev[docType], progress } }));
      }
    }, 200);
  }, [applicationData.uploadedDocuments, direction, updateApplicationData]);

  const handleRemove = (docType: string) => {
    setUploads(prev => { const u = { ...prev }; delete u[docType]; return u; });
    updateApplicationData({ uploadedDocuments: applicationData.uploadedDocuments.filter(d => d.type !== docType) });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uploadedCount = applicationData.uploadedDocuments.filter(d => d.uploaded && requiredDocTypes.includes(d.type)).length;
  const totalRequired = requiredDocTypes.length;
  const canProceed = checkedCount > 0 && uploadedCount >= 1;

  return (
    <div className="space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">{t('wizard.step2')}</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          {direction === 'rtl' ? 'تحقق من المتطلبات وارفع المستندات اللازمة' : 'Check requirements and upload necessary documents'}
        </p>
      </div>

      {/* ── Requirements Section ── */}
      <div className="space-y-4">
        <h3 className="font-bold text-base sm:text-lg">{direction === 'rtl' ? 'المتطلبات' : 'Requirements'}</h3>

        <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            {allChecked ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
            <span className="font-medium text-sm">{direction === 'rtl' ? `${checkedCount} من ${totalCount} متطلب` : `${checkedCount} of ${totalCount} requirements`}</span>
          </div>
          <Button variant="outline" size="sm" onClick={toggleAll}>
            {allChecked ? (direction === 'rtl' ? 'إلغاء تحديد الكل' : 'Uncheck All') : (direction === 'rtl' ? 'تحديد الكل' : 'Check All')}
          </Button>
        </div>

        <div className="space-y-2">
          {requirements.map(req => {
            const isChecked = applicationData.checkedRequirements.includes(req.id);
            const iconKey = req.id.split('_')[0];
            const IconComponent = requirementIcons[iconKey] || requirementIcons.default;
            return (
              <div key={req.id} className={cn('flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer', isChecked ? 'bg-primary/5 border-primary/30' : 'bg-card hover:bg-muted/50')} onClick={() => toggleRequirement(req.id)}>
                <Checkbox id={req.id} checked={isChecked} onCheckedChange={() => toggleRequirement(req.id)} />
                <IconComponent className={cn('w-4 h-4', isChecked ? 'text-primary' : 'text-muted-foreground')} />
                <Label htmlFor={req.id} className="flex-1 cursor-pointer text-sm">{req.label}</Label>
                {req.forCategory && (
                  <Badge variant="secondary" className="text-xs">
                    {req.forCategory === 'adult' && (direction === 'rtl' ? 'بالغ' : 'Adult')}
                    {req.forCategory === 'child' && (direction === 'rtl' ? 'طفل' : 'Child')}
                    {req.forCategory === 'infant' && (direction === 'rtl' ? 'رضيع' : 'Infant')}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800" dir={direction === 'rtl' ? 'rtl' : 'ltr'}>
          <h4 className={`font-semibold text-blue-900 dark:text-blue-100 mb-1 text-sm ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
            {direction === 'rtl' ? 'نصائح مهمة' : 'Important Tips'}
          </h4>
          <ul className={`text-xs text-blue-800 dark:text-blue-200 space-y-1 ${direction === 'rtl' ? 'list-disc list-inside text-right' : 'list-disc list-inside text-left'}`}>
            <li>{direction === 'rtl' ? 'تأكد من صلاحية جواز السفر لمدة 6 أشهر على الأقل' : 'Make sure your passport is valid for at least 6 months'}</li>
            <li>{direction === 'rtl' ? 'الصور يجب أن تكون بخلفية بيضاء وحديثة' : 'Photos must have a white background and be recent'}</li>
          </ul>
        </div>
      </div>

      <Separator className="my-4" />

      {/* ── Document Upload Section ── */}
      <div className="space-y-4">
        <h3 className="font-bold text-base sm:text-lg">{direction === 'rtl' ? 'رفع المستندات' : 'Upload Documents'}</h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/30 rounded-xl">
          <span className="font-medium text-sm">{direction === 'rtl' ? `${uploadedCount} من ${totalRequired} مستند تم رفعه` : `${uploadedCount} of ${totalRequired} document${totalRequired !== 1 ? 's' : ''} uploaded`}</span>
          <Badge variant={uploadedCount >= totalRequired ? 'default' : 'secondary'} className="w-fit text-xs">
            {uploadedCount >= totalRequired ? (direction === 'rtl' ? 'جميع المستندات مرفوعة ✓' : 'All documents uploaded ✓') : (direction === 'rtl' ? `${totalRequired - uploadedCount} مستند متبقي` : `${totalRequired - uploadedCount} remaining`)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {requiredDocTypes.map(docTypeId => {
            const docType = documentTypes[docTypeId];
            if (!docType) return null;
            const upload = uploads[docTypeId];
            const existingDoc = applicationData.uploadedDocuments.find(d => d.type === docTypeId);
            const isUploaded = upload?.status === 'success' || existingDoc?.uploaded;

            return (
              <div key={docTypeId} className={cn('relative p-4 rounded-lg border-2 border-dashed transition-colors', isUploaded && 'border-green-500 bg-green-50 dark:bg-green-950/20', upload?.status === 'error' && 'border-destructive bg-destructive/5', !isUploaded && !upload?.status && 'border-muted-foreground/30 hover:border-primary/50')}>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(docTypeId, f); }} disabled={upload?.status === 'uploading'} />
                <div className="flex items-start gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', isUploaded ? 'bg-green-100 text-green-600' : 'bg-muted')}>
                    {upload?.status === 'uploading' ? <Loader2 className="w-5 h-5 animate-spin" /> : isUploaded ? <CheckCircle2 className="w-5 h-5" /> : upload?.status === 'error' ? <XCircle className="w-5 h-5 text-destructive" /> : <Upload className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{docType.label[language]}</div>
                    {upload?.status === 'uploading' && <div className="mt-2"><Progress value={upload.progress} className="h-1" /><span className="text-xs text-muted-foreground">{Math.round(upload.progress)}%</span></div>}
                    {isUploaded && (upload?.file || existingDoc) && (
                      <div className="flex items-center gap-2 mt-1"><FileText className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground truncate">{upload?.file?.name || existingDoc?.fileName}</span><span className="text-xs text-muted-foreground">({formatFileSize(upload?.file?.size || existingDoc?.fileSize || 0)})</span></div>
                    )}
                    {upload?.status === 'error' && <div className="text-xs text-destructive mt-1">{upload.error}</div>}
                    {!isUploaded && !upload?.status && <div className="text-xs text-muted-foreground mt-1">{t('documents.formats')} • {t('documents.maxSize')}</div>}
                  </div>
                  {isUploaded && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 z-20 relative" onClick={e => { e.stopPropagation(); handleRemove(docTypeId); }}>
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4 sticky bottom-0 bg-background/95 backdrop-blur-sm pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent sm:backdrop-blur-none border-t sm:border-0">
        <Button type="button" variant="outline" size="lg" className="flex-1 h-12 gap-2 text-sm sm:text-base" onClick={goToPreviousStep}>
          <ArrowPrevIcon className="w-4 h-4" /><span>{t('wizard.previous')}</span>
        </Button>
        <Button type="button" size="lg" className="flex-1 h-12 gap-2 text-sm sm:text-base" onClick={goToNextStep} disabled={!canProceed}>
          <span>{t('wizard.next')}</span><ArrowNextIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
