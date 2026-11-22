import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LegacyNewTenantRedirect() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/super-master-login');
  }

  redirect('/super-master/tenants/new');
}
