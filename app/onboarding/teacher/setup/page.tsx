"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useOnboardingStore } from "@/store/userInitialSelectedState";
import {
    FormInput,
    FormSelect,
    SubmitButton,
    OnboardingLayout,
} from "@/components/onboarding/FormComponents";
import { Label } from "@/components/ui/label";
import { School } from "lucide-react";
import { useOnboardingForm } from "@/hooks/onboarding/useOnboardingForm";
import { usePrefillFromSession } from "@/hooks/onboarding/usePrefillFromSession";
import { subjects, experienceOptions, studentCountOptions } from "@/constant/on-boarding/teacher"
import { getJoinedOrganization } from "@/actions/onBoarding/joinedOrganization"

export default function TeacherSetupPage() {
    const router = useRouter();
    const onboarding = useOnboardingStore((state) => state.onboarding);
    const setData = useOnboardingStore((state) => state.setData);

    // `undefined` = still checking whether they arrived by invitation.
    const [joinedOrg, setJoinedOrg] = useState<
        { name: string; type: string; role: string } | null | undefined
    >(undefined);

    useEffect(() => {
        let cancelled = false;
        getJoinedOrganization()
            .then((org) => {
                if (!cancelled) setJoinedOrg(org);
            })
            .catch(() => {
                if (!cancelled) setJoinedOrg(null);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!onboarding || onboarding.role !== "teacher") {
            router.push("/onboarding/user-type");
        }
    }, [onboarding, router]);

    // Name and email come from the session — don't make them retype what they
    // just signed in with.
    usePrefillFromSession({ nameField: "name", emailField: "email" });

    const teacherData = (onboarding?.data as TeacherOnboardingData) || {
        name: "",
        email: "",
        school: "",
        subject: "",
        experience: "",
        studentCount: "",
    };


    const validateForm = () => {
        if (!teacherData.name.trim()) return "Full name is required.";
        if (!teacherData.email.trim() || !/\S+@\S+\.\S+/.test(teacherData.email))
            return "A valid email is required.";
        // An invitee never sees the school field — their institution is already
        // named, and requiring them to retype it would be asking them to name
        // somebody else's organization.
        if (!joinedOrg && !teacherData.school.trim())
            return "School or institution name is required.";
        if (!teacherData.subject) return "Please select one subject.";
        if (!teacherData.experience) return "Please select your teaching experience.";
        return null;
    };

    const createFormData = (data: TeacherOnboardingData, role: UserRole) => {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("email", data.email);
        // For an invitee this is their institution's real name, so TeacherData
        // stays truthful. It is NOT used to name an organization — the guard in
        // provisionOrganizationForOnboarding adopts the org they were invited to
        // rather than creating one.
        formData.append("school", joinedOrg?.name ?? data.school);
        formData.append("subject", data.subject);
        if (data.experience) formData.append("experience", data.experience);
        if (data.studentCount) formData.append("studentCount", data.studentCount);
        formData.append("role", role)
        return formData;
    };

    const { loading, handleSubmit } = useOnboardingForm(
        "teacher",
        teacherData,
        validateForm,
        (data) => createFormData(data, "teacher")
    );

    const handleInputChange = (field: keyof TeacherOnboardingData, value: string) => {
        setData({ [field]: value });
    };

    if (!onboarding || joinedOrg === undefined) {
        return null;
    }

    return (
        <OnboardingLayout
            title="Set up your teacher profile"
            description="Help us understand your teaching needs so we can provide the best question recommendations."
        >
            <form onSubmit={handleSubmit}>
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
                    {joinedOrg ? (
                        <div className="space-y-2">
                            <Label>School/Institution</Label>
                            <div className="flex w-80 items-center gap-2 rounded-md border border-black/10 bg-black/2 px-3 py-2">
                                <School className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                                <span className="truncate text-sm text-zinc-900">
                                    {joinedOrg.name}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500">
                                You were invited to this institution, so there&apos;s nothing
                                to set up.
                            </p>
                        </div>
                    ) : (
                        <FormInput
                            id="school"
                            name="school"
                            value={teacherData.school}
                            onChange={(value) => handleInputChange("school", value)}
                            placeholder="Enter your school or institution name"
                            label="School/Institution Name"
                            isRequired
                        />
                    )}
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
            </form>
        </OnboardingLayout>
    )
}
