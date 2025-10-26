'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import AuthForm from '@/components/AuthForm';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'signin';
  const redirect = searchParams.get('redirect') || '/dashboard';

  const handleAuthSuccess = (user: any) => {
    // Redirect to intended page or dashboard after successful authentication
    router.push(redirect);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        <AuthForm 
          onAuthSuccess={handleAuthSuccess}
          initialMode={mode === 'signup' ? 'signup' : 'signin'}
        />
      </div>
    </div>
  );
}
