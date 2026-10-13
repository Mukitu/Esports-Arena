import { PaymentMethodConfig } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Payment configuration service.
 * Payment methods are dynamically fetched from and managed in the administrative database table `admin_payment_methods`.
 */

export async function fetchPaymentMethods(): Promise<PaymentMethodConfig[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('admin_payment_methods')
    .select('*')
    .eq('enabled', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active payment methods:', error);
    throw new Error('পেমেন্টের তথ্য লোড করা যায়নি।');
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    nameBn: item.name_bn,
    provider: item.provider,
    accountNumber: item.account_number,
    instructionsBn: item.instructions_bn || '',
    minDeposit: Number(item.min_deposit || 50),
    minWithdraw: Number(item.min_withdraw || 100),
    enabled: Boolean(item.enabled),
    createdBy: item.created_by,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}

export async function fetchAdminPaymentMethods(): Promise<PaymentMethodConfig[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('admin_payment_methods')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin payment methods:', error);
    throw new Error('অ্যাডমিন পেমেন্ট লিস্ট লোড করা যায়নি।');
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    nameBn: item.name_bn,
    provider: item.provider,
    accountNumber: item.account_number,
    instructionsBn: item.instructions_bn || '',
    minDeposit: Number(item.min_deposit || 50),
    minWithdraw: Number(item.min_withdraw || 100),
    enabled: Boolean(item.enabled),
    createdBy: item.created_by,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}

export async function createPaymentMethod(
  method: Omit<PaymentMethodConfig, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PaymentMethodConfig> {
  if (!isSupabaseConfigured) {
    throw new Error('সুপাবেস ডেটাবেস সংযোগ কনফিগার করা নেই।');
  }

  const { data, error } = await supabase
    .from('admin_payment_methods')
    .insert([
      {
        provider: method.provider,
        name_bn: method.nameBn,
        account_number: method.accountNumber,
        instructions_bn: method.instructionsBn,
        min_deposit: method.minDeposit,
        min_withdraw: method.minWithdraw,
        enabled: method.enabled,
      },
    ])
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating payment method:', error);
    throw new Error('পেমেন্ট পদ্ধতি যুক্ত করা সম্ভব হয়নি: ' + (error?.message || 'অজানা ত্রুটি'));
  }

  return {
    id: data.id,
    nameBn: data.name_bn,
    provider: data.provider,
    accountNumber: data.account_number,
    instructionsBn: data.instructions_bn || '',
    minDeposit: Number(data.min_deposit),
    minWithdraw: Number(data.min_withdraw),
    enabled: Boolean(data.enabled),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updatePaymentMethod(
  id: string,
  method: Partial<Omit<PaymentMethodConfig, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('সুপাবেস ডেটাবেস সংযোগ কনফিগার করা নেই।');
  }

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (method.nameBn !== undefined) updatePayload.name_bn = method.nameBn;
  if (method.provider !== undefined) updatePayload.provider = method.provider;
  if (method.accountNumber !== undefined) updatePayload.account_number = method.accountNumber;
  if (method.instructionsBn !== undefined) updatePayload.instructions_bn = method.instructionsBn;
  if (method.minDeposit !== undefined) updatePayload.min_deposit = method.minDeposit;
  if (method.minWithdraw !== undefined) updatePayload.min_withdraw = method.minWithdraw;
  if (method.enabled !== undefined) updatePayload.enabled = method.enabled;

  const { error } = await supabase
    .from('admin_payment_methods')
    .update(updatePayload)
    .eq('id', id);

  if (error) {
    console.error('Error updating payment method:', error);
    throw new Error('পেমেন্ট পদ্ধতি আপডেট করা সম্ভব হয়নি: ' + error.message);
  }
}

export async function togglePaymentMethodStatus(id: string, enabled: boolean): Promise<void> {
  return updatePaymentMethod(id, { enabled });
}

export async function deletePaymentMethod(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('সুপাবেস ডেটাবেস সংযোগ কনফিগার করা নেই।');
  }

  const { error } = await supabase
    .from('admin_payment_methods')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting payment method:', error);
    throw new Error('পেমেন্ট পদ্ধতি মুছে ফেলা সম্ভব হয়নি: ' + error.message);
  }
}
