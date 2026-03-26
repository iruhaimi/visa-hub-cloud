import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SiteContentRow {
  id: string;
  page: string;
  section: string;
  content: Record<string, any>;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useSiteContent(page: string) {
  return useQuery({
    queryKey: ['site-content', page],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('site_content')
        .select('*')
        .eq('page', page)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      const contentMap: Record<string, any> = {};
      ((data as SiteContentRow[]) || []).forEach((item) => {
        contentMap[item.section] = item.content;
      });
      return contentMap;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllSiteContent() {
  return useQuery({
    queryKey: ['site-content-all'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('site_content')
        .select('*')
        .order('page')
        .order('display_order');

      if (error) throw error;
      return (data as SiteContentRow[]) || [];
    },
  });
}

export function useSiteSection(page: string, section: string) {
  const { data, ...rest } = useSiteContent(page);
  return {
    ...rest,
    data: data?.[section] || null,
  };
}
