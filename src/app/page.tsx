import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  ClipboardList,
  QrCode,
  Award,
  Clock,
  ShieldCheck,
} from 'lucide-react';

const CAPABILITIES = [
  {
    index: '01.',
    title: 'Isolated Institute Portals',
    description:
      'Every coaching center or academy operates inside a dedicated tenant workspace with its own exams, student records, and submissions.',
    icon: Building2,
  },
  {
    index: '02.',
    title: 'Dynamic MCQ Exam Builder',
    description:
      'Configure exam title, duration, pricing mode, and multiple-choice questions with 2 to 6 answer options in a single builder.',
    icon: ClipboardList,
  },
  {
    index: '03.',
    title: 'Shareable Links & QR Codes',
    description:
      'Publishing an exam generates a direct student URL and scannable QR code ready for classrooms, portals, or messaging groups.',
    icon: QrCode,
  },
  {
    index: '04.',
    title: 'Timed Exam Engine & Instant Scoring',
    description:
      'Responsive 70/30 desktop split and mobile bottom-drawer palette with reload recovery, countdown timer, and immediate grading.',
    icon: Award,
  },
];

const WORKFLOW_STEPS = [
  {
    step: 'Step 01',
    title: 'Register or Provision an Institute',
    description:
      'Institutes sign up through onboarding or are provisioned by the Super Master administrator with an assigned plan and active status.',
    href: '/onboard',
    actionLabel: 'Open Onboarding',
  },
  {
    step: 'Step 02',
    title: 'Create & Distribute Assessments',
    description:
      'Institute administrators sign in to compose multiple-choice exams and copy the generated student link or QR code.',
    href: '/login',
    actionLabel: 'Admin Login',
  },
  {
    step: 'Step 03',
    title: 'Verify Candidates & Grade Instantly',
    description:
      'Students complete inline verification, submit their timed test, and see their score immediately while results sync to the admin table.',
    href: '/exam/demo',
    actionLabel: 'Launch Demo Exam',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-[family-name:var(--font-geist-sans)]">
      {/* Top Bar (3-zone contract) */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            LopyTech
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6 text-sm font-medium text-slate-600">
            <a
              href="#capabilities"
              className="hidden md:inline-block hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Capabilities
            </a>
            <a
              href="#workflow"
              className="hidden md:inline-block hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Workflow
            </a>
            <Link
              href="/exam/demo"
              className="hidden sm:inline-block hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Demo Exam
            </Link>
            <Link
              href="/login"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Login
            </Link>
          </nav>

          <div className="shrink-0">
            <Link
              href="/onboard"
              className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Proposition */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              <p className="text-sm font-medium text-emerald-700">
                Multi-tenant online examination platform
              </p>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1] text-balance">
                Run online exams for your institute without setup friction.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                LopyTech provides coaching centers, academies, and training institutes with an
                isolated portal to author multiple-choice exams, share QR test links, verify
                candidates, and review scored submissions.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/onboard"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-sm font-semibold px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
                >
                  Login
                </Link>
                <Link
                  href="/exam/demo"
                  className="inline-flex items-center justify-center text-sm font-medium text-slate-600 hover:text-slate-900 underline underline-offset-4 px-2 py-2 whitespace-nowrap"
                >
                  Try Demo Exam
                </Link>
              </div>
            </div>

            {/* Structured Portal Directory Panel */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
              <div className="space-y-1 pb-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-900">Platform Entry Points</h2>
                <p className="text-xs text-slate-500">
                  Select a workspace to preview or sign in
                </p>
              </div>

              <div className="divide-y divide-slate-100 my-2">
                <Link
                  href="/login"
                  className="py-4 flex items-start justify-between gap-4 group"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Institute Admin Portal
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Sign in to create exams, copy QR codes, and view student results.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 mt-1 transition-colors" />
                </Link>

                <Link
                  href="/onboard"
                  className="py-4 flex items-start justify-between gap-4 group"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Institute Onboarding
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Register a new organization workspace and choose a subscription plan.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 mt-1 transition-colors" />
                </Link>

                <Link
                  href="/exam/demo"
                  className="py-4 flex items-start justify-between gap-4 group"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Student Exam Experience
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Preview candidate verification, timed 70/30 test interface, and scoring.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 mt-1 transition-colors" />
                </Link>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Timed MCQ Engine
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Tenant Scoped
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities Section */}
        <section id="capabilities" className="bg-white border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16 space-y-10">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Built for institutes and test-takers
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                Everything needed to author assessments, distribute links, and collect verified
                student submissions across desktop and mobile browsers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {CAPABILITIES.map(({ index, title, description, icon: Icon }) => (
                <div
                  key={index}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-700 font-[family-name:var(--font-geist-mono)] tabular-nums">
                      {index}
                    </span>
                    <Icon className="w-5 h-5 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16 space-y-10">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              How an institute launches an exam
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Three direct steps from organization setup to live student grading.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WORKFLOW_STEPS.map((item) => (
              <div
                key={item.step}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 font-[family-name:var(--font-geist-mono)] tabular-nums">
                    {item.step}
                  </p>
                  <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                </div>

                <div>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
                  >
                    {item.actionLabel} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-900">LopyTech</span>
            <span aria-hidden="true">·</span>
            <span>Multi-Tenant Exam Portal</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <Link href="/login" className="hover:text-slate-900 transition-colors whitespace-nowrap">
              Login
            </Link>
            <Link href="/onboard" className="hover:text-slate-900 transition-colors whitespace-nowrap">
              Get Started
            </Link>
            <Link href="/exam/demo" className="hover:text-slate-900 transition-colors whitespace-nowrap">
              Demo Exam
            </Link>
            <Link
              href="/super-admin/login"
              className="hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Super Master
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
