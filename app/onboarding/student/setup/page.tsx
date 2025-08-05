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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { useOnboardingStore } from "@/store/userInitialSelectedState";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { completeOnboarding } from "@/actions/onBoarding/completeOnboarding";


export default function StudentSetupPage() {
    const router = useRouter();
    const { user } = useUser();
    const [loading, setLoading] = useState<boolean>(false);

    // Access the full onboarding object
    const onboarding = useOnboardingStore((state) => state.onboarding);
    const setData = useOnboardingStore((state) => state.setData);

    // Make sure this page is only used for "student" role
    if (!onboarding || onboarding.role !== "student") {
        router.push("/onboarding/user-type");
        return null;
    }

    // Destructure student-specific data
    const studentData = onboarding.data as StudentOnboardingData;

    const targetExams = [
        { value: "jee-main", label: "JEE Main" },
        { value: "jee-advanced", label: "JEE Advanced" },
        { value: "neet", label: "NEET" },
        { value: "boards", label: "Board Exams" },
        { value: "multiple", label: "Multiple Exams" },
    ];

    const subjects = [
        { id: "physics", label: "Physics" },
        { id: "chemistry", label: "Chemistry" },
        { id: "mathematics", label: "Mathematics" },
        { id: "biology", label: "Biology" },
    ];

    const handleSubjectChange = (subjectId: string, checked: boolean) => {
        const newSubjects = checked
            ? [...studentData.subjects, subjectId]
            : studentData.subjects.filter((s) => s !== subjectId);
        setData({ subjects: newSubjects });
    };

    const handleInputChange = (
        field: keyof StudentOnboardingData,
        value: string
    ) => {
        setData({ [field]: value });
    };

    const validateForm = () => {
        if (!studentData.name.trim()) return "Full name is required.";
        if (!studentData.email.trim() || !/\S+@\S+\.\S+/.test(studentData.email))
            return "A valid email is required.";
        if (!studentData.grade) return "Please select your current grade.";
        if (!studentData.targetExam) return "Please select your target exam.";
        if (studentData.subjects.length === 0)
            return "Please select at least one subject.";
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

        // console.log("-------------", onboarding?.data || "onboarding.data is undefined");
        // Simulate successful submission for testing
        toast("Success", { description: "Student profile submitted successfully!" });

        const formData = new FormData();
        formData.append("name", studentData.name);
        formData.append("email", studentData.email);
        formData.append("grade", studentData.grade);
        formData.append("targetExam", studentData.targetExam);
        formData.append("subjects", JSON.stringify(studentData.subjects));

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
        <div className="min-h-screen bg-gray-50 py-12 tracking-3">
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
                        Set up your student profile
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Help us personalize your learning experience with the right questions and
                        difficulty level.
                    </p>
                </div>

                <Card>
                    <CardHeader className="gap-0">
                        <CardTitle className="text-lg m-0">Personal Information</CardTitle>
                        <CardDescription className="text-sm m-0">
                            This information helps us customize your practice sessions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Full Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={studentData.name}
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
                                        value={studentData.email}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                        placeholder="Enter your email"
                                        className="border border-black/10"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="grade">
                                        Current Grade/Class <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={studentData.grade}
                                        onValueChange={(value) => handleInputChange("grade", value)}
                                    >
                                        <SelectTrigger className="border border-black/10">
                                            <SelectValue placeholder="Select your grade" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white text-black border border-black/10">
                                            <SelectItem value="11">Class 11</SelectItem>
                                            <SelectItem value="12">Class 12</SelectItem>
                                            <SelectItem value="12-pass">12th Pass</SelectItem>
                                            <SelectItem value="dropper">Dropper</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {/* Hidden input for FormData */}
                                    <input
                                        type="hidden"
                                        name="grade"
                                        value={studentData.grade ?? ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="target-exam">
                                        Target Exam <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={studentData.targetExam}
                                        onValueChange={(value) => handleInputChange("targetExam", value)}
                                    >
                                        <SelectTrigger className="border border-black/10">
                                            <SelectValue placeholder="Select target exam" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white text-black border border-black/10">
                                            {targetExams.map((exam) => (
                                                <SelectItem key={exam.value} value={exam.value}>
                                                    {exam.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {/* Hidden input for FormData */}
                                    <input
                                        type="hidden"
                                        name="targetExam"
                                        value={studentData.targetExam ?? ""}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>
                                    Subjects you want to practice <span className="text-red-500">*</span>
                                </Label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {subjects.map((subject) => (
                                        <div key={subject.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={subject.id}
                                                checked={studentData.subjects.includes(subject.id)}
                                                onCheckedChange={(checked) =>
                                                    handleSubjectChange(subject.id, checked as boolean)
                                                }
                                            />
                                            <Label htmlFor={subject.id} className="text-sm font-normal">
                                                {subject.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {/* Hidden input for FormData */}
                                <input
                                    type="hidden"
                                    name="subjects"
                                    value={JSON.stringify(studentData.subjects) ?? "[]"}
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
