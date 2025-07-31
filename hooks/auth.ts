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
        console.log("signInWith called with strategy:", strategy);
        setLoading(true);
        setError('');
        const authObj = mode === 'signin' ? signIn : signUp;
        if (!authObj) {
            setError(
                mode === 'signin' ? 'Sign in service not ready' : 'Sign up service not ready'
            );
            setLoading(false);
            console.log("Auth object not ready");
            return;
        }

        try {
            console.log("Calling authenticateWithRedirect...");
            await authObj.authenticateWithRedirect({
                strategy,
                redirectUrl: '/auth/sso-callback',
                redirectUrlComplete: '/',
            });
            // Should redirect away here
            console.log("AuthenticateWithRedirect awaited successfully (but should redirect away)");
        } catch (err: any) {
            console.error("Error in authenticateWithRedirect:", err);
            setError(getClerkError(err));
            setLoading(false);
        }
    };

    const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("handleEmailPasswordSubmit called", { email, password, mode });

        if (!isLoaded) {
            setError('Authentication service not ready');
            console.log("Service not loaded");
            return;
        }
        if (!email.trim()) {
            setError('Email is required');
            console.log("Email is empty");
            return;
        }
        if (!password.trim()) {
            setError('Password is required');
            console.log("Password is empty");
            return;
        }

        setError('');
        setLoading(true);

        try {
            if (mode === 'signin') {
                console.log("Creating signIn session...");
                if (!signIn) throw new Error('Sign in service not available');
                const result = await signIn.create({
                    identifier: email,
                    password: password,
                });
                console.log("signIn.create result:", result);

                if (result.status === 'needs_second_factor') {
                    console.log("Needs second factor, preparing...");
                    await signIn.prepareSecondFactor({
                        strategy: 'phone_code',
                    });
                    setShowOtpInput(true);
                    console.log("showOtpInput set to true");
                } else if (result.status === 'complete' && setSignInActive) {
                    console.log("Sign in complete, setting active session...");
                    await setSignInActive({ session: result.createdSessionId });
                    router.push('/');
                    console.log("Redirecting to homepage");
                    return;
                }
            } else {
                console.log("Creating signUp user...");
                if (!signUp) throw new Error('Sign up service not available');
                const result = await signUp.create({
                    emailAddress: email,
                    password: password,
                });
                console.log("signUp.create result:", result);

                if (result.status === 'missing_requirements') {
                    console.log("Missing requirements, preparing email address verification...");
                    await signUp.prepareEmailAddressVerification();
                    setShowOtpInput(true);
                    console.log("showOtpInput set to true");
                } else if (result.status === 'complete' && setSignUpActive) {
                    console.log("Sign up complete, setting active session...");
                    await setSignUpActive({ session: result.createdSessionId });
                    router.push('/');
                    console.log("Redirecting to homepage");
                    return;
                }
            }
        } catch (err: any) {
            console.error("Error in handleEmailPasswordSubmit try catch:", err);
            if (err?.errors?.[0]?.code === 'single_session_mode') {
                await signOut();
                setError('You can only be signed in on one device at a time. Please sign out elsewhere first.');
                console.log("Single session mode error handled");
            } else {
                setError(getClerkError(err));
            }
        } finally {
            setLoading(false);
            console.log("Loading set to false");
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("handleOtpSubmit called", { otp, mode });

        if (!isLoaded) {
            setError('Authentication service not ready');
            console.log("Service not loaded");
            return;
        }
        setError('');
        setLoading(true);

        try {
            if (mode === 'signin') {
                if (!signIn || !setSignInActive) throw new Error('Sign in service not available');
                console.log("Attempting second factor sign in...");
                const result = await signIn.attemptSecondFactor({
                    strategy: 'phone_code',
                    code: otp,
                });
                console.log("Second factor attempt result:", result);

                if (result.status === 'complete') {
                    await setSignInActive({ session: result.createdSessionId });
                    router.push('/');
                    console.log("Redirecting to homepage after second factor");
                    return;
                }
            } else {
                if (!signUp || !setSignUpActive) throw new Error('Sign up service not available');
                console.log("Attempting email verification...");
                const result = await signUp.attemptEmailAddressVerification({
                    code: otp,
                });
                console.log("Email verification attempt result:", result);

                if (result.status === 'complete') {
                    await setSignUpActive({ session: result.createdSessionId });
                    router.push('/');
                    console.log("Redirecting to homepage after verification");
                    return;
                }
            }
        } catch (err: any) {
            console.error("Error in handleOtpSubmit try catch:", err);
            setError(getClerkError(err));
        } finally {
            setLoading(false);
            console.log("Loading set to false in OTP submit");
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
