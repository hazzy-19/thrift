import type { DetailsHTMLAttributes, HTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export const Accordion = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("divide-y divide-rose-100 rounded-lg border border-rose-100 bg-white", className)} {...props} />
);

export const AccordionItem = ({ className, ...props }: DetailsHTMLAttributes<HTMLDetailsElement>) => (
    <details className={cn("group", className)} {...props} />
);

export const AccordionTrigger = ({ className, children, ...props }: HTMLAttributes<HTMLElement>) => (
    <summary
        className={cn(
            "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-pine marker:hidden",
            className,
        )}
        {...props}
    >
        {children}
        <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
    </summary>
);

export const AccordionContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("px-4 pb-4 text-sm leading-6 text-pine/70", className)} {...props} />
);
