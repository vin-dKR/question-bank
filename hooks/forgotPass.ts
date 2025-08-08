'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn } from '@clerk/nextjs';

export const useForgotPass = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const { isLoaded, signIn, setActive } = useSignIn();
    const router = useRouter();


    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setError('');
        setLoading(true);

        try {
            // Initiate the password reset flow with OTP
            await signIn.create({
                strategy: 'reset_password_email_code',
                identifier: email,
            });

            setOtpSent(true);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setError('');
        setLoading(true);

        try {
            const result = await signIn.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code: otp,
                password: newPassword,
            });

            if (result.status === 'complete') {
                setSuccess(true);
                setActive({ session: result.createdSessionId });
                setTimeout(() => router.push('/'), 2000);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (!isLoaded) return;

        setError('');
        setLoading(true);

        try {
            await signIn?.create({
                strategy: 'reset_password_email_code',
                identifier: email,
            });
            setError('');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            setLoading(false);
        }
    };


    return {
        otp,
        setOtp,
        email,
        setEmail,
        newPassword,
        setNewPassword,
        error,
        setError,
        success,
        setSuccess,
        loading,
        setLoading,
        otpSent,
        setOtpSent,
        isLoaded,
        setActive,
        handleResendOTP,
        handleRequestOTP,
        handleVerifyOTP
    }
}
