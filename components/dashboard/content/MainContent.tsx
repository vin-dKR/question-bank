interface MainContentProps {
    children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
    return <main className="relative flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 lg:p-8">{children}</main>;
}
