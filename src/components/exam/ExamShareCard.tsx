'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { Copy, Check, ExternalLink, QrCode } from 'lucide-react';
import Link from 'next/link';

interface ExamShareCardProps {
  examId: string;
  examTitle?: string;
}

export default function ExamShareCard({ examId, examTitle }: ExamShareCardProps) {
  const [copied, setCopied] = useState(false);

  // Derive origin safely on client
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const examUrl = `${baseUrl}/exam/${examId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(examUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 max-w-md mx-auto text-center space-y-5">
      <div className="flex items-center justify-center gap-2 text-slate-800">
        <QrCode className="w-5 h-5 text-emerald-600" />
        <h3 className="font-bold text-base text-slate-900">Exam Ready to Share</h3>
      </div>

      {examTitle && (
        <p className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-100 rounded-lg py-2 px-3">
          {examTitle}
        </p>
      )}

      {/* QR Code */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block shadow-inner mx-auto">
        <QRCode value={examUrl} size={180} />
      </div>
      <p className="text-xs text-slate-500">Students can scan this QR code directly with any phone camera</p>

      {/* Share Link */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2 text-left">
        <input
          type="text"
          readOnly
          value={examUrl}
          className="bg-transparent text-xs text-slate-700 font-mono w-full focus:outline-none select-all"
        />
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded-md font-medium shrink-0 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="pt-2 flex gap-3">
        <Link
          href={examUrl}
          target="_blank"
          className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2.5 rounded-lg transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Preview Exam
        </Link>
        <Link
          href="/admin"
          className="flex-1 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors"
        >
          Done
        </Link>
      </div>
    </div>
  );
}
