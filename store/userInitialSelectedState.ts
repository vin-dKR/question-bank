import { create } from "zustand";
import { persist } from "zustand/middleware";

type UserRole = "student" | "teacher" | "coaching";

type OnboardingData =
    | { role: "student"; data: StudentOnboardingData }
    | { role: "teacher"; data: TeacherOnboardingData }
    | { role: "coaching"; data: CoachingOnboardingData };

// ==== Zustand Store Interface ====
interface OnboardingStore {
    onboarding: OnboardingData | null;
    setRole: (role: UserRole) => void;
    setData: (
        data: Partial<StudentOnboardingData | TeacherOnboardingData | CoachingOnboardingData>
    ) => void;
    clearOnboarding: () => void;
}

// ==== Store Implementation ====
export const useOnboardingStore = create<OnboardingStore>()(
    persist(
        (set) => ({
            onboarding: null,
            setRole: (role) => {
                let emptyData: any;
                if (role === "student") {
                    emptyData = {
                        name: "",
                        email: "",
                        grade: "",
                        targetExam: "",
                        subjects: [],
                    };
                } else if (role === "teacher") {
                    emptyData = {
                        name: "",
                        email: "",
                        school: "",
                        subjects: [],
                        experience: undefined,
                    };
                } else {
                    emptyData = {
                        name: "",
                        email: "",
                        instituteName: "",
                        numTeachers: 0,
                        features: [],
                    };
                }
                set({ onboarding: { role, data: emptyData } });
            },

            setData: (data) =>
                set((state) => {
                    if (!state.onboarding) return {};

                    // Branch per role; update correct data type using partial merge
                    if (state.onboarding.role === "student") {
                        return {
                            onboarding: {
                                role: "student",
                                data: { ...state.onboarding.data, ...data } as StudentOnboardingData,
                            },
                        };
                    } else if (state.onboarding.role === "teacher") {
                        return {
                            onboarding: {
                                role: "teacher",
                                data: { ...state.onboarding.data, ...data } as TeacherOnboardingData,
                            },
                        };
                    } else if (state.onboarding.role === "coaching") {
                        return {
                            onboarding: {
                                role: "coaching",
                                data: { ...state.onboarding.data, ...data } as CoachingOnboardingData,
                            },
                        };
                    }
                    return {};
                }),

            clearOnboarding: () => set({ onboarding: null }),
        }),
        {
            name: "onboarding-storage",
            partialize: (state) => ({ onboarding: state.onboarding }),
        }
    )
);


