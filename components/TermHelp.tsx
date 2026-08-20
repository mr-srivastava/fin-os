import { CircleHelpIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** A small help icon that shows a plain-language definition of a term on hover/focus. */
export function TermHelp({ definition, label }: { definition: string; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex align-middle text-muted-foreground"
        aria-label={`What is ${label}?`}
      >
        <CircleHelpIcon className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent>{definition}</TooltipContent>
    </Tooltip>
  );
}
