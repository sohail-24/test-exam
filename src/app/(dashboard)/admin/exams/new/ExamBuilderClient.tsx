'use client';

import { useFieldArray, useForm, useWatch, Control, UseFormRegister, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, GripVertical, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { saveExamAction } from './actions';
import ExamShareCard from '@/components/exam/ExamShareCard';

// ─── Zod Schema ───────────────────────────────────────────
const questionSchema = z.object({
  text: z.string().min(1, 'Please enter question text'),
  options: z.array(z.string()).min(2, 'At least 2 options'),
  correctOptionIndex: z.number(),
  order: z.number(),
});

const examSchema = z.object({
  title: z.string().min(1, 'Please enter exam title'),
  description: z.string().optional(),
  durationMinutes: z.number().min(1),
  isFree: z.boolean(),
  price: z.number().min(0),
  questions: z.array(questionSchema).min(1, 'Add at least 1 question'),
});

type ExamFormData = z.infer<typeof examSchema>;

// ─── Question Card ────────────────────────────────────────
function QuestionCard({
  index,
  register,
  control,
  remove,
  errors,
}: {
  index: number;
  register: UseFormRegister<ExamFormData>;
  control: Control<ExamFormData>;
  remove: (i: number) => void;
  errors: FieldErrors<ExamFormData>;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { fields: optFields, append: appendOpt, remove: removeOpt } = useFieldArray({
    control,
    name: `questions.${index}.options` as never,
  });

  const qErrors = errors?.questions?.[index];

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm">
      {/* Card header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-100">
        <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
        <span className="text-sm font-medium text-slate-600 flex-1">Question {index + 1}</span>
        <button type="button" onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-slate-600">
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Question text */}
          <div>
            <textarea
              {...register(`questions.${index}.text`)}
              rows={2}
              placeholder="Enter question text..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {qErrors?.text && <p className="text-xs text-red-500">{qErrors.text.message}</p>}
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Options</label>
            {optFields.map((opt, oi) => (
              <div key={opt.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  value={oi}
                  defaultChecked={oi === 0}
                  className="accent-green-600 mt-0.5 shrink-0"
                  {...register(`questions.${index}.correctOptionIndex`, { valueAsNumber: true })}
                />
                <input
                  {...register(`questions.${index}.options.${oi}` as `questions.0.options.0`)}
                  placeholder={`Option ${oi + 1}`}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {optFields.length > 2 && (
                  <button type="button" onClick={() => removeOpt(oi)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {optFields.length < 6 && (
              <button
                type="button"
                onClick={() => appendOpt('' as never)}
                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
              >
                <Plus className="w-3.5 h-3.5" /> Add Option
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function ExamBuilderClient({ tenantId }: { tenantId?: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [createdExam, setCreatedExam] = useState<{ id: string; title: string } | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: '',
      description: '',
      durationMinutes: 60,
      isFree: true,
      price: 0,
      questions: [
        { text: '', options: ['', ''], correctOptionIndex: 0, order: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'questions' });
  const isFree = useWatch({ control, name: 'isFree' });

  const onSubmit = async (data: ExamFormData) => {
    setSubmitting(true);
    setSaveError(null);
    try {
      // Filter out empty options before submission
      const sanitizedQuestions = data.questions.map((q) => ({
        ...q,
        options: q.options.filter((opt) => opt.trim().length > 0),
      }));

      // Validate that every question has at least 2 non-empty options
      for (let i = 0; i < sanitizedQuestions.length; i++) {
        if (sanitizedQuestions[i].options.length < 2) {
          setSaveError(`Question ${i + 1} must have at least 2 filled options.`);
          setSubmitting(false);
          return;
        }
      }

      const result = await saveExamAction(
        {
          ...data,
          questions: sanitizedQuestions,
        },
        tenantId
      );
      if (result.success && result.examId) {
        setCreatedExam({ id: result.examId, title: data.title });
      } else {
        setSaveError(result.error || 'Failed to save exam. Please check fields and try again.');
      }
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Unexpected error saving exam.');
    } finally {
      setSubmitting(false);
    }
  };

  const onError = (errors: FieldErrors<ExamFormData>) => {
    const firstError =
      errors.title?.message ||
      errors.questions?.message ||
      errors.questions?.root?.message ||
      errors.durationMinutes?.message ||
      'Please fill all required question text and at least 2 options.';
    setSaveError(firstError);
  };

  if (createdExam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <ExamShareCard examId={createdExam.id} examTitle={createdExam.title} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">New Exam</h1>

        {saveError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
            {saveError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
          {/* Exam Meta */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Exam Title</label>
              <input
                {...register('title')}
                placeholder="e.g. NEET Mock Test Series 1"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows={2}
                placeholder="Optional description..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
                <input
                  {...register('durationMinutes', { valueAsNumber: true })}
                  type="number"
                  min={1}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Free Exam</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" {...register('isFree')} className="sr-only peer" />
                    <div className="w-10 h-6 bg-slate-200 peer-checked:bg-green-600 rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-5 after:h-5 after:transition-all" />
                  </label>
                </div>

                {!isFree && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Price (₹)</label>
                    <input
                      {...register('price', { valueAsNumber: true })}
                      type="number"
                      min={0}
                      placeholder="e.g. 199"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-3">
            {fields.map((field, index) => (
              <QuestionCard
                key={field.id}
                index={index}
                register={register}
                control={control}
                remove={remove}
                errors={errors}
              />
            ))}

            <button
              type="button"
              onClick={() =>
                append({ text: '', options: ['', ''], correctOptionIndex: 0, order: fields.length })
              }
              className="w-full border-2 border-dashed border-slate-200 hover:border-green-400 text-slate-500 hover:text-green-600 rounded-xl py-3 text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
            {errors.questions?.root && (
              <p className="text-xs text-red-500">{errors.questions.root.message}</p>
            )}
          </div>

          {/* Submit */}
          <div className="sticky bottom-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 rounded-xl text-sm shadow-lg transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {submitting ? 'Saving Exam...' : 'Save Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

