import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SpecialOffer {
  id: string;
  title: string;
  description: string | null;
  discount_percentage: number;
  original_price: number;
  sale_price: number;
  country_name: string;
  flag_emoji: string | null;
  end_date: string;
  start_date: string;
  badge: string | null;
  is_hot: boolean | null;
  is_active: boolean | null;
  visa_type_id: string | null;
}

export function useSpecialOffers() {
  return useQuery({
    queryKey: ['special-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('special_offers')
        .select('*')
        .eq('is_active', true)
        .gt('end_date', new Date().toISOString())
        .order('is_hot', { ascending: false })
        .order('discount_percentage', { ascending: false });

      if (error) throw error;
      return data as SpecialOffer[];
    },
  });
}

export function useAllSpecialOffers() {
  return useQuery({
    queryKey: ['special-offers-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('special_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SpecialOffer[];
    },
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offer: Omit<SpecialOffer, 'id' | 'visa_type_id'>) => {
      const { data, error } = await supabase
        .from('special_offers')
        .insert({ ...offer, visa_type_id: null })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['special-offers'] });
      queryClient.invalidateQueries({ queryKey: ['special-offers-all'] });
      toast.success('تم إضافة العرض بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في إضافة العرض: ' + error.message);
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...offer }: Partial<SpecialOffer> & { id: string }) => {
      const { data, error } = await supabase
        .from('special_offers')
        .update(offer)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['special-offers'] });
      queryClient.invalidateQueries({ queryKey: ['special-offers-all'] });
      toast.success('تم تحديث العرض بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في تحديث العرض: ' + error.message);
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('special_offers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['special-offers'] });
      queryClient.invalidateQueries({ queryKey: ['special-offers-all'] });
      toast.success('تم حذف العرض بنجاح');
    },
    onError: (error) => {
      toast.error('فشل في حذف العرض: ' + error.message);
    },
  });
}
