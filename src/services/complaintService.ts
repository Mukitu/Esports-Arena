import { UserComplaint, ComplaintStatus, ComplaintCategory } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const COMPLAINT_CATEGORIES: Array<{ id: ComplaintCategory; nameBn: string }> = [
  { id: 'tournament', nameBn: 'টুর্নামেন্ট সংক্রান্ত সমস্যা' },
  { id: 'room_issue', nameBn: 'রুম আইডি বা পাসওয়ার্ড সমস্যা' },
  { id: 'cheating_report', nameBn: 'প্লেয়ারের বিরুদ্ধে হ্যাক/চিটিং রিপোর্ট' },
  { id: 'wallet', nameBn: 'ওয়ালেট বা ডিপোজিট/উইথড্র সমস্যা' },
  { id: 'other', nameBn: 'অন্যান্য অভিযোগ' },
];

export function getCategoryBn(cat: string): string {
  const match = COMPLAINT_CATEGORIES.find((c) => c.id === cat);
  return match ? match.nameBn : 'সাধারণ অভিযোগ';
}

export function getStatusBn(status: ComplaintStatus): string {
  switch (status) {
    case 'pending':
      return 'অপেক্ষমাণ';
    case 'in_progress':
      return 'তদন্ত/প্রক্রিয়াধীন';
    case 'resolved':
      return 'সমাধানকৃত';
    case 'rejected':
      return 'বাতিলকৃত';
    default:
      return 'অপেক্ষমাণ';
  }
}

// In-memory / Mock storage for preview fallback
let MOCK_COMPLAINTS: UserComplaint[] = [
  {
    id: 'cmp-01',
    userId: 'usr-gamer-02',
    userDisplayName: 'সাকিব আল হাসান',
    userContact: '01898765432',
    title: 'ম্যাচে সন্দেহজনক হ্যাকার প্লেয়ারের চিটিং রিপোর্ট',
    description: 'ম্যাচ শুরু হওয়ার ৩ মিনিট পরেই একজন প্লেয়ার ওয়ালের মধ্য দিয়ে অস্বাভাবিকভাবে হেডশট মারে। ইন-গেম ইউআইডি স্ক্রিনশটে পরিষ্কার দেখা যাচ্ছে।',
    screenshotUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    category: 'cheating_report',
    categoryBn: 'প্লেয়ারের বিরুদ্ধে হ্যাক/চিটিং রিপোর্ট',
    reportedUserId: 'UID-9920148',
    status: 'pending',
    statusBn: 'অপেক্ষমাণ',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'cmp-02',
    userId: 'usr-gamer-03',
    userDisplayName: 'আরিফুল ইসলাম',
    userContact: '01911223344',
    title: 'রুম আইডি ও পাসওয়ার্ডে প্রবেশে সমস্যা',
    description: 'ম্যাচ শুরুর ১৫ মিনিট আগে দেওয়া রুম পাসওয়ার্ড ভুল আসছিল। পরবর্তীতে ঠিক হলেও জয়েন হতে বিলম্ব হয়েছে।',
    screenshotUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    category: 'room_issue',
    categoryBn: 'রুম আইডি বা পাসওয়ার্ড সমস্যা',
    status: 'in_progress',
    statusBn: 'তদন্ত/প্রক্রিয়াধীন',
    adminNotes: 'অ্যাডমিন টিম ম্যাচ লগের সাথে স্ক্রিনশট মিলিয়ে যাচাই করছে।',
    reviewedBy: 'Admin',
    reviewedAt: new Date(Date.now() - 1800000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

/**
 * Submit a New User Complaint (MANDATORY Title, Description & Screenshot)
 */
export async function submitUserComplaint(params: {
  title: string;
  description: string;
  screenshotUrl: string;
  category?: ComplaintCategory;
  reportedUserId?: string;
  tournamentId?: string;
}): Promise<{ success: boolean; messageBn: string; complaintId?: string }> {
  const { title, description, screenshotUrl, category = 'tournament', reportedUserId, tournamentId } = params;

  if (!title.trim()) {
    return { success: false, messageBn: 'অভিযোগের শিরোনাম বা টাইটেল প্রদান করা বাধ্যতামূলক।' };
  }
  if (!description.trim()) {
    return { success: false, messageBn: 'সমস্যার বিস্তারিত বিবরণ প্রদান করা বাধ্যতামূলক।' };
  }
  if (!screenshotUrl.trim()) {
    return { success: false, messageBn: 'প্রমাণ হিসেবে স্ক্রিনশট বা ছবি আপলোড করা বাধ্যতামূলক।' };
  }

  if (!isSupabaseConfigured) {
    const newComplaint: UserComplaint = {
      id: 'cmp-' + Date.now(),
      userId: 'usr-current',
      userDisplayName: 'আপনি (বর্তমান ইউজার)',
      title: title.trim(),
      description: description.trim(),
      screenshotUrl: screenshotUrl.trim(),
      category,
      categoryBn: getCategoryBn(category),
      reportedUserId: reportedUserId?.trim() || undefined,
      tournamentId: tournamentId?.trim() || undefined,
      status: 'pending',
      statusBn: 'অপেক্ষমাণ',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_COMPLAINTS.unshift(newComplaint);
    return {
      success: true,
      messageBn: 'আপনার অভিযোগটি সফলভাবে জমা নেওয়া হয়েছে! অ্যাডমিন প্যানেল শীঘ্রই এটি পর্যালোচনা করবে।',
      complaintId: newComplaint.id,
    };
  }

  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      return { success: false, messageBn: 'অভিযোগ জমা দিতে প্রথমে অ্যাকাউন্টে লগইন করতে হবে।' };
    }

    const { data, error } = await supabase
      .from('user_complaints')
      .insert([
        {
          user_id: authData.user.id,
          title: title.trim(),
          description: description.trim(),
          screenshot_url: screenshotUrl.trim(),
          category,
          reported_user_id: reportedUserId?.trim() || null,
          tournament_id: tournamentId?.trim() || null,
          status: 'pending',
          status_bn: 'অপেক্ষমাণ',
        },
      ])
      .select('id')
      .single();

    if (error || !data) {
      console.error('Error inserting user complaint:', error);
      // Fallback try RPC if available
      const { data: rpcData, error: rpcError } = await supabase.rpc('submit_user_complaint', {
        _title: title.trim(),
        _description: description.trim(),
        _screenshot_url: screenshotUrl.trim(),
        _category: category,
        _reported_user_id: reportedUserId?.trim() || null,
        _tournament_id: tournamentId?.trim() || null,
      });

      if (rpcError) {
        return { success: false, messageBn: 'অভিযোগ জমা দেওয়া সম্ভব হয়নি: ' + error?.message };
      }
      return {
        success: true,
        messageBn: 'আপনার অভিযোগটি সফলভাবে জমা নেওয়া হয়েছে!',
        complaintId: rpcData?.id,
      };
    }

    return {
      success: true,
      messageBn: 'আপনার অভিযোগটি সফলভাবে জমা নেওয়া হয়েছে! অ্যাডমিন শীঘ্রই তা পর্যালোচনা করে সমাধান জানাবে।',
      complaintId: data.id,
    };
  } catch (err: any) {
    console.error('Unexpected error in submitUserComplaint:', err);
    return { success: false, messageBn: 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।' };
  }
}

/**
 * Fetch Complaints submitted by current logged-in user
 */
export async function fetchUserComplaints(): Promise<UserComplaint[]> {
  if (!isSupabaseConfigured) {
    return MOCK_COMPLAINTS;
  }

  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return [];

    const { data, error } = await supabase
      .from('user_complaints')
      .select('*')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Could not fetch user complaints from DB:', error);
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      title: item.title,
      description: item.description,
      screenshotUrl: item.screenshot_url,
      category: item.category as ComplaintCategory,
      categoryBn: getCategoryBn(item.category),
      reportedUserId: item.reported_user_id,
      tournamentId: item.tournament_id,
      status: item.status as ComplaintStatus,
      statusBn: item.status_bn || getStatusBn(item.status),
      adminNotes: item.admin_notes,
      reviewedBy: item.reviewed_by,
      reviewedAt: item.reviewed_at,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (err) {
    console.error('Error fetching user complaints:', err);
    return [];
  }
}

/**
 * Fetch All Complaints for Admin Review
 */
export async function fetchAdminComplaints(params?: {
  statusFilter?: string;
  searchQuery?: string;
}): Promise<UserComplaint[]> {
  if (!isSupabaseConfigured) {
    let filtered = [...MOCK_COMPLAINTS];
    if (params?.statusFilter && params.statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === params.statusFilter);
    }
    if (params?.searchQuery && params.searchQuery.trim()) {
      const q = params.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          (c.reportedUserId && c.reportedUserId.toLowerCase().includes(q)) ||
          (c.userDisplayName && c.userDisplayName.toLowerCase().includes(q))
      );
    }
    return filtered;
  }

  try {
    let query = supabase
      .from('user_complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (params?.statusFilter && params.statusFilter !== 'all') {
      query = query.eq('status', params.statusFilter);
    }

    if (params?.searchQuery && params.searchQuery.trim()) {
      const q = params.searchQuery.trim();
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,reported_user_id.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.warn('Error querying admin complaints:', error);
      return [];
    }

    // Fetch user profiles for display names and phone
    const userIds = Array.from(new Set(data.map((c: any) => c.user_id).filter(Boolean)));
    const profilesMap: Record<string, { name: string; contact: string }> = {};

    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, display_name, phone')
        .in('id', userIds);

      (profs || []).forEach((p: any) => {
        profilesMap[p.id] = {
          name: p.display_name || 'গেমার ' + p.id.slice(-4),
          contact: p.phone || '',
        };
      });
    }

    return data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      userDisplayName: profilesMap[item.user_id]?.name || 'গেমার ' + (item.user_id ? item.user_id.slice(-4) : '****'),
      userContact: profilesMap[item.user_id]?.contact || '',
      title: item.title,
      description: item.description,
      screenshotUrl: item.screenshot_url,
      category: item.category as ComplaintCategory,
      categoryBn: getCategoryBn(item.category),
      reportedUserId: item.reported_user_id,
      tournamentId: item.tournament_id,
      status: item.status as ComplaintStatus,
      statusBn: item.status_bn || getStatusBn(item.status),
      adminNotes: item.admin_notes,
      reviewedBy: item.reviewed_by,
      reviewedAt: item.reviewed_at,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (err) {
    console.error('Error fetching admin complaints:', err);
    return [];
  }
}

/**
 * Update Complaint Status & Resolution by Admin
 */
export async function updateComplaintStatus(params: {
  complaintId: string;
  status: ComplaintStatus;
  adminNotes?: string;
}): Promise<{ success: boolean; messageBn: string }> {
  const { complaintId, status, adminNotes } = params;

  if (!isSupabaseConfigured) {
    const item = MOCK_COMPLAINTS.find((c) => c.id === complaintId);
    if (item) {
      item.status = status;
      item.statusBn = getStatusBn(status);
      item.adminNotes = adminNotes || item.adminNotes;
      item.reviewedAt = new Date().toISOString();
      item.updatedAt = new Date().toISOString();
    }
    return {
      success: true,
      messageBn: `অভিযোগের স্ট্যাটাস সফলভাবে '${getStatusBn(status)}' হিসেবে হালনাগাদ করা হয়েছে (মক মোড)।`,
    };
  }

  try {
    const { data: authData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('user_complaints')
      .update({
        status,
        status_bn: getStatusBn(status),
        admin_notes: adminNotes || null,
        reviewed_by: authData?.user?.id || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', complaintId);

    if (error) {
      console.error('Error updating complaint status:', error);
      return { success: false, messageBn: 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে: ' + error.message };
    }

    return {
      success: true,
      messageBn: `অভিযোগের স্ট্যাটাস সফলভাবে '${getStatusBn(status)}' হিসেবে হালনাগাদ করা হয়েছে!`,
    };
  } catch (err: any) {
    console.error('Unexpected error in updateComplaintStatus:', err);
    return { success: false, messageBn: 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।' };
  }
}
