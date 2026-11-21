'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building, CreditCard, Loader2, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { createTenantAction } from './actions';

const schema = z.object({
  orgName: z.string().min(2, 'Min 2 characters').max(80),
  adminEmail: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  plan: z.enum(['starter', 'pro', 'enterprise']),
});

type FormData = z.infer<typeof schema>;

const PLAN_PRICES: Record<string, { name: string; price: string }> = {
  starter: { name: 'Starter Plan', price: '₹999/month' },
  pro: { name: 'Pro Plan', price: '₹2,499/month' },
  enterprise: { name: 'Enterprise Plan', price: '₹4,999/month' },
};

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'payment' | 'done'>('form');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      plan: 'starter',
    },
  });

  const selectedPlan = watch('plan') || 'starter';

  const onSubmit = (data: FormData) => {
    setServerError(null);
    setFormData(data);
    setStep('payment');
  };

  const handleMockPayment = async () => {
    if (!formData) return;
    setLoading(true);
    setServerError(null);
    try {
      const res = await createTenantAction(
        formData.orgName,
        formData.adminEmail,
        formData.password,
        formData.plan,
      );

      if (!res.success && res.error) {
        setServerError(res.error);
        setStep('form');
        return;
      }

      setStep('done');
      setTimeout(() => router.push(res.redirectTo), 1500);
    } catch {
      setServerError('An error occurred during onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <Building className="w-8 h-8 text-emerald-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">Register Exam Portal</h1>
              <p className="text-xs text-slate-500">Sign up your organization & select a plan</p>
            </div>
          </div>
          <Link href="/login" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
            Sign In
          </Link>
        </div>

        {serverError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl">
            {serverError}
          </div>
        )}

        {/* Step: Form */}
        {step === 'form' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Organization / Institute Name
              </label>
              <input
                {...register('orgName')}
                placeholder="e.g. Apex Coaching Institute"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.orgName && (
                <p className="text-xs text-rose-500 mt-1">{errors.orgName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Admin Email Address
              </label>
              <input
                {...register('adminEmail')}
                type="email"
                placeholder="admin@apexclasses.com"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.adminEmail && (
                <p className="text-xs text-rose-500 mt-1">{errors.adminEmail.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Admin Password
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.password && (
                <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Plan Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Select Subscription Plan
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['starter', 'pro', 'enterprise'] as const).map((p) => {
                  const active = selectedPlan === p;
                  return (
                    <label
                      key={p}
                      className={`border-2 rounded-xl p-2.5 text-center cursor-pointer transition-all ${
                        active
                          ? 'border-emerald-600 bg-emerald-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input type="radio" value={p} {...register('plan')} className="sr-only" />
                      <p className="text-xs font-bold text-slate-900 capitalize">{p}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{PLAN_PRICES[p].price}</p>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors shadow-sm"
            >
              Continue to Activation <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500">Already registered by Super Admin? </span>
              <Link href="/login" className="text-xs text-emerald-600 hover:underline font-semibold">
                Sign in here
              </Link>
            </div>
          </form>
        )}

        {/* Step: Payment (UI only) */}
        {step === 'payment' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Organization</span>
                <span className="font-semibold text-slate-800">{formData?.orgName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Admin Email</span>
                <span className="font-mono text-slate-800">{formData?.adminEmail}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Selected Plan</span>
                <span className="font-semibold text-emerald-700 capitalize">
                  {formData?.plan ? PLAN_PRICES[formData.plan].name : 'Starter'}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Due</span>
                <span>{formData?.plan ? PLAN_PRICES[formData.plan].price : '₹999/mo'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />
              Razorpay Test Mode — no real credit card required
            </div>

            <button
              onClick={handleMockPayment}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-2.5 rounded-xl text-sm transition-colors shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {loading ? 'Activating Portal...' : 'Pay & Activate Portal'}
            </button>

            <button
              onClick={() => setStep('form')}
              className="w-full text-xs text-slate-500 hover:text-slate-700"
            >
              Back to Edit Info
            </button>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="text-center space-y-3 py-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <Check className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Portal Activated Successfully</h2>
            <p className="text-xs text-slate-500">Redirecting to your login & dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}
