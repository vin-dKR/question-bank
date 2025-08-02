'use client';

import Link from 'next/link';
import { FancyLoader, LoadingButton } from '@/components/Loader';
import { useForgotPass } from '@/hooks/forgotPass';
import { Mail } from 'lucide-react';

export default function ResetPasswordPage() {

    const {
        otp,
        setOtp,
        email,
        setEmail,
        newPassword,
        setNewPassword,
        error,
        success,
        loading,
        otpSent,
        handleResendOTP,
        handleRequestOTP,
        handleVerifyOTP
    } = useForgotPass()

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden p-8 text-center">
                    <div className="mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Password Reset Successful!</h1>
                    <p className="text-gray-600 mb-6">
                        Your password has been updated. Redirecting to dashboard...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 border border-black/20">
            <div className="w-full max-w-md bg-white rounded-xl border border-black/10 overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-800 tracking-3">
                            {otpSent ? 'Enter OTP & New Password' : 'Reset Your Password'}
                        </h1>
                        <p className="text-sm text-black/50 mt-2 tracking-3">
                            {otpSent
                                ? `We've sent a 6-digit OTP to ${email}`
                                : 'Enter your email to receive an OTP'}
                        </p>
                    </div>

                    {!otpSent ? (
                        <form className="space-y-6" onSubmit={handleRequestOTP}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 tracking-3">
                                    Email Address
                                </label>

                                <div className='relative'>
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        className="w-full pl-10 px-4 py-3 text-gray-700 tracking-3 rounded-lg border border-gray-300 focus:border-black focus:ring-2 focus:ring-black outline-none transition duration-200"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            <LoadingButton
                                type="submit"
                                isLoading={loading}
                                className="w-full bg-black/80 hover:bg-black text-white font-medium py-3 px-4 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition duration-200"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <FancyLoader size="sm" variant="light" />
                                        Sending OTP...
                                    </span>
                                ) : (
                                    'Send OTP'
                                )}
                            </LoadingButton>
                        </form>
                    ) : (
                        <form className="space-y-6" onSubmit={handleVerifyOTP}>
                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                                    6-Digit OTP
                                </label>
                                <input
                                    id="otp"
                                    name="otp"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]{6}"
                                    required
                                    maxLength={6}
                                    className="w-full px-4 py-3 text-gray-700 rounded-lg border border-gray-300 focus:border-black focus:ring-2 focus:ring-black outline-none transition duration-200 text-center tracking-widest text-2xl"
                                    placeholder="• • • • • •"
                                    value={otp}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtp(value);
                                    }}
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 tracking-3">
                                    New Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    minLength={8}
                                    className="w-full px-4 py-3 text-gray-700 rounded-lg border border-gray-300 focus:border-black focus:ring-2 focus:ring-black outline-none transition duration-200"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Must be at least 8 characters
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            <LoadingButton
                                type="submit"
                                isLoading={loading}
                                className="w-full bg-black/80 hover:bg-black text-white font-medium py-3 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition duration-200"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <FancyLoader size="sm" variant="light" />
                                        Verifying OTP...
                                    </span>
                                ) : (
                                    'Reset Password'
                                )}
                            </LoadingButton>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={loading}
                                    className="text-black/60 hover:text-black font-medium text-sm disabled:opacity-50 tracking-3"
                                >
                                    {`Didn't receive OTP? Resend`}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <Link
                            href="/auth/signin"
                            className="text-black/60 hover:underline font-medium text-sm tracking-3"
                        >
                            Remember your password? Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
