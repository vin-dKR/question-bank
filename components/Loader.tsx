'use client';

import { useEffect, useState } from 'react';

export const FancyLoader = ({
    size = 'md',
    variant = 'primary',
    className = '',
}: {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'light';
    className?: string;
}) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => (prev >= 100 ? 0 : prev + 10));
        }, 200);

        return () => clearInterval(interval);
    }, []);

    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-10 w-10',
        lg: 'h-16 w-16',
    };

    const variantClasses = {
        primary: 'text-indigo-600',
        secondary: 'text-gray-600',
        success: 'text-green-600',
        danger: 'text-red-600',
        light: 'text-white',
    };

    return (
        <div className={`relative ${sizeClasses[size]} ${className}`}>
            {/* Animated spinner */}
            <div
                className={`absolute inset-0 rounded-full border-4 border-t-transparent ${variantClasses[variant]} animate-spin`}
                style={{ animationDuration: '1s' }}
            ></div>

            {/* Pulsing dots */}
            <div className="absolute inset-0 flex items-center justify-center">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className={`absolute rounded-full ${variantClasses[variant]}`}
                        style={{
                            width: size === 'sm' ? '3px' : size === 'md' ? '4px' : '6px',
                            height: size === 'sm' ? '3px' : size === 'md' ? '4px' : '6px',
                            transform: `rotate(${i * 120}deg) translateY(${size === 'sm' ? '-8px' : size === 'md' ? '-12px' : '-18px'})`,
                            opacity: progress / 100,
                            animation: `pulse 1.5s infinite ${i * 0.3}s`,
                        }}
                    />
                ))}
            </div>

            {/* Optional progress text (for larger sizes) */}
            {size === 'lg' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xs font-bold ${variantClasses[variant]}`}>
                        {progress}%
                    </span>
                </div>
            )}

            {/* CSS for pulse animation */}
            <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
        </div>
    );
};

// Full-screen loading overlay component
export const LoadingOverlay = ({ text = 'Loading...' }: { text?: string }) => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <FancyLoader size="lg" variant="light" />
            <p className="mt-4 text-lg font-medium text-white">{text}</p>
        </div>
    );
};

// Loading button component
export const LoadingButton = ({
    isLoading,
    children,
    className = '',
    variant = 'primary',
    ...props
}: {
    isLoading: boolean;
    children: React.ReactNode;
    className?: string;
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    const variantClasses = {
        primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
        success: 'bg-green-600 hover:bg-green-700 text-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white',
    };

    return (
        <button
            className={`relative flex items-center justify-center rounded-lg px-4 py-2 font-medium transition-all duration-200 ${variantClasses[variant]} ${className}`}
            disabled={isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <div className="absolute">
                        <FancyLoader size="sm" variant="light" />
                    </div>
                    <span className="opacity-0">{children}</span>
                </>
            ) : (
                children
            )}
        </button>
    );
};
