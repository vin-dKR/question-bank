import { PageContainer } from "./PageContainer";

interface MainContentProps {
    children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
    return (
        <main
            id="main-content"
            className="shell-gutters relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain py-4 sm:py-5 lg:py-6"
        >
            <PageContainer>{children}</PageContainer>
        </main>
    );
}
