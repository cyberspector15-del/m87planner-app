import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const createCheckoutSession = async (priceId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { priceId },
    });

    if (error) {
      throw error;
    }

    if (data?.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned from edge function');
    }
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    toast.error(error.message || 'Failed to initiate checkout. Please try again.');
    throw error;
  }
};
