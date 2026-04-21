'use client';

import { PasswordInput } from './PasswordInput';
import { ErrorMessage } from './ErrorMessage';
import { Mail } from 'lucide-react';
import Link from 'next/link';

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
                    <label htmlFor="email" className="block text-xs font-medium text-zinc-600 mb-1.5">
                        Email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            className="w-full h-10 pl-9 pr-3 text-sm text-zinc-900 rounded-lg border border-black/10 bg-white placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
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
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-zinc-300 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-600">
                            Remember me
                        </label>
                    </div>
                    <div className="text-sm">
                        <Link href="/auth/forgot-pass" className="font-medium text-indigo-600 hover:text-indigo-700">
                            Forgot password?
                        </Link>
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={loading || !isLoaded}
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        {submitText}
                    </span>
                ) : (
                    submitText
                )}
            </button>
        </form>
    );
}
