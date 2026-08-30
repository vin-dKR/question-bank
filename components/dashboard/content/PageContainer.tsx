import { cn } from "@/lib/utils";

type PageWidth = "default" | "form" | "full";

const widthClasses: Record<PageWidth, string> = {
    default: "max-w-[var(--shell-content-max)]",
    form: "max-w-4xl",
    full: "max-w-none",
};

interface PageContainerProps extends React.ComponentProps<"div"> {
    width?: PageWidth;
}

/**
 * Standard dashboard content boundary.
 *
 * Descendants can use named Tailwind container variants such as
 * `@5xl/page:grid-cols-2`, which respond to usable page width after the sidebar
 * and shell gutters instead of responding to the browser window.
 */
export function PageContainer({
    children,
    className,
    width = "default",
    ...props
}: PageContainerProps) {
    return (
        <div
            data-page-container=""
            className={cn("@container/page mx-auto w-full min-w-0", widthClasses[width], className)}
            {...props}
        >
            {children}
        </div>
    );
}
