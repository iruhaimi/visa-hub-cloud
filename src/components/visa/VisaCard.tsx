import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  Calendar, 
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Country, VisaType } from '@/types/database';

interface VisaCardProps {
  visa: VisaType;
  country: Country;
}

export function VisaCard({ visa, country }: VisaCardProps) {
  const { direction } = useLanguage();
  const [showAllRequirements, setShowAllRequirements] = useState(false);
  
  const requirements = Array.isArray(visa.requirements) ? visa.requirements as string[] : [];
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  
  const visibleRequirements = showAllRequirements 
    ? requirements 
    : requirements.slice(0, 3);
  
  const hasMoreRequirements = requirements.length > 3;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{visa.name}</CardTitle>
            <CardDescription className="mt-1">
              {visa.description || `تأشيرة ${visa.name} إلى ${country.name}`}
            </CardDescription>
          </div>
          <Badge variant="outline" className="capitalize">
            {visa.entry_type === 'single' ? 'دخول واحد' : 'دخول متعدد'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <Clock className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">المعالجة</p>
            <p className="font-semibold">{visa.processing_days} يوم</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <Calendar className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">الصلاحية</p>
            <p className="font-semibold">{visa.validity_days || '-'} يوم</p>
          </div>
        </div>

        {/* Requirements */}
        {requirements.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">المتطلبات الأساسية:</p>
            <ul className="space-y-1">
              {visibleRequirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
            {hasMoreRequirements && (
              <button
                onClick={() => setShowAllRequirements(!showAllRequirements)}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 mt-2 transition-colors cursor-pointer"
              >
                {showAllRequirements ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    إخفاء المتطلبات
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    +{requirements.length - 3} متطلبات أخرى
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Price */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">السعر يبدأ من</p>
              <p className="text-2xl font-bold text-primary">${visa.price}</p>
            </div>
            <Button asChild>
              <Link to={`/apply?country=${country.code}&visa=${visa.id}`}>
                قدّم الآن
                <ArrowIcon className="h-4 w-4 ms-1 rtl-flip" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
