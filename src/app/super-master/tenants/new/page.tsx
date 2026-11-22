import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NewTenantClient from './NewTenantClient';

export default async function NewTenantPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/super-master-login');
  }

  return <NewTenantClient />;
}
