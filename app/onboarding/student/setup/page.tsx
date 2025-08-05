"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useOnboardingStore } from "@/store/userInitialSelectedState";
import {
    FormInput,
    FormSelect,
    FormCheckboxGroup,
    SubmitButton,
    OnboardingLayout,
} from "@/components/onboarding/FormComponents";
import { useOnboardingForm } from "@/hooks/onboarding/useOnboardingForm";

export default function StudentSetupPage() {
    const router = useRouter();
    const onboarding = useOnboardingStore((state) => state.onboarding);
    const setData = useOnboardingStore((state) => state.setData);

    useEffect(() => {
        if (!onboarding || onboarding.role !== "student") {
            router.push("/onboarding/user-type");
        }
    }, [onboarding, router]);

    const studentData = (onboarding?.data as StudentOnboardingData) || {
        name: "",
        email: "",
        grade: "",
        targetExam: "",
        subjects: [],
    };

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

    const gradeOptions = [
        { value: "11", label: "Class 11" },
        { value: "12", label: "Class 12" },
        { value: "12-pass", label: "12th Pass" },
        { value: "dropper", label: "Dropper" },
    ];

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

    const createFormData = (data: StudentOnboardingData) => {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("email", data.email);
        formData.append("grade", data.grade);
        formData.append("targetExam", data.targetExam);
        formData.append("subjects", JSON.stringify(data.subjects));
        return formData;
    };

    const { loading, handleSubmit } = useOnboardingForm(
        "student",
        studentData,
        validateForm,
        createFormData
    );

    const handleInputChange = (field: keyof StudentOnboardingData, value: string) => {
        setData({ [field]: value });
    };

    const handleSubjectChange = (subjectId: string, checked: boolean) => {
        const newSubjects = checked
            ? [...studentData.subjects, subjectId]
            : studentData.subjects.filter((s) => s !== subjectId);
        setData({ subjects: newSubjects });
    };

    if (!onboarding) {
        return null;
    }

    return (
        <OnboardingLayout
            title="Set up your student profile"
            description="Help us personalize your learning experience with the right questions and difficulty level."
        >
            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormInput
                            id="name"
                            name="name"
                            value={studentData.name}
                            onChange={(value) => handleInputChange("name", value)}
                            placeholder="Enter your full name"
                            label="Full Name"
                            isRequired
                        />
                        <FormInput
                            id="email"
                            name="email"
                            type="email"
                            value={studentData.email}
                            onChange={(value) => handleInputChange("email", value)}
                            placeholder="Enter your email"
                            label="Email"
                            isRequired
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormSelect
                            id="grade"
                            name="grade"
                            value={studentData.grade}
                            onChange={(value) => handleInputChange("grade", value)}
                            placeholder="Select your grade"
                            label="Current Grade/Class"
                            options={gradeOptions}
                            isRequired
                        />
                        <FormSelect
                            id="target-exam"
                            name="targetExam"
                            value={studentData.targetExam}
                            onChange={(value) => handleInputChange("targetExam", value)}
                            placeholder="Select target exam"
                            label="Target Exam"
                            options={targetExams}
                            isRequired
                        />
                    </div>
                    <FormCheckboxGroup
                        name="subjects"
                        label="Subjects you want to practice"
                        options={subjects}
                        values={studentData.subjects}
                        onChange={handleSubjectChange}
                        isRequired
                    />
                    <div className="flex justify-end pt-6">
                        <SubmitButton loading={loading} />
                    </div>
                </div>
            </form>
        </OnboardingLayout>
    )
}
