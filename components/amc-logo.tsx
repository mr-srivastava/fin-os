import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { amcInitials, amcLogoPath } from "@/lib/amc-logos";
import { cn } from "@/lib/utils";

interface AmcLogoProps {
  amc: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

/** Renders the AMC's logo when one is sourced locally, otherwise an initials badge. */
export function AmcLogo({ amc, size = "sm", className }: AmcLogoProps) {
  const logoPath = amcLogoPath(amc);

  return (
    <Avatar size={size} className={cn("bg-muted", className)}>
      {logoPath ? (
        <AvatarImage
          src={logoPath}
          alt={`${amc} logo`}
          className="grayscale-[85%] contrast-125 transition-[filter] duration-200 group-hover:grayscale-0"
        />
      ) : null}
      <AvatarFallback>{amcInitials(amc)}</AvatarFallback>
    </Avatar>
  );
}
