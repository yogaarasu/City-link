import { cn } from "@/lib/utils";

interface HamburgerIconProps {
  className?: string;
}

export const HamburgerIcon = ({ className }: HamburgerIconProps) => {
  return (
    <span className={cn("relative block h-4.5 w-6.5", className)} aria-hidden="true">
      <span className="absolute top-px left-0 h-0.5 w-5.5 rounded-full bg-foreground" />
      <span className="absolute top-2 left-0 h-0.5 w-4.75 rounded-full bg-foreground" />
      <span className="absolute bottom-px left-0 h-0.5 w-5 rounded-full bg-foreground" />
    </span>
  );
};

