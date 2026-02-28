import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserState } from "@/store/user.store";

const Profile = () => {
  const user = useUserState((state) => state.user);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-4xl font-bold">My Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-semibold">{user?.name ?? "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-semibold">{user?.email ?? "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="font-semibold">{user?.role ?? "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">District</p>
            <p className="font-semibold">{user?.district ?? "-"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="font-semibold">{user?.address ?? "-"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
