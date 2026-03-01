import { cn } from "@/lib/utils";

interface HamburgerIconProps {
  className?: string;
}

export const HamburgerIcon = ({ className }: HamburgerIconProps) => {
  return (
    <span className={cn("relative block h-[18px] w-[26px]", className)} aria-hidden="true">
      <span className="absolute top-[1px] left-0 h-0.5 w-[22px] rounded-full bg-foreground" />
      <span className="absolute top-[8px] left-0 h-0.5 w-[19px] rounded-full bg-foreground" />
      <span className="absolute bottom-[1px] left-0 h-0.5 w-[20px] rounded-full bg-foreground" />
    </span>
  );
};

