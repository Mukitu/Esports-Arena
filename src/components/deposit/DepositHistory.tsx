import React, { useState, useEffect } from 'react';
import { DepositRequest } from '../../types';
import { fetchUserDepositRequests } from '../../services/depositService';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { History, RefreshCw, AlertCircle } from 'lucide-react';

export const DepositHistory: React.FC = () => {
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchUserDepositRequests();
      setRequests(data);
    } catch (err) {
      console.error('Error loading deposit history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3 bg-[#0f172a] rounded-2xl border border-slate-800">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
        <p className="text-xs text-slate-400">ডিপোজিট ইতিহাস লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          <span>আমার ডিপোজিট রিকোয়েস্ট ইতিহাস</span>
        </h3>
        <Button variant="ghost" size="sm" onClick={loadHistory} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          রিফ্রেশ
        </Button>
      </div>

      {requests.length === 0 ? (
        <div className="p-12 text-center space-y-2">
          <History className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">আপনি এখনও কোনো ডিপোজিট রিকোয়েস্ট করেননি।</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">তারিখ</th>
                <th className="py-3.5 px-4 font-semibold">মাধ্যম</th>
                <th className="py-3.5 px-4 font-semibold">প্রেরক নম্বর & TrxID</th>
                <th className="py-3.5 px-4 font-semibold text-center">অবস্থা</th>
                <th className="py-3.5 px-4 font-semibold text-right">পরিমাণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 text-slate-400 text-xs">
                    {new Date(req.createdAt).toLocaleDateString('bn-BD', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white">
                    <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-slate-900 border border-slate-700 text-emerald-400 mr-2">
                      {req.paymentProvider}
                    </span>
                    <span>{req.paymentMethodName}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-slate-200 block">{req.senderNumber}</span>
                    <span className="font-mono text-xs text-emerald-400">{req.trxId}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {req.status === 'approved' ? (
                      <Badge variant="emerald">অনুমোদিত</Badge>
                    ) : req.status === 'pending' ? (
                      <Badge variant="amber">যাচাইয়ের অপেক্ষায়</Badge>
                    ) : (
                      <div className="space-y-1">
                        <Badge variant="rose">বাতিল করা হয়েছে</Badge>
                        {req.rejectionReason && (
                          <span className="text-[10px] text-rose-400 block font-normal max-w-xs">
                            কারণ: {req.rejectionReason}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 text-sm tabular-nums">
                    ৳{req.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
