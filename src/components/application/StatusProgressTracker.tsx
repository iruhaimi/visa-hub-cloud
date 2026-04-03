
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ApplicationStatus } from '@/types/database';

const STEPS = [
  { key: 'submitted', labelAr: 'تم الإرسال', labelEn: 'Submitted', statuses: ['submitted', 'whatsapp_pending'] },
  { key: 'under_review', labelAr: 'قيد المراجعة', labelEn: 'Under Review', statuses: ['under_review', 'documents_required'] },
  { key: 'processing', labelAr: 'قيد المعالجة', labelEn: 'Processing', statuses: ['processing'] },
  { key: 'result', labelAr: 'النتيجة', labelEn: 'Result', statuses: ['approved', 'rejected'] },
] as const;

function getStepState(stepIndex: number, status: ApplicationStatus) {
  if (status === 'draft' || status === 'pending_payment') return stepIndex === 0 ? 'current' : 'pending';
  if (status === 'cancelled') return 'pending';

  const currentStepIndex = STEPS.findIndex(s => (s.statuses as readonly string[]).includes(status));
  if (stepIndex < currentStepIndex) return 'completed';
  if (stepIndex === currentStepIndex) return status === 'approved' || status === 'rejected' ? 'completed' : 'current';
  return 'pending';
}

export function StatusProgressTracker({ status }: { status: ApplicationStatus }) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  if (status === 'draft' || status === 'pending_payment' || status === 'cancelled') return null;

  return (
    <div className="flex items-center justify-between w-full py-4">
      {STEPS.map((step, i) => {
        const state = getStepState(i, status);
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              {state === 'completed' ? (
                <CheckCircle2 className="h-7 w-7 text-primary" />
              ) : state === 'current' ? (
                <Clock className="h-7 w-7 text-primary animate-pulse" />
              ) : (
                <Circle className="h-7 w-7 text-muted-foreground/30" />
              )}
              <span className={`text-xs font-medium text-center max-w-[80px] ${
                state === 'pending' ? 'text-muted-foreground/40' : 'text-foreground'
              }`}>
                {isRTL ? step.labelAr : step.labelEn}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mt-[-18px] ${
                getStepState(i + 1, status) !== 'pending' ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
