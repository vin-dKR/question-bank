'use client';

import { PasswordInput } from './PasswordInput';
import { ErrorMessage } from './ErrorMessage';
import { Mail } from 'lucide-react';

interface EmailPasswordFormProps {
    email: string;
    setEmail: (email: string) => void;
    password: string;
    setPassword: (password: string) => void;
    mode: 'signin' | 'signup';
    error?: string;
    loading: boolean;
    isLoaded: boolean;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function EmailPasswordForm({
    email,
    setEmail,
    password,
    setPassword,
    mode,
    error,
    loading,
    isLoaded,
    handleSubmit,
}: EmailPasswordFormProps) {
    const submitText =
        mode === 'signin' ? (loading ? 'Signing in...' : 'Sign in') : loading ? 'Please wait for 30sec...' : 'Create account';

    return (
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
                <div className="relative">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    {/* Icon positioned absolutely */}
                    <div className='relative'>
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            className="w-full pl-10 pr-4 py-3 text-gray-700 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                {/* For password input, add icon inside PasswordInput component (recommended).
                    But if PasswordInput doesn't have icon, add same pattern here */}

                <PasswordInput
                    password={password}
                    setPassword={setPassword}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
            </div>

            <ErrorMessage error={error} />

            {mode === 'signin' && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                            Remember me
                        </label>
                    </div>
                    <div className="text-sm">
                        <a href="/auth/forgot-pass" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Forgot password?
                        </a>
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={loading || !isLoaded}
                className="w-full bg-black/80 hover:bg-black text-white font-medium py-3 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="loader" /> {/* Replace with your FancyLoader or similar */}
                        {submitText}
                    </span>
                ) : (
                    submitText
                )}
            </button>
        </form>
    );
}
