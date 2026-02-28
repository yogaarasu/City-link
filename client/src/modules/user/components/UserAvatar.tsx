import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string;
  avatar?: string;
  className?: string;
}

const getInitial = (name?: string) => {
  if (!name?.trim()) return "U";
  return name.trim().charAt(0).toUpperCase();
};

export const UserAvatar = ({ name, avatar, className }: UserAvatarProps) => {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name ?? "User"}
        className={cn("aspect-square shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "aspect-square shrink-0 flex items-center justify-center rounded-full bg-emerald-600 text-white font-semibold",
        className
      )}
    >
      {getInitial(name)}
    </div>
  );
};
