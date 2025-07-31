'use client'

import Link from 'next/link';
import { EmailPasswordForm } from './EmailPasswordForm';
import { OtpVerificationForm } from './OtpVerificationForm';
import { SocialSignInButtons } from './SocialSignInButtons';
import { useCustomAuth } from '@/hooks/auth';
import { LoadingOverlay } from '../Loader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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

    const title = mode === 'signin' ? 'Welcome Back' : 'Create Account';
    const description = mode === 'signin' ? 'Sign in to access your account' : 'Enter your information to create your account'
    const otpDescription = mode === 'signin' ? 'Enter the OTP sent to your phone' : 'Enter the OTP sent to your email';
    const alternativeActionText = mode === 'signin' ? 'New to our platform?' : 'Already have an account?';
    const alternativeActionLink = mode === 'signin' ? '/auth/signup' : '/auth/signin';
    const alternativeActionLabel = mode === 'signin' ? 'Create new account' : 'Sign in instead';

    if (!isLoaded) return <LoadingOverlay />;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 tracking-3">
            <div className="w-full max-w-md mx-auto">
                {!showOtpInput ? (
                    <Card>
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-2xl text-center">{title}</CardTitle>
                            <CardDescription className="text-center text-black/50">{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SocialSignInButtons signInWith={signInWith} loading={loading} isLoaded={isLoaded} />

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-black/10" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-muted-foreground text-black/30">Or continue with</span>
                                </div>
                            </div>

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

                            <div id="clerk-captcha" />

                        </CardContent>
                        <CardFooter>
                            <p className="text-center text-sm text-muted-foreground w-full">
                                {alternativeActionText}{' '}
                                <Link href={alternativeActionLink} className="text-primary hover:underline font-bold">
                                    {alternativeActionLabel}
                                </Link>
                            </p>
                        </CardFooter>
                    </Card>
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
            </div>
        </div>
    );
}

