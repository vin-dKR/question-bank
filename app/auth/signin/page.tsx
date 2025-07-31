import AuthRedirect from "@/components/authRedirect";
import AuthForm from "@/components/auth/AuthForm";

export default function Page() {
    return (
        <>
            <AuthRedirect />
            <AuthForm mode='signin' />
        </>
    )
}
