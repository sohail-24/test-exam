'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Clock,
  BookOpen,
  User,
  Phone,
  CheckCircle2,
  Award,
  ArrowRight,
  Loader2,
  Camera,
  FileText,
  RotateCcw,
} from 'lucide-react';
import Webcam from 'react-webcam';
import ExamUI from '@/components/exam/ExamUI';
import { registerStudentAndStartExamAction, submitExamAnswersAction } from './actions';

interface Question {
  id: string;
  text: string;
  options: string[];
}

interface ExamData {
  id: string;
  title: string;
  description?: string | null;
  durationMinutes: number;
  isFree: boolean;
  price: number;
  tenantName: string;
  tenantId: string;
  questions: Question[];
}

interface ResultData {
  score: number;
  totalMarks: number;
  percentage: number;
  timeTaken: number;
}

export default function PublicExamClient({ exam }: { exam: ExamData }) {
  const [step, setStep] = useState<'kyc' | 'taking' | 'submitted'>('kyc');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [studentId, setStudentId] = useState<string>('');
  const [result, setResult] = useState<ResultData | null>(null);

  const webcamRef = useRef<Webcam>(null);

  const captureSelfie = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setSelfieDataUrl(imageSrc);
      setShowWebcam(false);
    }
  }, []);

  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    const cleanMobile = mobile.trim();
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    setSubmittingKyc(true);
    try {
      const fd = new FormData();
      fd.append('examId', exam.id);
      fd.append('tenantId', exam.tenantId);
      fd.append('name', name.trim());
      fd.append('mobile', cleanMobile);
      if (aadhaarFile) {
        fd.append('aadhaar', aadhaarFile);
      }
      if (selfieDataUrl) {
        fd.append('selfie', selfieDataUrl);
      }

      const res = await registerStudentAndStartExamAction(fd);

      if (res.success && res.studentId) {
        setStudentId(res.studentId);
        setStep('taking');
      } else {
        setError('Failed to initialize student session.');
      }
    } catch {
      setError('Error submitting KYC verification.');
    } finally {
      setSubmittingKyc(false);
    }
  };

  const handleExamSubmit = async (
    answers: { questionId: string; selectedIndex: number | null }[],
    timeTakenSeconds: number,
  ) => {
    const res = await submitExamAnswersAction(
      exam.id,
      exam.tenantId,
      studentId,
      answers,
      timeTakenSeconds,
    );
    setResult({
      score: res.score,
      totalMarks: res.totalMarks,
      percentage: res.percentage,
      timeTaken: res.timeTaken,
    });
    setStep('submitted');
  };

  // ── Step 1: Complete KYC & Exam Entry ───────────────────────
  if (step === 'kyc') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block">
              {exam.tenantName}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 pt-1">{exam.title}</h1>
            {exam.description && <p className="text-sm text-slate-500">{exam.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>
                Duration: <strong className="font-semibold text-slate-900">{exam.durationMinutes} mins</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>
                Questions: <strong className="font-semibold text-slate-900">{exam.questions.length}</strong>
              </span>
            </div>
          </div>

          <form onSubmit={handleStartExam} className="space-y-4 pt-1">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-semibold text-slate-800">Student Verification (KYC)</h2>
              <p className="text-xs text-slate-400">Enter personal info and upload verification documents</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">10-Digit Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* ── Aadhaar Card Upload ────────────────────────── */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Aadhaar Card Document <span className="text-slate-400 font-normal">(PDF or Image)</span>
              </label>
              <label className="flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3 cursor-pointer hover:border-emerald-400 transition-colors">
                <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {aadhaarFile ? aadhaarFile.name : 'Upload Aadhaar Card'}
                  </p>
                  <p className="text-[11px] text-slate-400">Click to choose PDF or JPG/PNG file</p>
                </div>
                {aadhaarFile && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setAadhaarFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {/* ── Webcam Selfie Capture ─────────────────────── */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Live Photo / Selfie <span className="text-slate-400 font-normal">(Optional Webcam Capture)</span>
              </label>

              {selfieDataUrl ? (
                <div className="flex items-center gap-3 border border-slate-200 rounded-xl p-2.5 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selfieDataUrl}
                    alt="Captured selfie"
                    className="w-16 h-16 rounded-lg object-cover border border-slate-300"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Photo Captured
                    </p>
                    <p className="text-[11px] text-slate-500">Live image verified for identity check</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelfieDataUrl(null);
                      setShowWebcam(true);
                    }}
                    className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 px-2.5 py-1.5 rounded-lg bg-white"
                  >
                    <RotateCcw className="w-3 h-3" /> Retake
                  </button>
                </div>
              ) : showWebcam ? (
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-900 text-center space-y-3">
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="rounded-lg w-full max-w-xs mx-auto aspect-video object-cover"
                    videoConstraints={{ facingMode: 'user' }}
                  />
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={captureSelfie}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                    >
                      <Camera className="w-4 h-4" /> Take Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWebcam(false)}
                      className="text-xs text-slate-300 hover:text-white px-3 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowWebcam(true)}
                  className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium py-2.5 rounded-xl transition-colors"
                >
                  <Camera className="w-4 h-4 text-slate-500" /> Open Camera for Selfie
                </button>
              )}
            </div>

            {error && <p className="text-xs text-rose-500">{error}</p>}

            <button
              type="submit"
              disabled={submittingKyc}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-sm"
            >
              {submittingKyc && <Loader2 className="w-4 h-4 animate-spin" />}
              {submittingKyc ? 'Verifying & Entering Exam...' : 'Start Exam'}
              {!submittingKyc && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Step 2: Exam In Progress ──────────────────────────────
  if (step === 'taking') {
    return (
      <ExamUI
        examId={exam.id}
        examTitle={exam.title}
        studentName={name}
        durationMinutes={exam.durationMinutes}
        questions={exam.questions}
        onSubmit={handleExamSubmit}
      />
    );
  }

  // ── Step 3: Exam Result Summary ───────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 text-center space-y-6">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <Award className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Exam Submitted!</h2>
          <p className="text-xs text-slate-500">Thank you, {name}. Your answers have been recorded.</p>
        </div>

        {result && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Your Score</p>
            <div className="text-3xl font-extrabold text-slate-900">
              {result.score} <span className="text-base font-normal text-slate-400">/ {result.totalMarks}</span>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                {result.percentage}% Marks
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {Math.floor(result.timeTaken / 60)}m {(result.timeTaken % 60).toString().padStart(2, '0')}s
              </span>
            </div>
          </div>
        )}

        <div className="pt-2">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Session completed securely
          </div>
        </div>
      </div>
    </div>
  );
}
