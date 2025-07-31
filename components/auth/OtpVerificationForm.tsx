'use client';

import { ErrorMessage } from './ErrorMessage';

interface OtpVerificationFormProps {
    otp: string;
    setOtp: (code: string) => void;
    error?: string;
    loading: boolean;
    isLoaded: boolean;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    otpDescription: string;
}

export function OtpVerificationForm({
    otp,
    setOtp,
    error,
    loading,
    isLoaded,
    handleSubmit,
    otpDescription,
}: OtpVerificationFormProps) {
    const verifyText = loading ? 'Verifying...' : 'Verify Code';

    return (
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Verification Required</h2>
                <p className="text-gray-600 mt-1">{otpDescription}</p>
            </div>

            <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code
                </label>
                <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-lg border text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 text-center text-lg tracking-widest"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    autoComplete="one-time-code"
                />
            </div>

            <ErrorMessage error={error} />

            <button
                type="submit"
                disabled={loading || !isLoaded}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-gray-700 font-medium py-3 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="loader" /> {/* Replace with your FancyLoader or similar */}
                        {verifyText}
                    </span>
                ) : (
                    verifyText
                )}
            </button>
        </form>
    );
}
