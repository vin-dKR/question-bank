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


export default function CoachingSetupPage() {
    const router = useRouter();
    const { user } = useUser();
    const [loading, setLoading] = useState<boolean>(false);

    // Access Zustand store
    const onboarding = useOnboardingStore((state) => state.onboarding);
    const setData = useOnboardingStore((state) => state.setData);

    // Redirect if not a coaching role or onboarding is null
    if (!onboarding || onboarding.role !== "coaching") {
        router.push("/onboarding/user-type");
        return null;
    }

    const coachingData = onboarding.data as CoachingOnboardingData;

    const exams = [
        { id: "jee-main", label: "JEE Main" },
        { id: "jee-advanced", label: "JEE Advanced" },
        { id: "neet", label: "NEET" },
        { id: "boards", label: "Board Exams" },
        { id: "foundation", label: "Foundation Courses" },
    ];

    const handleInputChange = (
        field: keyof CoachingOnboardingData,
        value: string | undefined
    ) => {
        setData({ [field]: value });
    };

    const handleExamChange = (examId: string, checked: boolean) => {
        const newExams = checked
            ? [...coachingData.targetExams, examId]
            : coachingData.targetExams.filter((e) => e !== examId);
        setData({ targetExams: newExams });
    };

    const validateForm = () => {
        if (!coachingData.centerName.trim()) return "Coaching center name is required.";
        if (!coachingData.contactPerson.trim()) return "Contact person name is required.";
        if (!coachingData.email.trim() || !/\S+@\S+\.\S+/.test(coachingData.email))
            return "A valid email is required.";
        if (!coachingData.phone.trim()) return "Phone number is required.";
        if (!coachingData.location.trim()) return "Location is required.";
        if (coachingData.targetExams.length === 0)
            return "Please select at least one target exam.";
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
        toast("Success", { description: "Coaching center profile submitted successfully!" });

        const formData = new FormData();
        formData.append("centerName", coachingData.centerName);
        formData.append("contactPerson", coachingData.contactPerson);
        formData.append("email", coachingData.email);
        formData.append("phone", coachingData.phone);
        formData.append("location", coachingData.location);
        if (coachingData.teacherCount) formData.append("teacherCount", coachingData.teacherCount);
        if (coachingData.studentCount) formData.append("studentCount", coachingData.studentCount);
        formData.append("targetExams", JSON.stringify(coachingData.targetExams));

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
                        Set up your coaching center
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Tell us about your coaching center so we can provide enterprise-level
                        features and support.
                    </p>
                </div>

                <Card>
                    <CardHeader className="gap-0">
                        <CardTitle className="text-lg m-0">Coaching Center Information</CardTitle>
                        <CardDescription>
                            This helps us set up the right features for your institution
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                            <div className="space-y-2">
                                <Label htmlFor="center-name">
                                    Coaching Center Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="center-name"
                                    name="centerName"
                                    value={coachingData.centerName}
                                    onChange={(e) => handleInputChange("centerName", e.target.value)}
                                    placeholder="Enter your coaching center name"
                                    className="border border-black/10"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="contact-person">
                                        Contact Person <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="contact-person"
                                        name="contactPerson"
                                        value={coachingData.contactPerson}
                                        onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                                        placeholder="Enter contact person name"
                                        className="border border-black/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">
                                        Phone Number <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={coachingData.phone}
                                        onChange={(e) => handleInputChange("phone", e.target.value)}
                                        placeholder="Enter phone number"
                                        className="border border-black/10"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        Email <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={coachingData.email}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                        placeholder="Enter email address"
                                        className="border border-black/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">
                                        Location <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="location"
                                        name="location"
                                        value={coachingData.location}
                                        onChange={(e) => handleInputChange("location", e.target.value)}
                                        placeholder="City, State"
                                        className="border border-black/10"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="teacher-count">Number of Teachers</Label>
                                    <Select
                                        value={coachingData.teacherCount}
                                        onValueChange={(value) => handleInputChange("teacherCount", value)}
                                    >
                                        <SelectTrigger className="border border-black/10">
                                            <SelectValue placeholder="Select range" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white text-black border border-black/10">
                                            <SelectItem value="1-5">1-5 teachers</SelectItem>
                                            <SelectItem value="6-15">6-15 teachers</SelectItem>
                                            <SelectItem value="16-30">16-30 teachers</SelectItem>
                                            <SelectItem value="30+">30+ teachers</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {/* Hidden input for FormData */}
                                    <input
                                        type="hidden"
                                        name="teacherCount"
                                        value={coachingData.teacherCount ?? ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="student-count">Number of Students</Label>
                                    <Select
                                        value={coachingData.studentCount}
                                        onValueChange={(value) => handleInputChange("studentCount", value)}
                                    >
                                        <SelectTrigger className="border black/10">
                                            <SelectValue placeholder="Select range" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white text-black border black/10">
                                            <SelectItem value="1-100">1-100 students</SelectItem>
                                            <SelectItem value="101-500">101-500 students</SelectItem>
                                            <SelectItem value="501-1000">501-1000 students</SelectItem>
                                            <SelectItem value="1000+">1000+ students</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {/* Hidden input for FormData */}
                                    <input
                                        type="hidden"
                                        name="studentCount"
                                        value={coachingData.studentCount ?? ""}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>
                                    Target Exams <span className="text-red-500">*</span>
                                </Label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {exams.map((exam) => (
                                        <div key={exam.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={exam.id}
                                                checked={coachingData.targetExams.includes(exam.id)}
                                                onCheckedChange={(checked) => handleExamChange(exam.id, checked as boolean)}
                                            />
                                            <Label htmlFor={exam.id} className="text-sm font-normal">
                                                {exam.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {/* Hidden input for FormData */}
                                <input
                                    type="hidden"
                                    name="targetExams"
                                    value={JSON.stringify(coachingData.targetExams) ?? "[]"}
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
    );
}
