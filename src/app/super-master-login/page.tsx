import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import SuperMasterLoginClient from './SuperMasterLoginClient';

export default async function SuperMasterLoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === 'SUPER_ADMIN') {
    redirect('/super-master');
  }

  return <SuperMasterLoginClient />;
}
