'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Suspense } from 'react';

function SSOCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      console.log('OAuth Error:', error, errorDescription);

      let errorMessage = 'Sign in failed. Please try again.';
      if (error === 'access_denied') {
        errorMessage = 'Sign in was cancelled. Please try again if you want to continue.';
      } else if (error === 'invalid_request') {
        errorMessage = 'Invalid sign in request. Please try again.';
      } else if (error === 'server_error') {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (errorDescription) {
        errorMessage = errorDescription;
      }

      toast.error('Sign In Failed', {
        description: errorMessage,
        duration: 5000,
      });

      setTimeout(() => {
        router.push('/auth/signup');
      }, 2000);
    }
  }, [searchParams, router]);

  return null;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Completing sign in...</p>
        </div>
        <AuthenticateWithRedirectCallback
          signInForceRedirectUrl="/"
          signUpForceRedirectUrl="/onboarding/user-type"
        />
        <SSOCallbackContent />
      </div>
    </Suspense>
  );
}