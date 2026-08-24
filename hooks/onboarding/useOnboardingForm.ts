import { useState } from "react";
import { toast } from "sonner";
import { completeOnboarding } from "@/actions/onBoarding/completeOnboarding";
import { useRouter } from "next/navigation";

export function useOnboardingForm<T extends OnboardingData>(
    role: UserRole,
    data: T,
    validateForm: () => string | null,
    createFormData: (data: T) => FormData
) {
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const error = validateForm();
        if (error) {
            toast.error("Validation Error", { description: error });
            setLoading(false);
            return;
        }

        const formData = createFormData(data);

        try {
            const res = await completeOnboarding(formData);

            if (res?.message) {
                console.log("Onboarding completed successfully");
                toast.success("Success", { 
                    description: `${role.charAt(0).toUpperCase() + role.slice(1)} profile submitted successfully!` 
                });
                // No session reload needed: onboarding state is `User.role` in
                // the database now, not a claim baked into the session token
                // (doc §6), so the next request already sees it.
                router.push("/dashboard");
            } else if (res?.error) {
                toast.error("Onboarding Error", { description: res.error });
            } else {
                toast.error("Unknown Error", { description: "An unexpected error occurred. Please try again." });
            }
        } catch (err) {
            console.error("Error in handleSubmit:", err);
            toast.error("Submission Error", { 
                description: err instanceof Error ? err.message : "Failed to submit. Please try again." 
            });
        } finally {
            setLoading(false);
        }
    };

    return { loading, handleSubmit };
}
