import React, { useState, useEffect } from 'react';
import { ManagedUserListItem, AdminRole } from '../../types';
import { fetchUserDetails, setUserRoleRpc } from '../../services/userManagementService';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { X, Shield, ShieldCheck, User, Calendar, Wallet, Trophy, Clock, AlertTriangle, CheckCircle2, RefreshCw, Lock } from 'lucide-react';

interface UserDetailsModalProps {
  userId: string | null;
  onClose: () => void;
  onUserRolesUpdated?: () => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  userId,
  onClose,
  onUserRolesUpdated,
}) => {
  const { isSuperAdmin, isAdmin, user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<{
    profile: ManagedUserListItem;
    tournamentRegistrations: Array<{ id: string; tournamentTitle: string; inGameId: string; joinedAt: string }>;
    depositRequests: Array<{ id: string; amount: number; method: string; status: string; createdAt: string }>;
  } | null>(null);

  const [confirmAction, setConfirmAction] = useState<{
    role: AdminRole;
    action: 'add' | 'remove';
    roleNameBn: string;
  } | null>(null);

  const [updatingRole, setUpdatingRole] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (userId) {
      loadData(userId);
    }
  }, [userId]);

  const loadData = async (id: string) => {
    setLoading(true);
    setFeedbackMessage(null);
    try {
      const details = await fetchUserDetails(id);
      setUserData(details);
    } catch (err) {
      console.error('Error loading user details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return null;

  const handleRoleToggleRequest = (role: AdminRole, currentHasRole: boolean) => {
    const action = currentHasRole ? 'remove' : 'add';

    if (
      action === 'remove' &&
      role === 'super_admin' &&
      userData?.profile.email?.toLowerCase() === 'mukituislamnishat@gmail.com'
    ) {
      setFeedbackMessage({
        type: 'error',
        text: 'প্রধান Super Admin (mukituislamnishat@gmail.com) অ্যাকাউন্টের রোল পরিবর্তন করা যাবে না।',
      });
      return;
    }

    const roleNameBn =
      role === 'super_admin'
        ? 'Super Admin'
        : role === 'admin'
        ? 'Admin'
        : 'Player (User)';

    setConfirmAction({ role, action, roleNameBn });
  };

  const executeRoleChange = async () => {
    if (!confirmAction || !userData) return;

    setUpdatingRole(true);
    setFeedbackMessage(null);

    try {
      const res = await setUserRoleRpc(userData.profile.id, confirmAction.role, confirmAction.action);
      if (res.success) {
        setFeedbackMessage({ type: 'success', text: res.messageBn });
        await loadData(userData.profile.id);
        if (onUserRolesUpdated) onUserRolesUpdated();
      } else {
        setFeedbackMessage({ type: 'error', text: res.messageBn });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।' });
    } finally {
      setUpdatingRole(false);
      setConfirmAction(null);
    }
  };

  const canManageRoles = isSuperAdmin || isAdmin;
  const targetIsSuperAdmin = userData?.profile.roles.includes('super_admin');
  const targetIsAdmin = userData?.profile.roles.includes('admin');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative text-slate-100">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">
                {userData?.profile.displayName || 'ইউজার বিস্তারিত বিবরণ'}
              </h3>
              <span className="text-xs text-emerald-400 font-mono">
                {userData?.profile.email || userData?.profile.phone || 'অ্যাকাউন্ট জিমেইল'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
              <span>ইউজার প্রোফাইল ডেটা লোড হচ্ছে...</span>
            </div>
          ) : userData ? (
            <>
              {/* Feedback Alert */}
              {feedbackMessage && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                    feedbackMessage.type === 'success'
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {feedbackMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{feedbackMessage.text}</span>
                </div>
              )}

              {/* Basic Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    ইউজার প্রোফাইল ও অ্যাকাউন্ট তথ্য
                  </span>
                  <div className="text-xs space-y-1.5 text-slate-300">
                    <p className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">অ্যাকাউন্ট জিমেইল:</span>
                      <strong className="text-emerald-400 font-mono text-[11px] truncate max-w-[200px]" title={userData.profile.email || userData.profile.phone || ''}>
                        {userData.profile.email || (userData.profile.phone?.includes('@') ? userData.profile.phone : 'প্রদান করা হয়নি')}
                      </strong>
                    </p>
                    <p className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">পেমেন্ট অপশন (উইথড্রয়াল):</span>
                      <strong className="text-amber-300 font-mono text-[11px]">
                        {userData.profile.withdrawalProfile
                          ? `${userData.profile.withdrawalProfile.method}: ${userData.profile.withdrawalProfile.accountNumber}`
                          : 'কোনো নম্বর যুক্ত করা হয়নি'}
                      </strong>
                    </p>
                    {userData.profile.phone && !userData.profile.phone.includes('@') && (
                      <p className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">মোবাইল নম্বর:</span>
                        <strong className="text-slate-200 font-mono text-[11px]">{userData.profile.phone}</strong>
                      </p>
                    )}
                    <p className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400">নিবন্ধনের তারিখ:</span>
                      <strong className="text-slate-300">
                        {new Date(userData.profile.createdAt).toLocaleDateString('bn-BD', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    অর্থনৈতিক ও টুর্নামেন্ট সারাংশ
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">ওয়ালেট ব্যালেন্স</span>
                      <span className="text-emerald-400 font-bold text-base">৳{userData.profile.walletBalance}</span>
                    </div>
                    <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">মোট প্রাপ্ত পুরষ্কার</span>
                      <span className="text-amber-400 font-bold text-base">৳{userData.profile.totalWon}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ADMIN ROLE MANAGEMENT SECTION */}
              <div className="p-4 bg-[#090d16] border border-indigo-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>অ্যাডমিন রোল ব্যবস্থাপনা (Admin Control)</span>
                  </h4>
                  {!canManageRoles && (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>কেবলমাত্র এডমিনদের জন্য</span>
                    </span>
                  )}
                </div>

                {/* Current Active Roles */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-400">বর্তমান রোল:</span>
                  {userData.profile.roles.map((r, idx) => (
                    <Badge key={idx} variant={r === 'super_admin' ? 'amber' : r === 'admin' ? 'indigo' : 'slate'}>
                      {r === 'super_admin'
                        ? 'Super Admin'
                        : r === 'admin'
                        ? 'Admin'
                        : 'Player (User)'}
                    </Badge>
                  ))}
                </div>

                {/* Role Assignment Actions */}
                {canManageRoles ? (
                  <div className="pt-2 border-t border-slate-800/80">
                    {targetIsSuperAdmin ? (
                      <div className="p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Super Admin অ্যাকাউন্ট পরিবর্তন বা ডিমোট করার অনুমতি নেই।</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRoleToggleRequest('admin', Boolean(targetIsAdmin))}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-2 shadow-sm ${
                          targetIsAdmin
                            ? 'bg-rose-950/50 border-rose-500/50 text-rose-300 hover:bg-rose-900/60'
                            : 'bg-indigo-950/60 border-indigo-500/50 text-indigo-200 hover:bg-indigo-900/70'
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                        <span>
                          {targetIsAdmin
                            ? '– Remove Admin (অ্যাডমিন রোল অপসারণ করুন)'
                            : '+ Make Admin (অ্যাডমিন বানান)'}
                        </span>
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    রোল পরিবর্তন করার ক্ষমতা কেবল অনুমোদিত Admin এবং Super Admin অ্যাকাউন্টের রয়েছে।
                  </p>
                )}
              </div>

              {/* Tournament Registration History */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  <span>টুর্নামেন্ট অংশগ্রহণের ইতিহাস ({userData.tournamentRegistrations.length})</span>
                </h4>
                {userData.tournamentRegistrations.length === 0 ? (
                  <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-xs text-slate-500 text-center">
                    এখনো কোনো টুর্নামেন্টে অংশগ্রহণ করা হয়নি।
                  </div>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {userData.tournamentRegistrations.map((tr) => (
                      <div
                        key={tr.id}
                        className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-white block">{tr.tournamentTitle}</span>
                          <span className="text-[11px] text-slate-400">In-Game UID: {tr.inGameId}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(tr.joinedAt).toLocaleDateString('bn-BD')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Deposit Request History */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>ডিপোজিট রিকোয়েস্ট ইতিহাস ({userData.depositRequests.length})</span>
                </h4>
                {userData.depositRequests.length === 0 ? (
                  <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-xs text-slate-500 text-center">
                    কোনো ডিপোজিট রিকোয়েস্ট পাওয়া যায়নি।
                  </div>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {userData.depositRequests.map((dep) => (
                      <div
                        key={dep.id}
                        className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-emerald-400">৳{dep.amount} ({dep.method})</span>
                          <span className="text-[10px] text-slate-500 block">
                            {new Date(dep.createdAt).toLocaleDateString('bn-BD')}
                          </span>
                        </div>
                        <Badge variant={dep.status === 'approved' ? 'emerald' : dep.status === 'rejected' ? 'rose' : 'amber'}>
                          {dep.status === 'approved' ? 'অনুমোদিত' : dep.status === 'rejected' ? 'বাতিল' : 'অপেক্ষমাণ'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              ইউজার তথ্য লোড করা যায়নি।
            </div>
          )}
        </div>

        {/* CONFIRMATION MODAL OVERLAY FOR ROLE CHANGE */}
        {confirmAction && (
          <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md rounded-2xl flex items-center justify-center p-6 text-center animate-in fade-in duration-150">
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">
                  ভূমিকা (Role) পরিবর্তনের নিশ্চিতকরণ
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  আপনি কি নিশ্চিত যে আপনি{' '}
                  <strong className="text-amber-400">{userData?.profile.displayName}</strong>-কে{' '}
                  <strong className="text-white">{confirmAction.roleNameBn}</strong> রোল{' '}
                  <strong className={confirmAction.action === 'add' ? 'text-emerald-400' : 'text-rose-400'}>
                    {confirmAction.action === 'add' ? 'প্রদান' : 'অপসারণ'}
                  </strong>{' '}
                  করতে চান?
                </p>
                {confirmAction.role === 'admin' && confirmAction.action === 'add' && (
                  <div className="mt-2 p-3 bg-indigo-950/50 border border-indigo-500/30 rounded-xl text-[11px] text-indigo-200 text-left leading-normal">
                    এই ইউজারকে <strong>Admin</strong> করার সিদ্ধান্ত নিয়েছেন। এর ফলে তিনি এডমিন প্যানেলে প্রবেশ করে টুর্নামেন্ট, ম্যাচ রুম, রেজাল্ট ও সাধারণ ইউজার পরিচালনা করতে পারবেন। কিন্তু তিনি পেমেন্ট মেথড কনফিগারেশন পরিবর্তন বা Super Admin অ্যাকাউন্ট সংশোধন করতে পারবেন না।
                  </div>
                )}
                {confirmAction.role === 'admin' && confirmAction.action === 'remove' && (
                  <div className="mt-2 p-3 bg-rose-950/50 border border-rose-500/30 rounded-xl text-[11px] text-rose-200 text-left leading-normal">
                    এই ইউজারকে <strong>Admin</strong> ভূমিকা থেকে অপসারণ করার সিদ্ধান্ত নিয়েছেন। এর ফলে তিনি এডমিন প্যানেলে প্রবেশাধিকার হারাবেন এবং সাধারণ ইউজার (Player) হিসেবে রূপান্তরিত হবেন।
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant={confirmAction.action === 'add' ? 'primary' : 'danger'}
                  fullWidth
                  size="md"
                  disabled={updatingRole}
                  onClick={executeRoleChange}
                >
                  {updatingRole ? 'প্রসেসিং...' : 'হ্যাঁ, নিশ্চিত করুন'}
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  size="md"
                  disabled={updatingRole}
                  onClick={() => setConfirmAction(null)}
                >
                  বাতিল
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
