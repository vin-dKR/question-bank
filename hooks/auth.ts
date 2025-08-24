'use client';

import { useSignIn, useSignUp, useSession } from '@clerk/nextjs';
import { OAuthStrategy } from "@clerk/types";
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { useState } from 'react';
import { toast } from 'sonner';

type AuthMode = 'signin' | 'signup';

interface ClerkError {
    message?: string;
    errors?: Array<{ message?: string; code?: string }>;
    [key: string]: unknown;
}

function getClerkError(err: ClerkError): string {
    // Handle specific OAuth/authentication errors
    if (err.message) {
        const message = err.message.toLowerCase();

        // Common OAuth errors
        if (message.includes('access_denied')) {
            return 'Sign in was cancelled. Please try again to continue.';
        }
        if (message.includes('invalid_request')) {
            return 'Invalid sign in request. Please try again.';
        }
        if (message.includes('server_error') || message.includes('temporarily_unavailable')) {
            return 'Server is temporarily unavailable. Please try again later.';
        }
        if (message.includes('unauthorized_client')) {
            return 'This sign in method is not available. Please try a different method.';
        }
        if (message.includes('unsupported_response_type')) {
            return 'Sign in configuration error. Please contact support.';
        }
        if (message.includes('invalid_scope')) {
            return 'Permission error during sign in. Please try again.';
        }
        if (message.includes('account not found') || message.includes('user not found')) {
            return 'No account found with these credentials. Please sign up first.';
        }
        if (message.includes('webhook') || message.includes('database')) {
            return 'Account creation failed. Please try again or contact support.';
        }

        return err.message;
    }

    if (err.errors && err.errors.length > 0) {
        const firstError = err.errors[0].message || 'An error occurred';

        // Handle common Clerk error codes
        if (firstError.toLowerCase().includes('password')) {
            return 'Invalid password. Please check your password and try again.';
        }
        if (firstError.toLowerCase().includes('email')) {
            return 'Invalid email address. Please check your email and try again.';
        }

        return firstError;
    }

    return 'An unexpected error occurred. Please try again.';
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
            const errorMsg = mode === 'signin' ? 'Sign in service not ready' : 'Sign up service not ready';
            setError(errorMsg);
            toast.error('Service Error', {
                description: errorMsg,
                duration: 4000,
            });
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
        } catch (err: unknown) {
            console.error("Error in authenticateWithRedirect:", err);
            const errorMsg = getClerkError(err as ClerkError);
            setError(errorMsg);
            toast.error('Authentication Error', {
                description: errorMsg,
                duration: 5000,
            });
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
                    router.push('/dashboard');
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
                    router.push('/dashboard');
                    console.log("Redirecting to homepage");
                    return;
                }
            }
        } catch (err: unknown) {
            console.error("Error in handleEmailPasswordSubmit try catch:", err);
            const clerkErr = err as ClerkError;
            if (clerkErr?.errors?.[0]?.code === 'single_session_mode') {
                await signOut();
                setError('You can only be signed in on one device at a time. Please sign out elsewhere first.');
                console.log("Single session mode error handled");
            } else {
                setError(getClerkError(clerkErr));
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
                    router.push('/dashboard');
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
                    router.push('/dashboard');
                    console.log("Redirecting to homepage after verification");
                    return;
                }
            }
        } catch (err: unknown) {
            console.error("Error in handleOtpSubmit try catch:", err);
            setError(getClerkError(err as ClerkError));
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
