import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function RootRedirectPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === 'SUPER_ADMIN') {
    redirect('/super-master');
  }

  redirect('/super-master-login');
}
