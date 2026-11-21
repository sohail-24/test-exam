'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

interface QuestionDb {
  id: string;
  correctOptionIndex: number;
}

export async function submitExamAction(
  examId: string,
  tenantId: string,
  userId: string,
  questions: QuestionDb[],
  answers: { questionId: string; selectedIndex: number | null }[],
  timeTakenSeconds: number = 0,
) {
  let score = 0;
  for (const q of questions) {
    const ans = answers.find((a) => a.questionId === q.id);
    if (ans?.selectedIndex === q.correctOptionIndex) score++;
  }

  const result = await prisma.result.create({
    data: {
      tenantId,
      userId,
      examId,
      score,
      totalMarks: questions.length,
      answers,
      timeTaken: Math.round(timeTakenSeconds),
    },
  });

  redirect(`/student/results/${result.id}`);
}

