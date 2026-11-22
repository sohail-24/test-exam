import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginClient from './LoginClient';

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { email?: string; registered?: string };
}) {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    if (session.user.role === 'SUPER_ADMIN') {
      redirect('/super-master');
    }
    if (session.user.role === 'TENANT_ADMIN' && session.user.tenantId) {
      const orgName = session.user.orgName || 'Portal';
      redirect(`/admin?tenant=${session.user.tenantId}&org=${encodeURIComponent(orgName)}`);
    }
  }

  return (
    <LoginClient
      initialEmail={searchParams?.email}
      justRegistered={searchParams?.registered === 'true'}
    />
  );
}
