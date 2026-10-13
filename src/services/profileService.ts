import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { WithdrawalProfile } from '../types';

export const updateUserWithdrawalProfile = async (
  profile: WithdrawalProfile
): Promise<{ success: boolean; messageBn: string }> => {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      messageBn: 'অফলাইন মোড: উইথড্রয়াল প্রোফাইল সফলভাবে আপডেট করা হয়েছে।',
    };
  }

  try {
    const { data, error } = await supabase.rpc('update_user_withdrawal_profile', {
      _method: profile.method,
      _account_number: profile.accountNumber,
      _account_name: profile.accountName,
    });

    if (error) {
      // Fallback direct update if RPC is not yet executed in database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ব্যবহারকারী লগইন অবস্থায় নেই');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          withdrawal_method: profile.method,
          withdrawal_account_number: profile.accountNumber,
          withdrawal_account_name: profile.accountName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        return { success: false, messageBn: 'উইথড্রয়াল প্রোফাইল সেভ করতে সমস্যা হয়েছে: ' + updateError.message };
      }

      return { success: true, messageBn: 'উইথড্রয়াল প্রোফাইল তথ্য সফলভাবে আপডেট করা হয়েছে।' };
    }

    return {
      success: data?.success ?? true,
      messageBn: data?.message || 'উইথড্রয়াল প্রোফাইল তথ্য সফলভাবে সংরক্ষিত হয়েছে।',
    };
  } catch (err: any) {
    console.error('Error updating withdrawal profile:', err);
    return { success: false, messageBn: err.message || 'উইথড্রয়াল প্রোফাইল সংরক্ষণে সমস্যা হয়েছে।' };
  }
};
