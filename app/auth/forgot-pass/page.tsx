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
            <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50">
                <div className="w-full max-w-md bg-white rounded-xl border border-black/5 shadow-sm p-8 text-center">
                    <div className="mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold tracking-tight text-zinc-900 mb-2">Password Reset Successful</h1>
                    <p className="text-sm text-zinc-500">
                        Your password has been updated. Redirecting to dashboard...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50">
            <div className="w-full max-w-md bg-white rounded-xl border border-black/5 shadow-sm">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
                            {otpSent ? 'Enter OTP & New Password' : 'Reset Your Password'}
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1.5">
                            {otpSent
                                ? `We've sent a 6-digit OTP to ${email}`
                                : 'Enter your email to receive an OTP'}
                        </p>
                    </div>

                    {!otpSent ? (
                        <form className="space-y-5" onSubmit={handleRequestOTP}>
                            <div>
                                <label htmlFor="email" className="block text-xs font-medium text-zinc-600 mb-1.5">
                                    Email Address
                                </label>

                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        className="w-full h-10 pl-9 pr-3 text-sm text-zinc-900 rounded-lg border border-black/10 bg-white placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-rose-50 text-rose-700 border border-rose-100 p-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <LoadingButton
                                type="submit"
                                isLoading={loading}
                                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
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
                        <form className="space-y-5" onSubmit={handleVerifyOTP}>
                            <div>
                                <label htmlFor="otp" className="block text-xs font-medium text-zinc-600 mb-1.5">
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
                                    className="w-full h-12 px-4 text-zinc-900 rounded-lg border border-black/10 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition text-center tracking-widest text-xl"
                                    placeholder="• • • • • •"
                                    value={otp}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtp(value);
                                    }}
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-xs font-medium text-zinc-600 mb-1.5">
                                    New Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    minLength={8}
                                    className="w-full h-10 px-3 text-sm text-zinc-900 rounded-lg border border-black/10 bg-white placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <p className="mt-1.5 text-xs text-zinc-500">
                                    Must be at least 8 characters
                                </p>
                            </div>

                            {error && (
                                <div className="bg-rose-50 text-rose-700 border border-rose-100 p-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <LoadingButton
                                type="submit"
                                isLoading={loading}
                                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
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
                                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm disabled:opacity-50"
                                >
                                    {`Didn't receive OTP? Resend`}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <Link
                            href="/auth/signin"
                            className="text-zinc-500 hover:text-zinc-900 text-sm"
                        >
                            Remember your password? <span className="text-indigo-600 hover:text-indigo-700 font-medium">Sign in</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
