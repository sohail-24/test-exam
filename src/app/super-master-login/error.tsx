'use client';

import AuthErrorClient from '@/components/AuthErrorClient';

export default function SuperMasterErrorPage() {
  return (
    <AuthErrorClient
      portalTitle="Super Master Login"
      portalDescription="Sign in with platform owner credentials to manage institutes, plans, and portal access."
      brandColor="emerald"
      backLinkHref="/super-master-login"
      backLinkLabel="Back to Super Master Login"
    />
  );
}