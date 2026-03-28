import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribes to Supabase Realtime changes on key public-facing tables
 * and automatically invalidates the corresponding React Query caches.
 * Mount once at the app level (e.g. inside App or MainLayout).
 */

const TABLE_QUERY_MAP: Record<string, string[]> = {
  countries: ['countries-apply', 'countries', 'countries-destinations'],
  visa_types: ['visa-types-apply', 'visa-types', 'visa-types-country'],
  site_content: ['site-content', 'site-content-all'],
  hero_settings: ['hero-settings'],
  hero_destinations: ['hero-destinations'],
  footer_settings: ['footer-settings-public', 'footer-settings'],
  special_offers: ['special-offers', 'special-offers-all'],
};

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('public-content-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'countries' },
        () => invalidateTable('countries')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visa_types' },
        () => invalidateTable('visa_types')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_content' },
        () => invalidateTable('site_content')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hero_settings' },
        () => invalidateTable('hero_settings')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hero_destinations' },
        () => invalidateTable('hero_destinations')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'footer_settings' },
        () => invalidateTable('footer_settings')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'special_offers' },
        () => invalidateTable('special_offers')
      )
      .subscribe();

    function invalidateTable(table: string) {
      const queryKeys = TABLE_QUERY_MAP[table] || [];
      queryKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
