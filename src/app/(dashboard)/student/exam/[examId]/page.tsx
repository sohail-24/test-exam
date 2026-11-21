import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import ExamUI from '@/components/exam/ExamUI';
import { submitExamAction } from './actions';

export default async function ExamPage({ params }: { params: { examId: string } }) {
  const { examId } = params;

  // Demo exam fallback for instant testing without auth / DB setup
  if (examId === 'demo') {
    const demoQuestions = [
      {
        id: 'q1',
        text: 'Which data structure is primarily used to implement an LRU Cache efficiently?',
        options: ['Queue + Array', 'Doubly Linked List + Hash Map', 'Binary Search Tree', 'Stack + Hash Map'],
      },
      {
        id: 'q2',
        text: 'What is the average time complexity of lookups in an ideal Hash Table?',
        options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
      },
      {
        id: 'q3',
        text: 'In Next.js 14 App Router, what is the default rendering model for components?',
        options: ['Client Components', 'Server Components', 'Static Exports', 'Edge Workers'],
      },
      {
        id: 'q4',
        text: 'Which HTTP status code indicates successful resource creation?',
        options: ['200 OK', '201 Created', '204 No Content', '304 Not Modified'],
      },
      {
        id: 'q5',
        text: 'What ensures strict tenant isolation in a multi-tenant SaaS PostgreSQL database?',
        options: ['Unique index only', 'tenantId on all tables + scoped queries', 'Frontend URL routing', 'CSS namespaces'],
      },
    ];

    return (
      <ExamUI
        examId="demo"
        examTitle="SaaS Architecture & Web Development Exam"
        studentName="Demo Student"
        durationMinutes={30}
        questions={demoQuestions}
        onSubmit={async () => {
          'use server';
          redirect('/admin?submitted=true');
        }}
      />
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.tenantId) redirect('/login');
  if (!session.user.kycComplete) redirect('/student/kyc');

  const { tenantId, id: userId, name: studentName } = session.user;

  const exam = await prisma.exam.findFirst({
    where: { id: examId, tenantId, isPublished: true },
    include: { questions: { orderBy: { order: 'asc' } } },
  });

  if (!exam) notFound();

  // If paid, check for existing result or payment record (UI-only gate)
  const existingResult = await prisma.result.findFirst({
    where: { examId, userId, tenantId },
  });
  if (existingResult) redirect(`/student/results/${existingResult.id}`);

  const questions = exam.questions.map((q) => ({
    id: q.id,
    text: q.text,
    options: q.options as string[],
  }));

  return (
    <ExamUI
      examId={exam.id}
      examTitle={exam.title}
      studentName={studentName ?? 'Student'}
      durationMinutes={exam.durationMinutes}
      questions={questions}
      onSubmit={submitExamAction.bind(null, examId, tenantId, userId, exam.questions)}
    />
  );
}

