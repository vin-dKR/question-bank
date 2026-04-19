interface MainContentProps {
    children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
    return <main className="relative flex-1 overflow-y-auto p-6">{children}</main>;
}
