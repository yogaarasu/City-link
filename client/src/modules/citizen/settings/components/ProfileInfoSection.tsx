import { useRef, useState } from "react";
import { AxiosError } from "axios";
import { Upload, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUserState } from "@/store/user.store";
import { updateProfile } from "@/modules/user/api/user.api";
import { UserAvatar } from "@/modules/user/components/UserAvatar";
import { Alert } from "@/components/Alert";

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read image file"));
    reader.readAsDataURL(file);
  });

interface ProfileInfoSectionProps {
  onLogout: () => void;
}

export const ProfileInfoSection = ({ onLogout }: ProfileInfoSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const user = useUserState((state) => state.user);
  const updateUser = useUserState((state) => state.updateUser);
  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

  const handleFileChange = async (files: FileList | null) => {
    if (!files?.[0]) return;
    const selected = files[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(selected.type)) {
      toast.error("Only JPG, PNG, GIF or WEBP files are allowed.");
      return;
    }
    if (selected.size > 3 * 1024 * 1024) {
      toast.error("Profile image max size is 3MB.");
      return;
    }
    try {
      const encoded = await toBase64(selected);
      setAvatar(encoded);
    } catch {
      toast.error("Failed to process selected image.");
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await updateProfile({ name, avatar });
      updateUser(response.user);
      toast.success(response.message);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? "Failed to update profile");
        return;
      }
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    try {
      setIsRemovingAvatar(true);
      const response = await updateProfile({
        name: user.name,
        avatar: "",
      });
      setAvatar("");
      updateUser(response.user);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success("Profile picture removed.");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? "Failed to remove profile picture");
        return;
      }
      toast.error("Failed to remove profile picture");
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-2xl">Profile Information</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Update your profile details and public avatar.
          </p>
        </div>
        <Alert
          trigger={
            <Button variant="destructive" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          }
          title="Confirm Logout"
          description="Are you sure you want to logout from your account?"
          onContinue={onLogout}
          variant="destructive"
        />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <UserAvatar name={name || user?.name} avatar={avatar} className="h-24 w-24 text-4xl" />
          <div className="w-full">
            <p className="mb-2 text-sm text-muted-foreground">JPG, PNG or GIF. Max size of 3MB.</p>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={(event) => handleFileChange(event.target.files)}
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload New
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemoveAvatar}
                disabled={!avatar || isRemovingAvatar}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isRemovingAvatar ? "Removing..." : "Remove Avatar"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full Name</label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email Address</label>
            <Input value={user?.email ?? ""} disabled />
            <p className="text-xs text-muted-foreground">
              Email is managed by credentials and cannot be changed here.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

