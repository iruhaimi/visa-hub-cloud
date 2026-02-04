import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FooterSetting {
  id: string;
  category: string;
  key: string;
  label: string;
  value: string;
  value_en: string | null;
  icon: string | null;
  url: string | null;
  display_order: number;
  is_active: boolean;
}

export function useFooterSettings() {
  return useQuery({
    queryKey: ['footer-settings-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('footer_settings')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('display_order');
      
      if (error) throw error;
      return data as FooterSetting[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useFooterSettingsByCategory(category: string) {
  const { data: allSettings, ...rest } = useFooterSettings();
  
  return {
    ...rest,
    data: allSettings?.filter(s => s.category === category) || [],
  };
}

export function useFooterSetting(category: string, key: string) {
  const { data: allSettings, ...rest } = useFooterSettings();
  
  return {
    ...rest,
    data: allSettings?.find(s => s.category === category && s.key === key),
  };
}
