import { GraduationCap, Users, School } from "lucide-react";

export const userTypes = [
    {
        icon: Users,
        title: "Student",
        description: "I want to practice with authentic exam questions",
        features: ["Practice tests", "Progress tracking", "Performance insights"],
        href: "/onboarding/student/setup",
        popular: false,
        roleKey: "student",
    },
    {
        icon: GraduationCap,
        title: "Individual Teacher",
        description: "I'm a teacher looking to create better tests for my students",
        features: ["Quick test creation", "PDF templates", "Basic analytics"],
        href: "/onboarding/teacher/setup",
        popular: true,
        roleKey: "teacher",
    },
    {
        icon: School,
        title: "Coaching Center",
        description: "I run a coaching center and need to scale test creation",
        features: ["Bulk operations", "OMR scanning", "Multi-teacher access"],
        href: "/onboarding/institute/setup",
        popular: false,
        roleKey: "coaching",
    },
] as const;
