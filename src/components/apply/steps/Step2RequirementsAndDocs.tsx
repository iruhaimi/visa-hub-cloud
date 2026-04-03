import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ArrowLeft, ArrowRight, FileText, Image, CreditCard, Building,
  Plane, Shield, CheckCircle2, Upload, XCircle, Loader2, Trash2,
  ChevronDown, User, Baby, Users, Info, Paperclip,
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

const documentTypeLabels: Record<string, { ar: string; en: string }> = {
  passport: { ar: 'جواز السفر', en: 'Passport' },
  photo: { ar: 'الصورة الشخصية', en: 'Personal Photo' },
  bank_statement: { ar: 'كشف الحساب البنكي', en: 'Bank Statement' },
  hotel_booking: { ar: 'حجز الفندق', en: 'Hotel Booking' },
  flight_booking: { ar: 'حجز الطيران', en: 'Flight Booking' },
  travel_insurance: { ar: 'تأمين السفر', en: 'Travel Insurance' },
};

interface FileUploadState {
  file: File | null;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

type TravelerCategory = 'adult' | 'child' | 'infant';

interface GroupedRequirement {
  category: TravelerCategory;
  index: number;
  label: string;
  icon: any;
  requirements: { id: string; label: string; iconKey: string }[];
}

export default function Step2RequirementsAndDocs() {
  const { t, direction, language } = useLanguage();
  const { applicationData, updateApplicationData, goToNextStep, goToPreviousStep, draftId, setDraftId } = useApplication();
  const { session } = useAuth();
  // uploads keyed by full requirement id (e.g. passport_adult_1)
  const [uploads, setUploads] = useState<Record<string, FileUploadState>>({});
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const isRTL = direction === 'rtl';
  // Track document IDs from DB for deletion
  const docIdsRef = useRef<Record<string, string>>({});

  const ArrowNextIcon = isRTL ? ArrowLeft : ArrowRight;
  const ArrowPrevIcon = isRTL ? ArrowRight : ArrowLeft;

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

  const { requirements, groupedByTraveler } = useMemo(() => {
    const { travelers } = applicationData;
    const reqs: { id: string; label: string; forCategory?: string }[] = [];
    const baseReqs = visaType?.requirements as string[] || defaultRequirements.map(r => r.id);
    const groups: GroupedRequirement[] = [];

    const buildGroup = (category: TravelerCategory, index: number) => {
      const catLabel = category === 'adult'
        ? (isRTL ? `بالغ ${index}` : `Adult ${index}`)
        : category === 'child'
          ? (isRTL ? `طفل ${index}` : `Child ${index}`)
          : (isRTL ? `رضيع ${index}` : `Infant ${index}`);

      const catIcon = category === 'adult' ? User : category === 'child' ? Users : Baby;
      const groupReqs: { id: string; label: string; iconKey: string }[] = [];

      defaultRequirements.forEach(req => {
        if (!baseReqs.includes(req.id) && !req.forAll) return;

        const isApplicable =
          (category === 'adult' && (req.forAll || req.forAdult)) ||
          (category === 'child' && req.forAll) ||
          (category === 'infant' && (req.id === 'passport' || req.id === 'photo'));

        if (isApplicable) {
          const reqId = `${req.id}_${category}_${index}`;
          reqs.push({ id: reqId, label: `${t(req.key)} - ${catLabel}`, forCategory: category });
          groupReqs.push({ id: reqId, label: t(req.key), iconKey: req.id });
        }
      });

      if (groupReqs.length > 0) {
        groups.push({ category, index, label: catLabel, icon: catIcon, requirements: groupReqs });
      }
    };

    for (let i = 1; i <= travelers.adults; i++) buildGroup('adult', i);
    for (let i = 1; i <= travelers.children; i++) buildGroup('child', i);
    for (let i = 1; i <= travelers.infants; i++) buildGroup('infant', i);

    return { requirements: reqs, groupedByTraveler: groups };
  }, [applicationData.travelers, applicationData.visaTypeId, visaType, isRTL, t]);

  useEffect(() => {
    if (groupedByTraveler.length > 0 && activeGroup === null) {
      setActiveGroup(`${groupedByTraveler[0].category}_${groupedByTraveler[0].index}`);
    }
  }, [groupedByTraveler]);

  const checkedCount = applicationData.checkedRequirements.length;
  const totalCount = requirements.length;
  const allChecked = checkedCount === totalCount && totalCount > 0;

  const toggleRequirement = (reqId: string) => {
    const current = applicationData.checkedRequirements;
    const newChecked = current.includes(reqId) ? current.filter(id => id !== reqId) : [...current, reqId];
    updateApplicationData({ checkedRequirements: newChecked });
    // If unchecking, also remove uploaded doc for this requirement
    if (current.includes(reqId)) {
      handleRemove(reqId);
    }
  };

  const toggleAll = () => {
    if (allChecked) {
      updateApplicationData({ checkedRequirements: [], uploadedDocuments: [] });
      setUploads({});
    } else {
      updateApplicationData({ checkedRequirements: requirements.map(r => r.id) });
    }
  };

  const toggleGroupAll = (group: GroupedRequirement) => {
    const groupIds = group.requirements.map(r => r.id);
    const allGroupChecked = groupIds.every(id => applicationData.checkedRequirements.includes(id));
    if (allGroupChecked) {
      updateApplicationData({
        checkedRequirements: applicationData.checkedRequirements.filter(id => !groupIds.includes(id)),
        uploadedDocuments: applicationData.uploadedDocuments.filter(d => !groupIds.includes(d.type)),
      });
      setUploads(prev => {
        const u = { ...prev };
        groupIds.forEach(id => delete u[id]);
        return u;
      });
    } else {
      const newChecked = new Set([...applicationData.checkedRequirements, ...groupIds]);
      updateApplicationData({ checkedRequirements: Array.from(newChecked) });
    }
  };

  const getGroupCheckedCount = (group: GroupedRequirement) => {
    return group.requirements.filter(r => applicationData.checkedRequirements.includes(r.id)).length;
  };

  const getGroupUploadedCount = (group: GroupedRequirement) => {
    return group.requirements.filter(r => {
      const doc = applicationData.uploadedDocuments.find(d => d.type === r.id);
      return doc?.uploaded;
    }).length;
  };

  // ─── Upload Logic (per requirement) ──────────────────────
  const handleFileSelect = useCallback((reqId: string, file: File) => {
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

    if (!allowedTypes.includes(file.type)) {
      setUploads(prev => ({ ...prev, [reqId]: { file: null, progress: 0, status: 'error', error: isRTL ? 'نوع الملف غير مدعوم' : 'File type not supported' } }));
      return;
    }
    if (file.size > maxSize) {
      setUploads(prev => ({ ...prev, [reqId]: { file: null, progress: 0, status: 'error', error: isRTL ? 'حجم الملف كبير جداً' : 'File size too large' } }));
      return;
    }

    setUploads(prev => ({ ...prev, [reqId]: { file, progress: 0, status: 'uploading' } }));
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploads(prev => ({ ...prev, [reqId]: { file, progress: 100, status: 'success' } }));
        updateApplicationData({
          uploadedDocuments: [
            ...applicationData.uploadedDocuments.filter(d => d.type !== reqId),
            { type: reqId, fileName: file.name, fileSize: file.size, uploaded: true },
          ],
        });
      } else {
        setUploads(prev => ({ ...prev, [reqId]: { ...prev[reqId], progress } }));
      }
    }, 200);
  }, [applicationData.uploadedDocuments, isRTL, updateApplicationData]);

  const handleRemove = (reqId: string) => {
    setUploads(prev => { const u = { ...prev }; delete u[reqId]; return u; });
    updateApplicationData({ uploadedDocuments: applicationData.uploadedDocuments.filter(d => d.type !== reqId) });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalUploaded = applicationData.uploadedDocuments.filter(d => d.uploaded).length;
  const canProceed = checkedCount > 0 && totalUploaded >= 1;

  const getCategoryColor = (category: TravelerCategory) => {
    switch (category) {
      case 'adult': return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-600 dark:text-blue-400' };
      case 'child': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400' };
      case 'infant': return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600 dark:text-amber-400' };
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center mb-2">
        <h2 className="text-xl sm:text-2xl font-bold">{t('wizard.step2')}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isRTL ? 'حدد المتطلبات وارفع المستندات لكل مسافر' : 'Check requirements and upload documents for each traveler'}
        </p>
      </div>

      {/* ── Overall Progress ── */}
      <div className="p-3 rounded-xl bg-muted/40 border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            {isRTL ? 'تقدم المتطلبات والمستندات' : 'Requirements & Documents Progress'}
          </span>
          <span className="text-xs font-bold">{checkedCount}/{totalCount}</span>
        </div>
        <Progress value={totalCount > 0 ? (checkedCount / totalCount) * 100 : 0} className="h-2" />
        <div className="flex items-center justify-between mt-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={toggleAll}>
            {allChecked ? (isRTL ? 'إلغاء تحديد الكل' : 'Uncheck All') : (isRTL ? 'تحديد الكل ✓' : 'Check All ✓')}
          </Button>
          {allChecked && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 text-xs gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {isRTL ? 'مكتمل' : 'Complete'}
            </Badge>
          )}
        </div>
      </div>

      {/* ── Requirements Grouped by Traveler with Inline Upload ── */}
      <div className="space-y-3">
        {groupedByTraveler.map((group) => {
          const key = `${group.category}_${group.index}`;
          const isOpen = activeGroup === key;
          const colors = getCategoryColor(group.category);
          const groupChecked = getGroupCheckedCount(group);
          const groupUploaded = getGroupUploadedCount(group);
          const groupTotal = group.requirements.length;
          const allGroupDone = groupChecked === groupTotal;
          const IconComp = group.icon;

          return (
            <Collapsible key={key} open={isOpen} onOpenChange={(open) => setActiveGroup(open ? key : null)}>
              <CollapsibleTrigger asChild>
                <button className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                  colors.bg, colors.border,
                  'hover:shadow-sm'
                )}>
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', allGroupDone ? 'bg-green-100 dark:bg-green-900/50' : colors.bg)}>
                    {allGroupDone ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <IconComp className={cn('w-5 h-5', colors.text)} />}
                  </div>
                  <div className="flex-1 text-start">
                    <span className="font-semibold text-sm">{group.label}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">
                        {isRTL ? `${groupChecked}/${groupTotal} متطلب` : `${groupChecked}/${groupTotal} req`}
                      </span>
                      {groupUploaded > 0 && (
                        <span className="text-[11px] text-green-600 flex items-center gap-0.5">
                          <Paperclip className="w-3 h-3" />
                          {groupUploaded}
                        </span>
                      )}
                    </div>
                  </div>
                  {!allGroupDone && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2 z-10"
                      onClick={(e) => { e.stopPropagation(); toggleGroupAll(group); }}>
                      {isRTL ? 'تحديد الكل' : 'Check All'}
                    </Button>
                  )}
                  <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform shrink-0', isOpen && 'rotate-180')} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pt-2 ps-2 sm:ps-4 space-y-2">
                  {group.requirements.map(req => {
                    const isChecked = applicationData.checkedRequirements.includes(req.id);
                    const IconComponent = requirementIcons[req.iconKey] || requirementIcons.default;
                    const upload = uploads[req.id];
                    const existingDoc = applicationData.uploadedDocuments.find(d => d.type === req.id);
                    const isUploaded = upload?.status === 'success' || existingDoc?.uploaded;

                    return (
                      <div key={req.id} className="space-y-0">
                        {/* Requirement row */}
                        <div
                          className={cn(
                            'flex items-center gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer text-sm',
                            isChecked
                              ? (isUploaded ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-primary/5 border-primary/20')
                              : 'bg-card hover:bg-muted/50 border-transparent'
                          )}
                          onClick={() => toggleRequirement(req.id)}
                        >
                          <Checkbox id={req.id} checked={isChecked} onCheckedChange={() => toggleRequirement(req.id)} className="shrink-0" />
                          <IconComponent className={cn('w-4 h-4 shrink-0', isChecked ? 'text-primary' : 'text-muted-foreground')} />
                          <Label htmlFor={req.id} className="flex-1 cursor-pointer text-sm leading-tight">{req.label}</Label>

                          {/* Upload status indicator */}
                          {isChecked && isUploaded && (
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          )}
                          {isChecked && !isUploaded && upload?.status !== 'uploading' && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 shrink-0">
                              {isRTL ? 'بحاجة لرفع' : 'Need upload'}
                            </span>
                          )}
                        </div>

                        {/* Inline upload area - only visible when checked */}
                        {isChecked && (
                          <div className="ms-6 sm:ms-10 mt-1 mb-1">
                            {upload?.status === 'uploading' ? (
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                                <div className="flex-1">
                                  <Progress value={upload.progress} className="h-1" />
                                </div>
                                <span className="text-[10px] text-muted-foreground">{Math.round(upload.progress)}%</span>
                              </div>
                            ) : isUploaded ? (
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50/80 dark:bg-green-950/30 border border-green-200/50 dark:border-green-800/50">
                                <Paperclip className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                <span className="text-xs text-green-700 dark:text-green-300 truncate flex-1">
                                  {upload?.file?.name || existingDoc?.fileName}
                                </span>
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  {formatFileSize(upload?.file?.size || existingDoc?.fileSize || 0)}
                                </span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0"
                                  onClick={(e) => { e.stopPropagation(); handleRemove(req.id); }}>
                                  <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </div>
                            ) : (
                              <label className={cn(
                                'flex items-center gap-2 p-2 rounded-lg border border-dashed cursor-pointer transition-colors',
                                'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5',
                                upload?.status === 'error' && 'border-destructive bg-destructive/5'
                              )}>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(req.id, f); }}
                                />
                                <Upload className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className="text-xs text-muted-foreground">
                                  {isRTL ? 'اضغط لرفع الملف' : 'Click to upload'}
                                </span>
                                <span className="text-[10px] text-muted-foreground/70">
                                  PDF, JPG, PNG • 10MB
                                </span>
                                {upload?.status === 'error' && (
                                  <span className="text-[10px] text-destructive ms-auto flex items-center gap-1">
                                    <XCircle className="w-3 h-3" /> {upload.error}
                                  </span>
                                )}
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Tips */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 text-xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-blue-800 dark:text-blue-200">
          <p>{isRTL ? 'تأكد من صلاحية جواز السفر لمدة 6 أشهر على الأقل' : 'Passport must be valid for at least 6 months'}</p>
          <p>{isRTL ? 'الصور يجب أن تكون بخلفية بيضاء وحديثة' : 'Photos must have a white background and be recent'}</p>
        </div>
      </div>

      {/* ── Uploaded Documents Summary ── */}
      {totalUploaded > 0 && (
        <div className="p-3 rounded-xl bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/50">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="font-semibold text-sm text-green-700 dark:text-green-300">
              {isRTL ? `المستندات المرفوعة (${totalUploaded})` : `Uploaded Documents (${totalUploaded})`}
            </span>
          </div>
          <div className="space-y-1">
            {applicationData.uploadedDocuments.filter(d => d.uploaded).map(doc => {
              // Parse the requirement id to get a friendly label
              const match = doc.type.match(/^(.+?)_(adult|child|infant)_(\d+)$/);
              const baseType = match ? match[1] : doc.type;
              const category = match ? match[2] : '';
              const idx = match ? match[3] : '';
              const typeLabel = documentTypeLabels[baseType]?.[language] || baseType;
              const catLabel = category === 'adult'
                ? (isRTL ? `بالغ ${idx}` : `Adult ${idx}`)
                : category === 'child'
                  ? (isRTL ? `طفل ${idx}` : `Child ${idx}`)
                  : category === 'infant'
                    ? (isRTL ? `رضيع ${idx}` : `Infant ${idx}`)
                    : '';

              return (
                <div key={doc.type} className="flex items-center gap-2 text-xs">
                  <Paperclip className="w-3 h-3 text-green-600 shrink-0" />
                  <span className="text-foreground truncate">{typeLabel}</span>
                  {catLabel && <span className="text-muted-foreground">— {catLabel}</span>}
                  <span className="text-muted-foreground ms-auto shrink-0">{doc.fileName}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-3 sticky bottom-0 bg-background/95 backdrop-blur-sm pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent sm:backdrop-blur-none border-t sm:border-0">
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
