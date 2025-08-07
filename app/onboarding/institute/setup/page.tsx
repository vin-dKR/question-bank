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

export default function CoachingSetupPage() {
    const router = useRouter();
    const onboarding = useOnboardingStore((state) => state.onboarding);
    const setData = useOnboardingStore((state) => state.setData);

    useEffect(() => {
        if (!onboarding || onboarding.role !== "coaching") {
            console.log("Redirect check:", { onboarding, role: onboarding?.role });
            router.push("/onboarding/user-type");
        }
    }, [onboarding, router]);

    const coachingData = (onboarding?.data as CoachingOnboardingData) || {
        centerName: "",
        contactPerson: "",
        email: "",
        phone: "",
        location: "",
        teacherCount: "",
        studentCount: "",
        targetExams: [],
    };

    const exams = [
        { id: "jee-main", label: "JEE Main" },
        { id: "jee-advanced", label: "JEE Advanced" },
        { id: "neet", label: "NEET" },
        { id: "boards", label: "Board Exams" },
        { id: "foundation", label: "Foundation Courses" },
    ];

    const teacherCountOptions = [
        { value: "1-5", label: "1-5 teachers" },
        { value: "6-15", label: "6-15 teachers" },
        { value: "16-30", label: "16-30 teachers" },
        { value: "30+", label: "30+ teachers" },
    ];

    const studentCountOptions = [
        { value: "1-100", label: "1-100 students" },
        { value: "101-500", label: "101-500 students" },
        { value: "501-1000", label: "501-1000 students" },
        { value: "1000+", label: "1000+ students" },
    ];

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

    const createFormData = (data: CoachingOnboardingData, role: UserRole) => {
        const formData = new FormData();
        formData.append("role", "coaching");
        formData.append("centerName", data.centerName);
        formData.append("contactPerson", data.contactPerson);
        formData.append("email", data.email);
        formData.append("phone", data.phone);
        formData.append("location", data.location);
        if (data.teacherCount) formData.append("teacherCount", data.teacherCount);
        if (data.studentCount) formData.append("studentCount", data.studentCount);
        formData.append("targetExams", JSON.stringify(data.targetExams));
        formData.append("role", role)
        return formData;
    };

    const { loading, handleSubmit } = useOnboardingForm(
        "coaching",
        coachingData,
        validateForm,
        (data) => createFormData(data, "coaching")
    );

    const handleInputChange = (field: keyof CoachingOnboardingData, value: string) => {
        setData({ [field]: value });
    };

    const handleExamChange = (examId: string, checked: boolean) => {
        const newExams = checked
            ? [...coachingData.targetExams, examId]
            : coachingData.targetExams.filter((e) => e !== examId);
        setData({ targetExams: newExams });
    };

    if (!onboarding) {
        return null; // Prevent rendering UI until onboarding is loaded
    }

    return (
        <OnboardingLayout
            title="Set up your coaching center"
            description="Tell us about your coaching center so we can provide enterprise-level features and support."
        >
            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    <FormInput
                        id="center-name"
                        name="centerName"
                        value={coachingData.centerName}
                        onChange={(value) => handleInputChange("centerName", value)}
                        placeholder="Enter your coaching center name"
                        label="Coaching Center Name"
                        isRequired
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormInput
                            id="contact-person"
                            name="contactPerson"
                            value={coachingData.contactPerson}
                            onChange={(value) => handleInputChange("contactPerson", value)}
                            placeholder="Enter contact person name"
                            label="Contact Person"
                            isRequired
                        />
                        <FormInput
                            id="phone"
                            name="phone"
                            value={coachingData.phone}
                            onChange={(value) => handleInputChange("phone", value)}
                            placeholder="Enter phone number"
                            label="Phone Number"
                            isRequired
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormInput
                            id="email"
                            name="email"
                            type="email"
                            value={coachingData.email}
                            onChange={(value) => handleInputChange("email", value)}
                            placeholder="Enter email address"
                            label="Email"
                            isRequired
                        />
                        <FormInput
                            id="location"
                            name="location"
                            value={coachingData.location}
                            onChange={(value) => handleInputChange("location", value)}
                            placeholder="City, State"
                            label="Location"
                            isRequired
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormSelect
                            id="teacher-count"
                            name="teacherCount"
                            value={coachingData.teacherCount}
                            onChange={(value) => handleInputChange("teacherCount", value)}
                            placeholder="Select range"
                            label="Number of Teachers"
                            options={teacherCountOptions}
                        />
                        <FormSelect
                            id="student-count"
                            name="studentCount"
                            value={coachingData.studentCount}
                            onChange={(value) => handleInputChange("studentCount", value)}
                            placeholder="Select range"
                            label="Number of Students"
                            options={studentCountOptions}
                        />
                    </div>
                    <FormCheckboxGroup
                        name="targetExams"
                        label="Target Exams"
                        options={exams}
                        values={coachingData.targetExams}
                        onChange={handleExamChange}
                        isRequired
                    />
                    <div className="flex justify-end pt-6">
                        <SubmitButton loading={loading} />
                    </div>
                </div>
            </form>
        </OnboardingLayout>
    );
}
