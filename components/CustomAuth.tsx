'use client';

import Link from 'next/link';
import { useCustomAuth } from '@/hooks/auth';
import { FancyLoader, LoadingOverlay } from './Loader';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

type AuthMode = 'signin' | 'signup';

interface AuthFormProps {
    mode: AuthMode;
}

export default function AuthForm({ mode }: AuthFormProps) {
    const [showPass, setShowPass] = useState(false)

    const {
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
    } = useCustomAuth(mode);


    const onChangeEye = () => {
        if (!password) {
            setShowPass(false)
        }
        setShowPass(prev => !prev)
    }

    if (!isLoaded) return <LoadingOverlay />;

    const title = mode === 'signin' ? 'Welcome Back' : 'Create Your Account';
    const description = mode === 'signin'
        ? 'Sign in to access your account'
        : 'Get started with your new account';
    const submitText = mode === 'signin'
        ? loading ? 'Signing in...' : 'Sign in'
        : loading ? 'Creating account...' : 'Create account';
    const verifyText = loading ? 'Verifying...' : 'Verify Code';
    const otpDescription = mode === 'signin'
        ? 'Enter the OTP sent to your phone'
        : 'Enter the OTP sent to your email';
    const alternativeActionText = mode === 'signin'
        ? 'New to our platform?'
        : 'Already have an account?';
    const alternativeActionLink = mode === 'signin'
        ? '/auth/signup'
        : '/auth/signin';
    const alternativeActionLabel = mode === 'signin'
        ? 'Create new account'
        : 'Sign in instead';

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
                            <p className="text-gray-600 mt-2">{description}</p>
                        </div>

                        {!showOtpInput ? (
                            <form className="space-y-6" onSubmit={handleEmailPasswordSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            className="w-full px-4 py-3 text-gray-700 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200"
                                            placeholder="your@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className='relative'>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPass ? "text" : "password"}
                                            required
                                            className="w-full px-4 py-3 text-gray-700 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <div className='absolute right-4 bottom-2 text-gray-700 cursor-pointer'>
                                            <div className='bg-gray-800/20 rounded-lg p-1' onClick={onChangeEye}>
                                                {showPass ? <EyeOff className='h-6 w-6' /> : <Eye className='h-6 w-6' />}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                                        {error}
                                    </div>
                                )}

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
                                            <Link href="/auth/forgot-pass" className="font-medium text-indigo-600 hover:text-indigo-500">
                                                Forgot password?
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                <div id="clerk-captcha" />

                                <button
                                    type="submit"
                                    disabled={loading || !isLoaded}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <FancyLoader size="sm" variant="light" />
                                            {submitText}
                                        </span>
                                    ) : submitText}
                                </button>

                                <div className="relative mb-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white text-gray-500">
                                            Or continue with providers
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-row space-y-4 mb-6 items-center justify-center gap-6">
                                    <button
                                        onClick={() => signInWith('oauth_google')}
                                        disabled={loading || !isLoaded}
                                        className="w-10 h-10 my-auto flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 disabled:opacity-50"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                    </button>

                                    <button
                                        onClick={() => signInWith('oauth_apple')}
                                        disabled={loading}
                                        className="w-10 h-10 flex items-center justify-center gap-2 bg-black text-white rounded-lg shadow-sm text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-200 disabled:opacity-50"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form className="space-y-6" onSubmit={handleOtpSubmit}>
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
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !isLoaded}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-gray-700 font-medium py-3 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <FancyLoader size="sm" variant="light" />
                                            {verifyText}
                                        </span>
                                    ) : verifyText}
                                </button>
                            </form>
                        )}

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">
                                        {alternativeActionText}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 text-center">
                                <Link
                                    href={alternativeActionLink}
                                    className="inline-flex items-center justify-center w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
                                >
                                    {alternativeActionLabel}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        By {mode === 'signin' ? 'signing in' : 'signing up'}, you agree to our{' '}
                        <a href="#" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a> and{' '}
                        <a href="#" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>.
                    </p>
                </div>
            </div>
        </div>
    );
}
