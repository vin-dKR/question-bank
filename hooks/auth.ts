'use client';

import { useState } from 'react';
import { useSignIn, useSignUp, useSession } from '@clerk/nextjs';
import { OAuthStrategy } from "@clerk/types";
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';

type AuthMode = 'signin' | 'signup';

function getClerkError(err: any): string {
    return (
        err?.errors?.[0]?.message ||
        err?.message ||
        'Something went wrong, please try again'
    );
}

export const useCustomAuth = (mode: AuthMode) => {
    const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
    const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
    const { session } = useSession();
    const router = useRouter();
    const { signOut } = useClerk();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);

    const isLoaded = mode === 'signin' ? isSignInLoaded : isSignUpLoaded;

    const signInWith = async (strategy: OAuthStrategy) => {
        setLoading(true);
        setError('');
        const authObj = mode === 'signin' ? signIn : signUp;
        if (!authObj) {
            setError(
                mode === 'signin' ? 'Sign in service not ready' : 'Sign up service not ready'
            );
            setLoading(false);
            return;
        }

        try {
            await authObj.authenticateWithRedirect({
                strategy,
                redirectUrl: '/auth/sso-callback',
                redirectUrlComplete: '/',
            });
        } catch (err: any) {
            setError(getClerkError(err));
            setLoading(false);
        }
    };

    // ### Email/Password ###
    const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) {
            setError('Authentication service not ready');
            return;
        }

        if (!email.trim()) {
            setError('Email is required');
            return;
        }

        if (!password.trim()) {
            setError('Password is required');
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
                console.log("mode: signin")

                if (result.status === 'needs_second_factor') {
                    console.log("mode: needs_second_factor")
                    await signIn.prepareSecondFactor({
                        strategy: 'phone_code',
                    });
                    setShowOtpInput(true);
                } else if (result.status === 'complete' && setSignInActive) {
                    console.log("mode: complete")
                    await setSignInActive({ session: result.createdSessionId });
                    router.push('/');
                    return; // Avoid setLoading after redirect
                }
            } else {
                if (!signUp) throw new Error('Sign up service not available');
                console.log("mode: !signUp")
                const result = await signUp.create({
                    emailAddress: email,
                    password: password,
                });
                console.log("mode: !result")

                if (result.status === 'missing_requirements') {
                    console.log("mode: missing_requirements")
                    await signUp.prepareEmailAddressVerification();
                    setShowOtpInput(true);
                } else if (result.status === 'complete' && setSignUpActive) {
                    console.log("mode: !complete")
                    await setSignUpActive({ session: result.createdSessionId });
                    router.push('/');
                    return;
                }
                console.log("mode: !done")
            }
        } catch (err: any) {
            console.log("mode: cathc")
            if (err?.errors?.[0]?.code === 'single_session_mode') {
                await signOut();
                setError('You can only be signed in on one device at a time. Please sign out elsewhere first.');
            } else {
                setError(getClerkError(err));
            }
        } finally {
            setLoading(false);
        }
    };


    // ### OTP ###
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
                    router.push('/');
                    return;
                }
            } else {
                if (!signUp || !setSignUpActive) throw new Error('Sign up service not available');
                const result = await signUp.attemptEmailAddressVerification({
                    code: otp,
                });

                if (result.status === 'complete') {
                    await setSignUpActive({ session: result.createdSessionId });
                    router.push('/');
                    return;
                }
            }
        } catch (err: any) {
            setError(getClerkError(err));
        } finally {
            setLoading(false);
        }
    };

    return {
        session,
        email, setEmail,
        password, setPassword,
        otp, setOtp,
        error,
        loading,
        showOtpInput,
        isLoaded,
        signInWith,
        handleEmailPasswordSubmit,
        handleOtpSubmit,
        router,
    };
};
