'use client';

import { useState, useCallback } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps {
    password: string;
    setPassword: (value: string) => void;
    autoComplete: string;
}

export function PasswordInput({ password, setPassword, autoComplete }: PasswordInputProps) {
    const [showPass, setShowPass] = useState(false);

    const toggleShow = useCallback(() => {
        if (!password) {
            setShowPass(false);
            return;
        }
        setShowPass(prev => !prev);
    }, [password]);

    return (
        <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
            </label>
            <div className='relative'>
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                    id="password"
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    required
                    autoComplete={autoComplete}
                    className="w-full pl-10 px-4 py-3 text-gray-700 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-describedby="password-toggle"
                />
            </div>

            <button
                id="password-toggle"
                type="button"
                className="absolute right-4 bottom-2 text-black/40 rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                onClick={toggleShow}
                aria-label={showPass ? 'Hide password' : 'Show password'}
            >
                {showPass ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
            </button>
        </div>
    );
}
