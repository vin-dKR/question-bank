"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { useOnboardingStore } from "@/store/userInitialSelectedState";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { completeOnboarding } from "@/actions/onBoarding/completeOnboarding";

export default function TeacherSetupPage() {
    const router = useRouter();
    const { user } = useUser();
    const [loading, setLoading] = useState<boolean>(false);

    // Access Zustand store
    const onboarding = useOnboardingStore((state) => state.onboarding);
    const setData = useOnboardingStore((state) => state.setData);

    // Redirect if not a teacher or onboarding is null
    if (!onboarding || onboarding.role !== "teacher") {
        router.push("/onboarding/user-type");
        return null;
    }

    const teacherData = onboarding.data as TeacherOnboardingData;

    const subjects = [
        { id: "physics", label: "Physics" },
        { id: "chemistry", label: "Chemistry" },
        { id: "mathematics", label: "Mathematics" },
        { id: "biology", label: "Biology" },
    ];

    const handleInputChange = (
        field: keyof TeacherOnboardingData,
        value: string | undefined
    ) => {
        setData({ [field]: value });
    };

    const validateForm = () => {
        if (!teacherData.name.trim()) return "Full name is required.";
        if (!teacherData.email.trim() || !/\S+@\S+\.\S+/.test(teacherData.email))
            return "A valid email is required.";
        if (!teacherData.school.trim()) return "School or institution name is required.";
        if (!teacherData.subject) return "Please select one subject.";
        if (!teacherData.experience) return "Please select your teaching experience.";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const error = validateForm();
        if (error) {
            toast("Sorry there is an Error", { description: error });
            setLoading(false);
            return;
        }

        // Debug log with fallback
        //console.log("-------------", onboarding?.data || "onboarding.data is undefined");

        // Simulate successful submission for testing
        toast("Success", { description: "Teacher profile submitted successfully!" });

        const formData = new FormData();
        formData.append("name", teacherData.name);
        formData.append("email", teacherData.email);
        formData.append("school", teacherData.school);
        formData.append("subject", teacherData.subject);
        if (teacherData.experience) formData.append("experience", teacherData.experience);
        if (teacherData.studentCount) formData.append("studentCount", teacherData.studentCount);

        const res = await completeOnboarding(formData);

        if (res?.message) {
            await user?.reload();
            router.push("/");
        } else if (res?.error) {
            toast("Sorry, Please try again.", { description: res.error });
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="mx-auto max-w-4xl px-6">
                <div className="mb-12">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="mb-4 bg-black/4 border border-black/5"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Set up your teacher profile
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Help us understand your teaching needs so we can provide the best question
                        recommendations.
                    </p>
                </div>

                <Card>
                    <CardHeader className="gap-0">
                        <CardTitle className="text-lg m-0">Teaching Information</CardTitle>
                        <CardDescription>
                            This helps us customize your question bank and test templates
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Full Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={teacherData.name}
                                        onChange={(e) => handleInputChange("name", e.target.value)}
                                        placeholder="Enter your full name"
                                        className="border border-black/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        Email <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={teacherData.email}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                        placeholder="Enter your email"
                                        className="border border-black/10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="school">
                                    School/Institution Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="school"
                                    name="school"
                                    value={teacherData.school}
                                    onChange={(e) => handleInputChange("school", e.target.value)}
                                    placeholder="Enter your school or institution name"
                                    className="border border-black/10"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="experience">
                                        Teaching Experience <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={teacherData.experience}
                                        onValueChange={(value) => handleInputChange("experience", value)}
                                    >
                                        <SelectTrigger className="border border-black/10">
                                            <SelectValue placeholder="Select experience" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white text-black border border-black/10">
                                            <SelectItem value="0-2">0-2 years</SelectItem>
                                            <SelectItem value="3-5">3-5 years</SelectItem>
                                            <SelectItem value="6-10">6-10 years</SelectItem>
                                            <SelectItem value="10+">10+ years</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {/* Hidden input for FormData */}
                                    <input
                                        type="hidden"
                                        name="experience"
                                        value={teacherData.experience ?? ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="student-count">Number of Students</Label>
                                    <Select
                                        value={teacherData.studentCount}
                                        onValueChange={(value) => handleInputChange("studentCount", value)}
                                    >
                                        <SelectTrigger className="border border-black/10">
                                            <SelectValue placeholder="Select range" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white text-black border border-black/10">
                                            <SelectItem value="1-20">1-20 students</SelectItem>
                                            <SelectItem value="21-50">21-50 students</SelectItem>
                                            <SelectItem value="51-100">51-100 students</SelectItem>
                                            <SelectItem value="100+">100+ students</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {/* Hidden input for FormData */}
                                    <input
                                        type="hidden"
                                        name="studentCount"
                                        value={teacherData.studentCount ?? ""}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject">
                                    Subject you teach <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={teacherData.subject}
                                    onValueChange={(value) => handleInputChange("subject", value)}
                                >
                                    <SelectTrigger className="border border-black/10">
                                        <SelectValue placeholder="Select subject" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white text-black border border-black/10">
                                        {subjects.map((subject) => (
                                            <SelectItem key={subject.id} value={subject.id}>
                                                {subject.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {/* Hidden input for FormData */}
                                <input
                                    type="hidden"
                                    name="subject"
                                    value={teacherData.subject ?? ""}
                                />
                            </div>

                            <div className="flex justify-end pt-6">
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="bg-black text-white rounded-xl disabled:opacity-50"
                                    disabled={loading}
                                >
                                    Complete Setup
                                    {loading ? (
                                        <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
