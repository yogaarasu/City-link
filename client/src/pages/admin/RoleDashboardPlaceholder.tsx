import { Card, CardContent } from "@/components/ui/card";

interface RoleDashboardPlaceholderProps {
  title: string;
}

const RoleDashboardPlaceholder = ({ title }: RoleDashboardPlaceholderProps) => {
  return (
    <div className="bg-background flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardContent className="py-10 text-center">
          <h1 className="mb-2 text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">
            This role dashboard is reserved for future modules.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleDashboardPlaceholder;
