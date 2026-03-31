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
import SARSymbol from '@/components/ui/SARSymbol';
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
              {visa.description || (direction === 'rtl' 
                ? `تأشيرة ${visa.name} إلى ${country.name}`
                : `${visa.name} to ${country.name}`
              )}
            </CardDescription>
          </div>
          <Badge variant="outline" className="capitalize">
            {visa.entry_type === 'single' 
              ? (direction === 'rtl' ? 'دخول واحد' : 'Single Entry')
              : (direction === 'rtl' ? 'دخول متعدد' : 'Multiple Entry')
            }
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <Clock className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">
              {direction === 'rtl' ? 'المعالجة' : 'Processing'}
            </p>
            <p className="font-semibold">
              {visa.processing_days} {direction === 'rtl' ? 'يوم' : 'days'}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <Calendar className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">
              {direction === 'rtl' ? 'الصلاحية' : 'Validity'}
            </p>
            <p className="font-semibold">
              {visa.validity_days || '-'} {direction === 'rtl' ? 'يوم' : 'days'}
            </p>
          </div>
        </div>

        {/* Requirements */}
        {requirements.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">
              {direction === 'rtl' ? 'المتطلبات الأساسية:' : 'Key Requirements:'}
            </p>
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
                    {direction === 'rtl' ? 'إخفاء المتطلبات' : 'Hide requirements'}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    {direction === 'rtl' 
                      ? `+${requirements.length - 3} متطلبات أخرى`
                      : `+${requirements.length - 3} more requirements`
                    }
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
              <p className="text-xs text-muted-foreground">
                {direction === 'rtl' ? 'السعر يبدأ من' : 'Starting from'}
              </p>
              <p className="text-2xl font-bold text-primary flex items-center gap-1">
                {visa.price}
                <SARSymbol size="md" className="text-primary" />
              </p>
              {/* Price Notes from Database */}
              <p className="text-xs text-muted-foreground mt-1">
                {direction === 'rtl' 
                  ? (visa.price_notes || (visa.fee_type === 'included' ? 'شامل رسوم التأشيرة' : `رسوم التأشيرة ${visa.government_fees || 0} ريال تُدفع للسفارة مباشرة`))
                  : (visa.price_notes_en || (visa.fee_type === 'included' ? 'Visa fees included' : `Visa fees ${visa.government_fees || 0} SAR paid directly to embassy`))
                }
              </p>
            </div>
            <Button asChild>
              <Link to={`/apply?country=${country.code}&visa=${visa.id}`}>
                {direction === 'rtl' ? 'قدّم الآن' : 'Apply Now'}
                <ArrowIcon className="h-4 w-4 ms-1 rtl-flip" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
