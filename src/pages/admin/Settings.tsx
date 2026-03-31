import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, FileText, Settings2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CountriesManagement, type Country } from '@/components/admin/settings/CountriesManagement';
import { VisaTypesManagement } from '@/components/admin/settings/VisaTypesManagement';
import { PermissionsSettings } from '@/components/admin/settings/PermissionsSettings';
import { TooltipProvider } from '@/components/ui/tooltip';

interface VisaType {
  id: string;
  country_id: string;
  name: string;
  description: string | null;
  price: number;
  child_price: number | null;
  infant_price: number | null;
  government_fees: number | null;
  processing_days: number;
  validity_days: number | null;
  max_stay_days: number | null;
  entry_type: string | null;
  is_active: boolean;
  requirements: string[];
  price_notes: string | null;
  price_notes_en: string | null;
  fee_type: string | null;
  country?: Country;
}

export default function Settings() {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const { isSuperAdmin } = usePermissions();

  // Countries
  const { data: countries, isLoading: loadingCountries } = useQuery({
    queryKey: ['admin-countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Country[];
    },
  });

  // Visa Types
  // Get active country IDs
  const activeCountryIds = countries?.filter(c => c.is_active).map(c => c.id) || [];

  const { data: visaTypes, isLoading: loadingVisaTypes } = useQuery({
    queryKey: ['admin-visa-types', activeCountryIds],
    queryFn: async () => {
      if (activeCountryIds.length === 0) return [];
      const { data, error } = await supabase
        .from('visa_types')
        .select('*, country:countries(*)')
        .in('country_id', activeCountryIds)
        .order('name');
      if (error) throw error;
      return data as VisaType[];
    },
    enabled: !loadingCountries,
  });

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", isRTL && "text-right")}>
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
            <Settings2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-l from-primary to-primary/70 bg-clip-text text-transparent">
              الإعدادات
            </h1>
            <p className="text-muted-foreground">
              إدارة الدول وأنواع التأشيرات المتاحة في النظام
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Globe className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{countries?.length || 0}</p>
                <p className="text-xs text-muted-foreground">إجمالي الدول</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Globe className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {countries?.filter(c => c.is_active).length || 0}
                </p>
                <p className="text-xs text-muted-foreground">دول نشطة</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{visaTypes?.length || 0}</p>
                <p className="text-xs text-muted-foreground">إجمالي التأشيرات</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl border border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <FileText className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {visaTypes?.filter(v => v.is_active).length || 0}
                </p>
                <p className="text-xs text-muted-foreground">تأشيرات نشطة</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="countries" className="w-full">
          <TabsList className={cn("w-full max-w-xl p-1 bg-muted/50 grid", isSuperAdmin ? "grid-cols-3" : "grid-cols-2")}>
            <TabsTrigger 
              value="countries" 
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Globe className="h-4 w-4" />
              <span>الدول</span>
              <span className="hidden sm:inline-flex items-center justify-center w-5 h-5 text-xs bg-primary/10 text-primary rounded-full">
                {countries?.length || 0}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="visa-types" 
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <FileText className="h-4 w-4" />
              <span>التأشيرات</span>
              <span className="hidden sm:inline-flex items-center justify-center w-5 h-5 text-xs bg-primary/10 text-primary rounded-full">
                {visaTypes?.length || 0}
              </span>
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger 
                value="permissions" 
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Shield className="h-4 w-4" />
                <span>الصلاحيات</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="countries" className="mt-6">
            <CountriesManagement 
              countries={countries || []} 
              isLoading={loadingCountries}
              isRTL={isRTL}
            />
          </TabsContent>

          <TabsContent value="visa-types" className="mt-6">
            <VisaTypesManagement 
              visaTypes={visaTypes || []} 
              countries={countries || []}
              isLoading={loadingVisaTypes}
              isRTL={isRTL}
            />
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="permissions" className="mt-6">
              <PermissionsSettings />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
