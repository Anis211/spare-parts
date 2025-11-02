import { Card, CardContent } from "@/components/admin/ui/card";

export default function StatCard({ title, value, icon: Icon, trend }) {
  return (
    <Card className="border-[hsl(220_50%_25%)]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-12">
          <div>
            <p className="text-sm text-[hsl(220_20%_70%)] mb-1">{title}</p>
            <p className="text-3xl font-bold text-[hsl(45_100%_95%)]">
              {value}
            </p>
            {trend && (
              <p className="text-xs text-[hsl(45_100%_51%)] mt-2">{trend}</p>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-[hsl(45_100%_51%)]/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-[hsl(45_100%_51%)]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
