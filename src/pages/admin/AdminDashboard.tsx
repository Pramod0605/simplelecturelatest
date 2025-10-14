import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAdminExploreByGoal } from "@/hooks/useAdminExploreByGoal";
import { useAdminPopularSubjects } from "@/hooks/useAdminPopularSubjects";
import { FolderTree, Target, BookOpen, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: categories } = useAdminCategories();
  const { data: goals } = useAdminExploreByGoal();
  const { data: subjects } = useAdminPopularSubjects();

  const stats = [
    {
      title: "Total Categories",
      value: categories?.length || 0,
      icon: FolderTree,
      description: `Level 1: ${categories?.filter(c => c.level === 1).length || 0} | Level 2: ${categories?.filter(c => c.level === 2).length || 0} | Level 3: ${categories?.filter(c => c.level === 3).length || 0}`,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      link: "/admin/categories",
    },
    {
      title: "Explore by Goal",
      value: goals?.length || 0,
      icon: Target,
      description: "Active learning goals",
      color: "text-green-600",
      bgColor: "bg-green-100",
      link: "/admin/explore-by-goal",
    },
    {
      title: "Popular Subjects",
      value: subjects?.length || 0,
      icon: BookOpen,
      description: "Featured subjects",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      link: "/admin/popular-subjects",
    },
    {
      title: "Programs",
      value: 0,
      icon: BookMarked,
      description: "Coming soon",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      link: "/admin/programs",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome to SimpleLecture Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(stat.link)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button onClick={() => navigate("/admin/categories/add")}>
            Add Category
          </Button>
          <Button onClick={() => navigate("/admin/explore-by-goal/add")} variant="outline">
            Add Goal
          </Button>
          <Button onClick={() => navigate("/admin/popular-subjects/add")} variant="outline">
            Add Subject
          </Button>
        </CardContent>
      </Card>

      {/* Recent Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categories?.slice(0, 5).map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon || "📁"}</span>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Level {category.level}
                      {category.parent_name && ` - ${category.parent_name}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/admin/categories/edit/${category.id}`)}
                >
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
