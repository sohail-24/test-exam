'use client';

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Webcam from 'react-webcam';
import { Camera, FileText, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { saveKycAction } from './actions';

// ─── Schemas ──────────────────────────────────────────────
const step1Schema = z.object({
  name: z.string().min(2, 'Min 2 characters'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { message: 'Select gender' }),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
});

type Step1Data = z.infer<typeof step1Schema>;

export default function KycClient() {
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });

  const captureSelfie = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setSelfieDataUrl(imageSrc);
      setShowWebcam(false);
    }
  }, []);

  const onStep1Submit = (data: Step1Data) => {
    setStep1Data(data);
    setStep(2);
  };

  const onFinalSubmit = async () => {
    if (!step1Data || !aadhaarFile) {
      setError('Aadhaar document is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('name', step1Data.name);
      fd.append('gender', step1Data.gender);
      fd.append('mobile', step1Data.mobile);
      fd.append('aadhaar', aadhaarFile);
      if (selfieDataUrl) fd.append('selfie', selfieDataUrl);
      await saveKycAction(fd);
      router.push('/student/exam/demo');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  step >= s
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-slate-300 text-slate-400'
                }`}
              >
                {s}
              </div>
              <span className={`text-xs ${step >= s ? 'text-green-600 font-medium' : 'text-slate-400'}`}>
                {s === 1 ? 'Personal Info' : 'KYC Documents'}
              </span>
              {s < 2 && <div className="flex-1 h-px bg-slate-200" />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                {...register('name')}
                placeholder="As per Aadhaar"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
              <div className="flex gap-3">
                {(['MALE', 'FEMALE', 'OTHER'] as const).map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value={g} {...register('gender')} className="accent-green-600" />
                    <span className="text-sm capitalize">{g.toLowerCase()}</span>
                  </label>
                ))}
              </div>
              {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
              <input
                {...register('mobile')}
                type="tel"
                placeholder="10-digit mobile"
                maxLength={10}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile.message}</p>}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg text-sm"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900">KYC Documents</h2>

            {/* Aadhaar Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Aadhaar Card <span className="text-red-500">*</span>
              </label>
              <label className="flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-lg px-4 py-3 cursor-pointer hover:border-green-400 transition-colors">
                <FileText className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-500">
                  {aadhaarFile ? aadhaarFile.name : 'Upload PDF or image'}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setAadhaarFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {/* Selfie Capture */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Selfie <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              {selfieDataUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selfieDataUrl} alt="Selfie" className="w-28 h-28 rounded-xl object-cover border border-slate-200" />
                  <button
                    onClick={() => setSelfieDataUrl(null)}
                    className="mt-2 text-xs text-red-500 hover:text-red-700"
                  >
                    Retake
                  </button>
                </div>
              ) : showWebcam ? (
                <div className="space-y-2">
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="rounded-xl w-full max-w-xs"
                  />
                  <button
                    onClick={captureSelfie}
                    className="flex items-center gap-2 bg-green-600 text-white text-sm px-4 py-2 rounded-lg"
                  >
                    <Camera className="w-4 h-4" /> Capture
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowWebcam(true)}
                  className="flex items-center gap-2 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <Camera className="w-4 h-4" /> Open Camera
                </button>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 border border-slate-200 text-slate-600 text-sm px-4 py-2.5 rounded-lg hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={onFinalSubmit}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2.5 rounded-lg text-sm"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {submitting ? 'Submitting...' : 'Complete KYC'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

