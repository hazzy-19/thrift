import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "icon";
};

const variants = {
    default: "bg-pine text-white hover:bg-wine",
    outline: "border border-rose-200 bg-white text-pine hover:bg-rose-50",
    ghost: "bg-transparent text-pine hover:bg-rose-50",
};

const sizes = {
    default: "h-11 px-4 py-2",
    icon: "h-10 w-10 p-0",
};

export const Button = ({ className, variant = "default", size = "default", ...props }: ButtonProps) => (
    <button
        className={cn(
            "inline-flex items-center justify-center rounded-md text-sm font-bold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2",
            variants[variant],
            sizes[size],
            className,
        )}
        {...props}
    />
);
