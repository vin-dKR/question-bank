import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground hover:bg-primary-glow hover:shadow-medium hover:-translate-y-0.5 active:translate-y-0",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline:
                    "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:shadow-soft",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-soft",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                hero: "bg-gradient-primary text-primary-foreground hover:shadow-large hover:-translate-y-1 active:translate-y-0 text-base font-semibold",
                navigation:
                    "text-foreground hover:text-primary transition-colors duration-200",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 px-4",
                lg: "h-11 px-8",
                icon: "h-10 w-10",
            },
            radius: {
                default: "rounded-xl",
                sm: "rounded-md",
                lg: "rounded-2xl",
                full: "rounded-full",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
            radius: "default",
        },
    }
);


function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean
    }) {
    const Comp = asChild ? Slot : "button"

    return (
        <Comp
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    )
}

export { Button, buttonVariants }
