import { useState } from "react";
import { toast } from "sonner";
import { completeOnboarding } from "@/actions/onBoarding/completeOnboarding";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export function useOnboardingForm<T extends OnboardingData>(
    role: UserRole,
    data: T,
    validateForm: () => string | null,
    createFormData: (data: T) => FormData
) {
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();
    const { user } = useUser();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const error = validateForm();
        if (error) {
            toast("Sorry there is an Error", { description: error });
            setLoading(false);
            return;
        }


        // Simulate successful submission for testing
        toast("Success", { description: `${role.charAt(0).toUpperCase() + role.slice(1)} profile submitted successfully!` });

        const formData = createFormData(data);

        const res = await completeOnboarding(formData);

        if (res?.message) {
            console.log("passed")
            await user?.reload();
            router.push("/");
        } else if (res?.error) {
            toast("Sorry, Please try again...", { description: res.error });
        }

        setLoading(false);
    };

    return { loading, handleSubmit };
}
