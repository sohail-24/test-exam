import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ExamBuilderClient from './ExamBuilderClient';

export default async function NewExamPage({
  searchParams,
}: {
  searchParams?: { tenant?: string; org?: string };
}) {
  const session = await getServerSession(authOptions);
  const tenantId = searchParams?.tenant || session?.user?.tenantId || undefined;

  return <ExamBuilderClient tenantId={tenantId} />;
}
