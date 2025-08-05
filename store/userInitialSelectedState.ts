import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useOnboardingStore = create<OnboardingStore>()(
    persist(
        (set) => ({
            onboarding: null,
            setRole: (role: UserRole) => {
                const emptyDataMap: Record<UserRole, OnboardingData> = {
                    student: {
                        name: "",
                        email: "",
                        grade: "",
                        targetExam: "",
                        subjects: [],
                    } as StudentOnboardingData,
                    teacher: {
                        name: "",
                        email: "",
                        school: "",
                        subject: "",
                        experience: undefined,
                        studentCount: undefined,
                    } as TeacherOnboardingData,
                    coaching: {
                        centerName: "",
                        contactPerson: "",
                        email: "",
                        phone: "",
                        location: "",
                        teacherCount: undefined,
                        studentCount: undefined,
                        targetExams: [],
                    } as CoachingOnboardingData,
                };
                set({ onboarding: { role, data: emptyDataMap[role] } });
            },

            setData: (data: Partial<OnboardingData>) =>
                set((state) => {
                    if (!state.onboarding) return { onboarding: null };
                    return {
                        onboarding: {
                            ...state.onboarding,
                            data: { ...state.onboarding.data, ...data },
                        },
                    };
                }),

            clearOnboarding: () => set({ onboarding: null }),
        }),
        {
            name: "onboarding-storage",
            partialize: (state) => ({ onboarding: state.onboarding }),
        }
    )
)
