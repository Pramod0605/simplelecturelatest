import { Users, UserCheck, AlertTriangle, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { mockStudents } from "@/data/mockStudents";

export const StudentStatsCards = () => {
  const total = mockStudents.length;
  const active = mockStudents.filter(s => s.status === "active").length;
  const atRisk = mockStudents.filter(s => s.at_risk).length;
  const newStudents = mockStudents.filter(s => {
    const enrollDate = new Date(s.enrollment_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return enrollDate > thirtyDaysAgo;
  }).length;

  const stats = [
    { label: "Total Students", value: total, icon: Users, color: "text-blue-500" },
    { label: "Active", value: active, icon: UserCheck, color: "text-green-500" },
    { label: "At Risk", value: atRisk, icon: AlertTriangle, color: "text-orange-500" },
    { label: "New (30 days)", value: newStudents, icon: UserPlus, color: "text-purple-500" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`h-10 w-10 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
