import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, AdminRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBackendConnected: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  authModalOpen: boolean;
  authPromptMessage: string | null;
  loading: boolean;
  openAuthModal: (messageBn?: string) => void;
  closeAuthModal: () => void;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; errorBn?: string }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ success: boolean; errorBn?: string }>;
  loginWithPhoneOrEmail: (phoneOrEmail: string, password: string) => Promise<{ success: boolean; errorBn?: string }>;
  signUpWithPhoneOrEmail: (phoneOrEmail: string, password: string, name: string) => Promise<{ success: boolean; errorBn?: string }>;
  logout: () => Promise<void>;
  requireAuth: (callback: () => void, messageBn?: string) => void;
  requireAdminAuth: (callback: () => void, messageBn?: string) => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Restore existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email || '');
      } else {
        setLoading(false);
      }
    });

    // Listen to Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId: string, contactInfo: string) => {
    try {
      // Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Fetch Wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Fetch Assigned Roles from user_roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      // Filter to only valid strict roles: super_admin, admin, user
      const rawRoles = (rolesData || []).map((r) => r.role);
      let assignedRoles: AdminRole[] = [];
      if (rawRoles.includes('super_admin')) assignedRoles.push('super_admin');
      if (rawRoles.includes('admin')) assignedRoles.push('admin');
      if (assignedRoles.length === 0) assignedRoles = ['user'];

      const isMukituSuperAdmin = contactInfo.toLowerCase() === 'mukituislamnishat@gmail.com' ||
                                (profile?.phone && profile.phone.toLowerCase() === 'mukituislamnishat@gmail.com');

      if (isMukituSuperAdmin && !assignedRoles.includes('super_admin')) {
        assignedRoles.push('super_admin');
      }

      const withdrawalProfile = profile?.withdrawal_method
        ? {
            method: profile.withdrawal_method,
            accountNumber: profile.withdrawal_account_number || '',
            accountName: profile.withdrawal_account_name || '',
          }
        : undefined;

      const userEmail = contactInfo.includes('@') ? contactInfo : (profile?.phone?.includes('@') ? profile.phone : undefined);

      setUser({
        id: userId,
        name: profile?.display_name || (isMukituSuperAdmin ? 'Mukitu Islam Nishat' : 'গেমার ' + userId.slice(-4)),
        phone: profile?.phone && !profile.phone.includes('@') ? profile.phone : '',
        email: userEmail,
        walletBalance: wallet?.balance ? Number(wallet.balance) : 0,
        totalWon: wallet?.total_won ? Number(wallet.total_won) : 0,
        tournamentsJoined: 0,
        roles: assignedRoles,
        withdrawalProfile,
        gameIds: {},
        isSuspended: Boolean(profile?.is_suspended),
        suspensionReason: profile?.suspension_reason || undefined,
        suspendedAt: profile?.suspended_at || undefined,
      });
    } catch (err) {
      console.error('Error fetching authenticated user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.id, user.email || user.phone || '');
    }
  };

  const openAuthModal = (messageBn?: string) => {
    setAuthPromptMessage(messageBn || 'এই সুবিধাটি ব্যবহার করতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।');
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setAuthPromptMessage(null);
  };

  const loginWithEmail = async (emailInput: string, password: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const isMukitu = cleanEmail === 'mukituislamnishat@gmail.com';

    if (!isSupabaseConfigured) {
      const dummyUser: AuthUser = {
        id: 'usr-' + (isMukitu ? 'superadmin' : 'gamer'),
        name: isMukitu ? 'Mukitu Islam Nishat' : 'গেমার প্লেয়ার',
        phone: '',
        email: cleanEmail,
        walletBalance: 1000,
        totalWon: 500,
        tournamentsJoined: 3,
        roles: isMukitu ? ['super_admin'] : ['user'],
        gameIds: {},
      };
      setUser(dummyUser);
      closeAuthModal();
      return { success: true };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      return { success: false, errorBn: 'লগইন ব্যর্থ হয়েছে। সঠিক ইমেইল ও পাসওয়ার্ড প্রদান করুন।' };
    }

    if (data.user) {
      await fetchUserData(data.user.id, data.user.email || cleanEmail);
      closeAuthModal();
      return { success: true };
    }

    return { success: false, errorBn: 'লগইন প্রক্রিয়া সম্পন্ন করা যায়নি।' };
  };

  const signUpWithEmail = async (emailInput: string, password: string, name: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!isSupabaseConfigured) {
      const dummyUser: AuthUser = {
        id: 'usr-' + Math.floor(Math.random() * 1000),
        name: name.trim() || 'নতুন গেমার',
        phone: '',
        email: cleanEmail,
        walletBalance: 0,
        totalWon: 0,
        tournamentsJoined: 0,
        roles: ['user'],
        gameIds: {},
      };
      setUser(dummyUser);
      closeAuthModal();
      return { success: true };
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          display_name: name.trim(),
        },
      },
    });

    if (error) {
      return { success: false, errorBn: 'অ্যাকাউন্ট নিবন্ধন সম্ভব হয়নি: ' + error.message };
    }

    if (data.user) {
      await fetchUserData(data.user.id, cleanEmail);
      closeAuthModal();
      return { success: true };
    }

    return { success: false, errorBn: 'নিবন্ধন প্রক্রিয়া সম্পূর্ণ হয়নি।' };
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    closeAuthModal();
  };

  const requireAuth = (callback: () => void, messageBn?: string) => {
    if (user) {
      callback();
    } else {
      openAuthModal(messageBn || 'এই সুবিধাটি ব্যবহার করতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।');
    }
  };

  const requireAdminAuth = (callback: () => void, messageBn?: string) => {
    if (!user) {
      openAuthModal(messageBn || 'অ্যাডমিন সেকশনে প্রবেশ করতে প্রথমে অ্যাকাউন্টে লগইন করুন।');
      return;
    }

    const hasAdminPermission =
      user.roles.includes('super_admin') ||
      user.roles.includes('admin');

    if (hasAdminPermission) {
      callback();
    } else {
      openAuthModal('আপনার এই অ্যাডমিন সেকশনে প্রবেশের অনুমতি (Permission) নেই।');
    }
  };

  const isSuperAdmin = Boolean(user?.roles.includes('super_admin'));
  const isAdmin = isSuperAdmin || Boolean(user?.roles.includes('admin'));

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isBackendConnected: isSupabaseConfigured,
        isSuperAdmin,
        isAdmin,
        authModalOpen,
        authPromptMessage,
        loading,
        openAuthModal,
        closeAuthModal,
        loginWithEmail,
        signUpWithEmail,
        loginWithPhoneOrEmail: loginWithEmail,
        signUpWithPhoneOrEmail: signUpWithEmail,
        logout,
        requireAuth,
        requireAdminAuth,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
