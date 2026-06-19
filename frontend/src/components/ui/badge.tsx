import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export const Badge = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
    <span
        className={cn(
            "inline-flex items-center rounded-md bg-rose-800 px-2 py-1 text-xs font-bold text-white",
            className,
        )}
        {...props}
    />
);
