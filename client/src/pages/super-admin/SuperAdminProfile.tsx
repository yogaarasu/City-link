import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/modules/user/components/UserAvatar";
import { useUserState } from "@/store/user.store";

const SuperAdminProfilePage = () => {
  const user = useUserState((state) => state.user);
  const normalizedState =
    user?.adminAccess === "inactive" || user?.adminAccess === "stop" ? "Inactive" : "Active";

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="h-8 w-44 animate-pulse rounded bg-muted" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="h-20 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-56 animate-pulse rounded bg-muted" />
            <div className="h-4 w-80 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground">Super admin account details and access information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <UserAvatar name={user.name} avatar={user.avatar} className="h-20 w-20 text-3xl" />
            <div>
              <p className="text-xl font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <div className="rounded-lg border px-3 py-2 text-sm font-semibold">{user.role}</div>
                <div className="rounded-lg border px-3 py-2 text-sm font-semibold">{normalizedState}</div>
                <div className="rounded-lg border px-3 py-2 text-sm font-semibold">
                  {user.district || "State Admin"}
                </div>
              </div>
            </div>
          </div>

          <Button asChild>
            <Link to="/super-admin/settings">Edit Profile In Settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminProfilePage;
