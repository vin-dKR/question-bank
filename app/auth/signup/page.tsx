import AuthRedirect from "@/componenets/authRedirect";
import AuthForm from "@/componenets/CustomAuth";

export default function Page() {
    return (
        <>
            <AuthRedirect />
            <AuthForm mode='signup' />
        </>
    )
}

