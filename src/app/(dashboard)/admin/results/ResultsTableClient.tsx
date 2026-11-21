'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface ResultRow {
  id: string;
  studentName: string;
  mobile: string;
  examId: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  timeTaken: number;
  submittedAt: string;
}

type SortField = 'score' | 'percentage' | 'timeTaken' | null;
type SortOrder = 'asc' | 'desc';

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '< 1m';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

interface Props {
  exams: Array<{ id: string; title: string }>;
  initialResults: ResultRow[];
}

export default function ResultsTableClient({ exams, initialResults }: Props) {
  const [search, setSearch] = useState('');
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const toggleSort = (field: 'score' | 'percentage' | 'timeTaken') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filtered = useMemo(() => {
    const list = initialResults.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch =
        r.studentName.toLowerCase().includes(q) ||
        r.mobile.includes(q) ||
        r.examTitle.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (selectedExamId !== 'ALL' && r.examId !== selectedExamId) return false;
      return true;
    });

    if (!sortField) return list;

    return [...list].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [initialResults, search, selectedExamId, sortField, sortOrder]);

  const renderSortIcon = (field: 'score' | 'percentage' | 'timeTaken') => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-emerald-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-emerald-600" />
    );
  };

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
            placeholder="Search by student name, mobile or exam title..."
            className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Exams</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-10">No submissions recorded yet.</p>
      ) : (
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left text-slate-500 font-semibold uppercase tracking-wider">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Exam Title</th>
                <th className="px-4 py-3">
                  <button
                    onClick={() => toggleSort('score')}
                    className="group inline-flex items-center gap-1 hover:text-slate-900 transition-colors uppercase tracking-wider font-semibold"
                  >
                    Score {renderSortIcon('score')}
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    onClick={() => toggleSort('percentage')}
                    className="group inline-flex items-center gap-1 hover:text-slate-900 transition-colors uppercase tracking-wider font-semibold"
                  >
                    Percentage {renderSortIcon('percentage')}
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    onClick={() => toggleSort('timeTaken')}
                    className="group inline-flex items-center gap-1 hover:text-slate-900 transition-colors uppercase tracking-wider font-semibold"
                  >
                    Time Taken {renderSortIcon('timeTaken')}
                  </button>
                </th>
                <th className="px-4 py-3">Date Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-900">{r.studentName}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono">{r.mobile}</td>
                  <td className="px-4 py-3 text-slate-700">{r.examTitle}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {r.score} / {r.totalMarks}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      r.percentage >= 60
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : r.percentage >= 40
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {r.percentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-mono font-medium">
                    {formatDuration(r.timeTaken)}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(r.submittedAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
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
