'use client';

import { useState } from 'react';
import { useSignIn, useSignUp, useSession } from '@clerk/nextjs';
import { OAuthStrategy } from "@clerk/types"
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';

type AuthMode = 'signin' | 'signup';

export const useCustomAuth = (mode: AuthMode) => {
    const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
    const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
    const { session } = useSession();
    const router = useRouter();
    const { signOut } = useClerk()

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);

    const isLoaded = mode === 'signin' ? isSignInLoaded : isSignUpLoaded;

    const signInWith = (strategy: OAuthStrategy) => {
        if (mode === 'signin') {
            if (!signIn) {
                setError('Sign in service not ready');
                return;
            }
            return signIn.authenticateWithRedirect({
                strategy,
                redirectUrl: '/auth/sso-callback',
                redirectUrlComplete: '/',
            });
        } else {
            if (!signUp) {
                setError('Sign up service not ready');
                return;
            }
            return signUp.authenticateWithRedirect({
                strategy,
                redirectUrl: '/auth/sso-callback',
                redirectUrlComplete: '/',
            });
        }
    };

    const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) {
            setError('Authentication service not ready');
            return;
        }

        setError('');
        setLoading(true);

        try {
            if (mode === 'signin') {
                if (!signIn) throw new Error('Sign in service not available');
                const result = await signIn.create({
                    identifier: email,
                    password: password,
                });

                if (result.status === 'needs_second_factor') {
                    await signIn.prepareSecondFactor({
                        strategy: 'phone_code',
                    });
                    setShowOtpInput(true);
                } else if (result.status === 'complete' && setSignInActive) {
                    await setSignInActive({ session: result.createdSessionId });
                    router.push("/")
                }
            } else {
                if (!signUp) throw new Error('Sign up service not available');
                const result = await signUp.create({
                    emailAddress: email,
                    password: password,
                });

                if (result.status === 'missing_requirements') {
                    await signUp.prepareEmailAddressVerification();
                    setShowOtpInput(true);
                } else if (result.status === 'complete' && setSignUpActive) {
                    await setSignUpActive({ session: result.createdSessionId });
                }
            }
        } catch (err: any) {
            if (err.errors?.[0]?.code === 'single_session_mode') {
                await signOut();

                setError('You can only be signed in on one device at a time. Please sign out elsewhere first.');
            }
            setError(err.errors?.[0]?.message || err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) {
            setError('Authentication service not ready');
            return;
        }

        setError('');
        setLoading(true);

        try {
            if (mode === 'signin') {
                if (!signIn || !setSignInActive) throw new Error('Sign in service not available');
                const result = await signIn.attemptSecondFactor({
                    strategy: 'phone_code',
                    code: otp,
                });

                if (result.status === 'complete') {
                    await setSignInActive({ session: result.createdSessionId });
                    router.push("/")
                }
            } else {
                if (!signUp || !setSignUpActive) throw new Error('Sign up service not available');
                const result = await signUp.attemptEmailAddressVerification({
                    code: otp,
                });

                if (result.status === 'complete') {
                    await setSignUpActive({ session: result.createdSessionId });
                    router.push("/")
                }
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.message || err.message || 'Verification failed');
        } finally {
            setLoading(false);
            // router.push("/")
        }
    };

    return {
        session,
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
        router
    };
};
