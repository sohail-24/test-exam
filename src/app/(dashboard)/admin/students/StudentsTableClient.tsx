'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, CheckCircle2, AlertCircle } from 'lucide-react';

interface StudentRow {
  id: string;
  name: string;
  mobile: string;
  email: string;
  kycComplete: boolean;
  resultsCount: number;
  createdAt: string;
}

export default function StudentsTableClient({ initialStudents }: { initialStudents: StudentRow[] }) {
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');

  const filtered = useMemo(() => {
    return initialStudents.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        s.name.toLowerCase().includes(q) ||
        s.mobile.includes(q) ||
        s.email.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (kycFilter === 'VERIFIED') return s.kycComplete;
      if (kycFilter === 'PENDING') return !s.kycComplete;
      return true;
    });
  }, [initialStudents, search, kycFilter]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, mobile or email..."
            className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value as never)}
            className="border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none bg-white font-medium text-slate-700"
          >
            <option value="ALL">All KYC Status</option>
            <option value="VERIFIED">Verified KYC</option>
            <option value="PENDING">Pending KYC</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-10">No students match the criteria.</p>
      ) : (
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left text-slate-500 font-semibold uppercase tracking-wider">
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">KYC Status</th>
                <th className="px-4 py-3">Exams Taken</th>
                <th className="px-4 py-3">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono">{s.mobile}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      s.kycComplete
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {s.kycComplete ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-amber-600" /> Pending
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-semibold">{s.resultsCount}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(s.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
