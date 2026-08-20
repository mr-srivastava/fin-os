import type { ReactElement, ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Marks a term as glossed, editorial-style: a dotted underline (not an icon) that solidifies and
 * tints brand on hover/focus to reveal its definition. Pass `render` to make an existing chip
 * (a `Badge` or `Button` that already renders the term) the trigger itself instead of adding
 * underline styling — a pill already reads as an affordance, so it only gains `cursor-help`.
 */
export function TermHelp({
  definition,
  children,
  render,
  className,
}: {
  definition: string;
  children: ReactNode;
  render?: ReactElement;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={render}
        className={cn(
          "cursor-help outline-none",
          !render &&
            "rounded-xs underline decoration-muted-foreground/50 decoration-dotted underline-offset-[3px] transition-colors hover:text-brand hover:decoration-brand hover:decoration-solid focus-visible:text-brand focus-visible:decoration-brand focus-visible:decoration-solid focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{definition}</TooltipContent>
    </Tooltip>
  );
}
