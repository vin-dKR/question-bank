"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { userTypes } from "@/constant/on-boarding/user-type";
import { useCallback, useState, useTransition } from "react";
import { useOnboardingStore } from "@/store/userInitialSelectedState";

export default function UserTypePage() {
    const router = useRouter();
    const setRole = useOnboardingStore((state) => state.setRole);
    const [isPending, startTransition] = useTransition();
    const [loadingRole, setLoadingRole] = useState<string | null>(null);


    // Optimized navigation with prefetching and immediate navigation
    const onContinueClick = useCallback((role: "student" | "teacher" | "coaching", href: string) => {
        setLoadingRole(role);

        setRole(role);

        startTransition(() => {
            router.push(href);
        });
    }, [setRole, router]);

    const handleCardHover = useCallback((href: string) => {
        router.prefetch(href);
    }, [router]);

    const handleBackClick = useCallback(() => {
        startTransition(() => {
            router.back();
        });
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-50 py-12 tracking-3">
            <div className="mx-auto max-w-4xl px-6">
                <div className="mb-12">
                    <Button
                        variant="ghost"
                        onClick={handleBackClick}
                        className="mb-4 bg-black/4 border border-black/5"
                        disabled={isPending}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Tell us about yourself</h1>
                    <p className="mt-2 text-gray-600">
                        This helps us customize your experience and show you the most relevant features.
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                    {userTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                            <Card
                                key={type.title}
                                className={`relative flex flex-col h-full cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-black/20 rounded-2xl ${type.popular ? "ring-2 ring-black border-black" : "border-black/5"
                                    }`}
                                onMouseEnter={() => handleCardHover(type.href)}
                                onClick={() => onContinueClick(type.roleKey, type.href)}
                            >
                                {type.popular && (
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-medium">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-black/5 border border-black/8 p-2">
                                            <Icon className="h-5 w-5 text-black" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{type.title}</CardTitle>
                                        </div>
                                    </div>
                                    <CardDescription className="mt-2">{type.description}</CardDescription>
                                </CardHeader>

                                <CardContent className="pt-0 flex-1 flex flex-col">
                                    <ul className="space-y-2 text-sm text-gray-600 mb-6">
                                        {type.features.map((feature) => (
                                            <li key={feature} className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-black" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-auto">
                                        <Button
                                            className="w-full bg-black rounded-xl text-white"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onContinueClick(type.roleKey, type.href);
                                            }}
                                            disabled={loadingRole === type.roleKey}
                                        >
                                            {loadingRole === type.roleKey ? "Loading..." : `Continue as ${type.title}`}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
