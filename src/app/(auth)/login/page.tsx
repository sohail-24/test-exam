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
    const tenantId = session.user.tenantId || 'demo-tenant';
    const orgName = session.user.orgName || 'Portal';
    redirect(`/admin?tenant=${tenantId}&org=${encodeURIComponent(orgName)}`);
  }

  return (
    <LoginClient
      initialEmail={searchParams?.email}
      justRegistered={searchParams?.registered === 'true'}
    />
  );
}
