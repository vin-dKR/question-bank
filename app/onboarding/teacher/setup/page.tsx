"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/userInitialSelectedState";
import { FormInput, FormSelect, SubmitButton, OnboardingLayout } from "@/components/onboarding/FormComponents";
import { useOnboardingForm } from "@/hooks/onboarding/useOnboardingForm";

export default function TeacherSetupPage() {
    const router = useRouter();
    const onboarding = useOnboardingStore((state) => state.onboarding);
    const setData = useOnboardingStore((state) => state.setData);

    if (!onboarding || onboarding.role !== "teacher") {
        router.push("/onboarding/user-type");
        return null;
    }

    const teacherData = onboarding.data as TeacherOnboardingData;

    const subjects = [
        { value: "physics", label: "Physics" },
        { value: "chemistry", label: "Chemistry" },
        { value: "mathematics", label: "Mathematics" },
        { value: "biology", label: "Biology" },
    ];

    const experienceOptions = [
        { value: "0-2", label: "0-2 years" },
        { value: "3-5", label: "3-5 years" },
        { value: "6-10", label: "6-10 years" },
        { value: "10+", label: "10+ years" },
    ];

    const studentCountOptions = [
        { value: "1-20", label: "1-20 students" },
        { value: "21-50", label: "21-50 students" },
        { value: "51-100", label: "51-100 students" },
        { value: "100+", label: "100+ students" },
    ];

    const validateForm = () => {
        if (!teacherData.name.trim()) return "Full name is required.";
        if (!teacherData.email.trim() || !/\S+@\S+\.\S+/.test(teacherData.email))
            return "A valid email is required.";
        if (!teacherData.school.trim()) return "School or institution name is required.";
        if (!teacherData.subject) return "Please select one subject.";
        if (!teacherData.experience) return "Please select your teaching experience.";
        return null;
    };

    const createFormData = (data: TeacherOnboardingData) => {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("email", data.email);
        formData.append("school", data.school);
        formData.append("subject", data.subject);
        if (data.experience) formData.append("experience", data.experience);
        if (data.studentCount) formData.append("studentCount", data.studentCount);
        return formData;
    };

    const { loading, handleSubmit } = useOnboardingForm("teacher", teacherData, validateForm, createFormData);

    const handleInputChange = (field: keyof TeacherOnboardingData, value: string) => {
        setData({ [field]: value });
    };

    return (
        <OnboardingLayout
            title="Set up your teacher profile"
            description="Help us understand your teaching needs so we can provide the best question recommendations."
        >
            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput
                        id="name"
                        name="name"
                        value={teacherData.name}
                        onChange={(value) => handleInputChange("name", value)}
                        placeholder="Enter your full name"
                        label="Full Name"
                        isRequired
                    />
                    <FormInput
                        id="email"
                        name="email"
                        type="email"
                        value={teacherData.email}
                        onChange={(value) => handleInputChange("email", value)}
                        placeholder="Enter your email"
                        label="Email"
                        isRequired
                    />
                </div>
                <FormInput
                    id="school"
                    name="school"
                    value={teacherData.school}
                    onChange={(value) => handleInputChange("school", value)}
                    placeholder="Enter your school or institution name"
                    label="School/Institution Name"
                    isRequired
                />
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormSelect
                        id="experience"
                        name="experience"
                        value={teacherData.experience}
                        onChange={(value) => handleInputChange("experience", value)}
                        placeholder="Select experience"
                        label="Teaching Experience"
                        options={experienceOptions}
                        isRequired
                    />
                    <FormSelect
                        id="student-count"
                        name="studentCount"
                        value={teacherData.studentCount}
                        onChange={(value) => handleInputChange("studentCount", value)}
                        placeholder="Select range"
                        label="Number of Students"
                        options={studentCountOptions}
                    />
                </div>
                <FormSelect
                    id="subject"
                    name="subject"
                    value={teacherData.subject}
                    onChange={(value) => handleInputChange("subject", value)}
                    placeholder="Select subject"
                    label="Subject you teach"
                    options={subjects}
                    isRequired
                />
                <div className="flex justify-end pt-6">
                    <SubmitButton loading={loading} />
                </div>
            </div>
        </OnboardingLayout>
    );
}
