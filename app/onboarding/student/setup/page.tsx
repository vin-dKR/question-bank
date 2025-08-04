"use client";

import React from "react";
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
import { ArrowLeft, ArrowRight } from "lucide-react";

import { useOnboardingStore } from "@/store/userInitialSelectedState"
import { completeOnboarding } from "@/actions/onBoarding/completeOnboarding";
import { useUser } from "@clerk/nextjs";


export default function StudentSetupPage() {
    const router = useRouter();
    const { user } = useUser()

    // Access the full onboarding object
    const onboarding = useOnboardingStore((state) => state.onboarding);
    const setData = useOnboardingStore((state) => state.setData);

    // Make sure this page is only used for "student" role
    if (!onboarding || onboarding.role !== "student") {
        // Optionally redirect or show fallback UI here
        return <div>Please start onboarding as a Student to fill this form.</div>;
    }

    // Destructure student-specific data
    const studentData = onboarding.data;

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
        let newSubjects = checked
            ? [...studentData.subjects, subjectId]
            : studentData.subjects.filter((s) => s !== subjectId);

        setData({ subjects: newSubjects });
    };

    const handleInputChange = (field: keyof typeof studentData, value: any) => {
        setData({ [field]: value });
    };

    const handleSubmit = async (formData: FormData) => {
        const res = await completeOnboarding(formData)

        if (res?.message) {
            // Reloads the user's data from the Clerk API
            console.log("000000", onboarding)
            await user?.reload()
            router.push('/')
        }
        if (res?.error) {
            console.log(res?.error)
        }
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
                        Help us personalize your learning experience with the right
                        questions and difficulty level.
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
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={studentData.name}
                                        onChange={(e) => handleInputChange("name", e.target.value)}
                                        placeholder="Enter your full name"
                                        required
                                        className="border border-black/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        type="email"
                                        id="email"
                                        value={studentData.email}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                        placeholder="Enter your email"
                                        required
                                        className="border border-black/10"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="grade">Current Grade/Class</Label>
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
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="target-exam">Target Exam</Label>
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
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Subjects you want to practice</Label>
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
                            </div>

                            <div className="flex justify-end pt-6">
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="bg-black text-white rounded-xl"
                                >
                                    Complete Setup
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
