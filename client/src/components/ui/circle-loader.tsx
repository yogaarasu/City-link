import { cn } from "@/lib/utils";

interface CircleLoaderProps {
  size?: number;
  className?: string;
}

export const CircleLoader = ({ size = 30, className }: CircleLoaderProps) => {
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-3 border-muted border-t-[#129141]",
        className
      )}
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
};

