import AuthRedirect from "@/components/authRedirect";
import AuthForm from "@/components/CustomAuth";

export default function Page() {
    return (
        <>
            <AuthRedirect />
            <AuthForm mode='signin' />
        </>
    )
}
