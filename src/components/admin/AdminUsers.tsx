import React, { useState, useEffect } from 'react';
import { ManagedUserListItem, AdminRole } from '../../types';
import { fetchUsers, deleteUserAccount, suspendUser, unsuspendUser } from '../../services/userManagementService';
import { UserDetailsModal } from './UserDetailsModal';
import { Badge } from '../common/Badge';
import { Search, Filter, User, RefreshCw, ChevronLeft, ChevronRight, Eye, ArrowUpDown, Trash2, AlertCircle, CheckCircle2, Ban, ShieldCheck } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<ManagedUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: ManagedUserListItem | null }>({
    open: false,
    user: null,
  });
  const [deleting, setDeleting] = useState(false);

  const [suspendModal, setSuspendModal] = useState<{ open: boolean; user: ManagedUserListItem | null; reason: string }>({
    open: false,
    user: null,
    reason: 'চিটিং বা প্ল্যাটফর্ম রুলস লঙ্ঘনের দায়ে স্থগিত',
  });
  const [suspending, setSuspending] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, sortOrder]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchUsers({
        page,
        pageSize: 10,
        searchQuery,
        roleFilter,
        sortOrder,
      });
      setUsers(res.users);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleDeleteUserExecute = async () => {
    if (!deleteModal.user) return;

    setDeleting(true);
    try {
      const res = await deleteUserAccount(deleteModal.user.id);
      if (res.success) {
        showToast(res.messageBn);
        setDeleteModal({ open: false, user: null });
        await loadUsers();
      } else {
        alert(res.messageBn);
      }
    } catch (err) {
      alert('ইউজার ডিলিট করা সম্ভব হয়নি।');
    } finally {
      setDeleting(false);
    }
  };

  const handleSuspendUserExecute = async () => {
    if (!suspendModal.user) return;

    setSuspending(true);
    try {
      const res = await suspendUser(suspendModal.user.id, suspendModal.reason);
      if (res.success) {
        showToast(res.messageBn);
        setSuspendModal({ open: false, user: null, reason: '' });
        await loadUsers();
      } else {
        alert(res.messageBn);
      }
    } catch (err) {
      alert('ইউজার সাসপেন্ড করা সম্ভব হয়নি।');
    } finally {
      setSuspending(false);
    }
  };

  const handleUnsuspendUser = async (u: ManagedUserListItem) => {
    const confirmRestore = window.confirm(`আপনি কি ${u.displayName}-এর সাসপেনশন প্রত্যাহার করে অ্যাকাউন্ট পুনরায় সক্রিয় করতে চান?`);
    if (!confirmRestore) return;

    try {
      const res = await unsuspendUser(u.id);
      if (res.success) {
        showToast(res.messageBn);
        await loadUsers();
      } else {
        alert(res.messageBn);
      }
    } catch (err) {
      alert('সাসপেনশন প্রত্যাহার ব্যর্থ হয়েছে।');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  // Client side status filtering
  const displayedUsers = users.filter((u) => {
    if (statusFilter === 'active') return !u.isSuspended;
    if (statusFilter === 'suspended') return u.isSuspended;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-950 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-semibold animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <User className="w-3.5 h-3.5" />
            <span>ইউজার ডিরেক্টরি ({totalCount} জন)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            নিবন্ধিত ইউজার তালিকা ও ব্যবস্থাপনা
          </h2>
          <p className="text-xs text-slate-400">
            গেমারদের তথ্য অনুসন্ধান, রোল পরিবর্তন, সাসপেন্ড / ব্যান এবং অ্যাকাউন্ট সক্রিয়করণ করুন।
          </p>
        </div>

        <button
          onClick={() => { setPage(1); loadUsers(); }}
          className="self-start sm:self-auto p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম, জিমেইল বা ফোন দিয়ে খুঁজুন..."
            className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
          />
        </form>

        {/* Filter Controls */}
        <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>স্ট্যাটাস:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="all">সব স্ট্যাটাস</option>
              <option value="active">কেবল সক্রিয় (Active)</option>
              <option value="suspended">সাসপেন্ড / ব্যানকৃত</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>রোল:</span>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="all">সব রোল (All)</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="user">Player (General User)</option>
            </select>
          </div>

          {/* Sort Order Toggle */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>ক্রমানুসারে:</span>
            <button
              onClick={() => {
                setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 transition-colors cursor-pointer"
            >
              {sortOrder === 'desc' ? 'নতুন থেকে পুরোনো' : 'পুরোনো থেকে নতুন'}
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">গেমার নাম</th>
                <th className="px-4 py-3">সাইন-আপ জিমেইল (Email)</th>
                <th className="px-4 py-3">অ্যাকাউন্ট স্ট্যাটাস</th>
                <th className="px-4 py-3">বর্তমান রোল (Roles)</th>
                <th className="px-4 py-3 text-right">ব্যালেন্স</th>
                <th className="px-4 py-3 text-center">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                      <span>ইউজার ডেটা লোড হচ্ছে...</span>
                    </div>
                  </td>
                </tr>
              ) : displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    কোনো ইউজার পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                displayedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 font-bold">
                          {u.displayName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{u.displayName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(u.createdAt).toLocaleDateString('bn-BD')}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-emerald-400 font-medium">
                      {u.email || u.phone || 'অজানা জিমেইল'}
                    </td>

                    <td className="px-4 py-3">
                      {u.isSuspended ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            <Ban className="w-3 h-3 text-rose-400" />
                            <span>সাসপেন্ড / ব্যান</span>
                          </span>
                          {u.suspensionReason && (
                            <p className="text-[10px] text-slate-400 max-w-[160px] truncate" title={u.suspensionReason}>
                              {u.suspensionReason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>সক্রিয় (Active)</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r, idx) => (
                          <Badge key={idx} variant={r === 'super_admin' ? 'amber' : r === 'admin' ? 'indigo' : 'slate'}>
                            {r === 'super_admin' ? 'Super Admin' : r === 'admin' ? 'Admin' : 'Player'}
                          </Badge>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-emerald-400 tabular-nums">
                      ৳{u.walletBalance}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedUserId(u.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                          title="বিস্তারিত ও রোল দেখুন"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>বিস্তারিত</span>
                        </button>

                        {!u.roles.includes('super_admin') && (
                          <>
                            {u.isSuspended ? (
                              <button
                                onClick={() => handleUnsuspendUser(u)}
                                className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
                                title="সাসপেনশন তুলে নিন (Unban / Restore)"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span>সক্রিয় করুন</span>
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setSuspendModal({
                                    open: true,
                                    user: u,
                                    reason: 'চিটিং বা প্ল্যাটফর্ম রুলস লঙ্ঘনের দায়ে স্থগিত',
                                  })
                                }
                                className="p-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
                                title="সাসপেন্ড / ব্যান করুন"
                              >
                                <Ban className="w-3.5 h-3.5 text-amber-400" />
                                <span>সাসপেন্ড</span>
                              </button>
                            )}

                            <button
                              onClick={() => setDeleteModal({ open: true, user: u })}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 transition-colors cursor-pointer"
                              title="ইউজার ডিলিট করুন"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>
            পৃষ্ঠা <strong className="text-white">{page}</strong> এর <strong className="text-white">{totalPages}</strong> (মোট {totalCount} টি রেকর্ড)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-200 px-2">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* User Details & Role Management Modal */}
      {selectedUserId && (
        <UserDetailsModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUserRolesUpdated={() => loadUsers()}
        />
      )}

      {/* Suspend / Ban User Modal */}
      {suspendModal.open && suspendModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <Ban className="w-5 h-5 text-amber-400" />
              <span>ইউজার সাসপেন্ড / ব্যান করুন</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              আপনি কি নিশ্চিত যে <strong className="text-white">{suspendModal.user.displayName}</strong> ({suspendModal.user.email || 'ইউজার'})-কে প্ল্যাটফর্ম থেকে সাময়িকভাবে সাসপেন্ড / ব্যান করতে চান?
            </p>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-300">সাসপেন্ড করার কারণ (ইউজারকে প্রদর্শন করা হবে):</label>
              <textarea
                value={suspendModal.reason}
                onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })}
                rows={3}
                placeholder="যেমন: চিটিং, ফেক ট্রানজেকশন বা রুলস লঙ্ঘনের কারণে সাময়িক স্থগিত..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={suspending}
                onClick={() => setSuspendModal({ open: false, user: null, reason: '' })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                disabled={suspending}
                onClick={handleSuspendUserExecute}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {suspending ? 'সাসপেন্ড করা হচ্ছে...' : 'হ্যাঁ, সাসপেন্ড করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteModal.open && deleteModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-lg">
              <AlertCircle className="w-6 h-6" />
              <span>ইউজার মুছে ফেলার সতর্কতা</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              আপনি কি নিশ্চিত যে <strong className="text-white">{deleteModal.user.displayName}</strong> ({deleteModal.user.email || 'ইউজার'}) অ্যাকাউন্টটি সম্পূর্ণ মুছে ফেলতে চান? এটি মুছে ফেলা হলে সিস্টেম থেকে স্থায়ীভাবে চলে যাবে।
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={deleting}
                onClick={() => setDeleteModal({ open: false, user: null })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                disabled={deleting}
                onClick={handleDeleteUserExecute}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white cursor-pointer"
              >
                {deleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, ইউজার ডিলিট করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
