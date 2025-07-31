'use client';

import { ErrorMessage } from './ErrorMessage';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
        <Card>
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center tracking-3">Verification Required</CardTitle>
                <CardDescription className="text-center tracking-3 text-black/50">{otpDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <ErrorMessage error={error} />

                    <div className="space-y-2 tracking-3">
                        <Label htmlFor="otp">Verification Code</Label>
                        <Input
                            id="otp"
                            type="text"
                            placeholder="123456"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="text-center text-lg tracking-widest border-black/20"
                            autoComplete="one-time-code"
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full bg-black/80 hover:bg-black text-white tracking-3" disabled={loading || !isLoaded}>
                        {verifyText}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
