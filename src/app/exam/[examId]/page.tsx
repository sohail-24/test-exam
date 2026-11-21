import { notFound } from 'next/navigation';
import { getExamForStudent } from './actions';
import PublicExamClient from './PublicExamClient';

export default async function PublicExamPage({ params }: { params: { examId: string } }) {
  const { examId } = params;

  // Demo fallback for instant testing without database
  if (examId === 'demo' || examId.startsWith('demo')) {
    const demoExam = {
      id: examId,
      title: 'General Aptitude & Reasoning Mock Test',
      description: 'Official sample examination to test system compatibility and test engine UI.',
      durationMinutes: 15,
      isFree: true,
      price: 0,
      tenantName: 'LopyTech Academy',
      tenantId: 'demo-tenant',
      questions: [
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
      ],
    };

    return <PublicExamClient exam={demoExam} />;
  }

  const exam = await getExamForStudent(examId);
  if (!exam) notFound();

  return <PublicExamClient exam={exam} />;
}
