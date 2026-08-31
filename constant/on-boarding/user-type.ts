import { GraduationCap, School } from "lucide-react";

/**
 * Onboarding paths.
 *
 * STUDENT IS DELIBERATELY ABSENT. Students exist in the product, but as roster
 * rows created by the teacher via the examination/OMR flow — not as accounts
 * that sign themselves up (docs/WORKOS_MIGRATION_APPROACH.md §2, §3). The
 * `Student` model, `StudentData` and the /onboarding/student/setup route are
 * all still in place for when student logins are switched on for online tests;
 * this list is simply the set of people who can self-onboard today.
 *
 * Both remaining paths silently create an Organization. The user is never shown
 * the word "organization" — a solo teacher just fills in their details and gets
 * one named after their school.
 */
export const userTypes = [
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
