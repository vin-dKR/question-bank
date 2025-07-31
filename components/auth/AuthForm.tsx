'use client';

import Link from 'next/link';
import { EmailPasswordForm } from './EmailPasswordForm';
import { OtpVerificationForm } from './OtpVerificationForm';
import { SocialSignInButtons } from './SocialSignInButtons';
import { useCustomAuth } from '@/hooks/auth';
import { LoadingOverlay } from '../Loader';

type AuthMode = 'signin' | 'signup';

interface AuthFormProps {
    mode: AuthMode;
}

export default function AuthForm({ mode }: AuthFormProps) {
    const {
        email,
        setEmail,
        password,
        setPassword,
        otp,
        setOtp,
        error,
        loading,
        showOtpInput,
        isLoaded,
        signInWith,
        handleEmailPasswordSubmit,
        handleOtpSubmit,
    } = useCustomAuth(mode);

    // Text and labels based on mode and loading state
    const title = mode === 'signin' ? 'Welcome Back' : 'Create Your Account';
    const description = mode === 'signin' ? 'Sign in to access your account' : 'Get started with your new account';
    const otpDescription = mode === 'signin' ? 'Enter the OTP sent to your phone' : 'Enter the OTP sent to your email';
    const alternativeActionText = mode === 'signin' ? 'New to our platform?' : 'Already have an account?';
    const alternativeActionLink = mode === 'signin' ? '/auth/signup' : '/auth/signin';
    const alternativeActionLabel = mode === 'signin' ? 'Create new account' : 'Sign in instead';

    if (!isLoaded) return <LoadingOverlay />

    console.log(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
                            <p className="text-gray-600 mt-2">{description}</p>
                        </div>

                        <div className="cf-turnstile" data-sitekey={process.env.TURNSTILE_SITE_KEY}></div>

                        {!showOtpInput ? (
                            <>
                                <EmailPasswordForm
                                    email={email}
                                    setEmail={setEmail}
                                    password={password}
                                    setPassword={setPassword}
                                    mode={mode}
                                    error={error}
                                    loading={loading}
                                    isLoaded={isLoaded}
                                    handleSubmit={handleEmailPasswordSubmit}
                                />

                                <div className="relative mb-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white text-gray-500">Or continue with providers</span>
                                    </div>
                                </div>

                                <SocialSignInButtons signInWith={signInWith} loading={loading} isLoaded={isLoaded} />
                            </>
                        ) : (
                            <OtpVerificationForm
                                otp={otp}
                                setOtp={setOtp}
                                error={error}
                                loading={loading}
                                isLoaded={isLoaded}
                                handleSubmit={handleOtpSubmit}
                                otpDescription={otpDescription}
                            />
                        )}

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">{alternativeActionText}</span>
                                </div>
                            </div>

                            <div className="mt-4 text-center">
                                <Link
                                    href={alternativeActionLink}
                                    className="inline-flex items-center justify-center w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
                                >
                                    {alternativeActionLabel}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        By {mode === 'signin' ? 'signing in' : 'signing up'}, you agree to our{' '}
                        <a href="#" className="text-indigo-600 hover:text-indigo-500">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="text-indigo-600 hover:text-indigo-500">
                            Privacy Policy
                        </a>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}
