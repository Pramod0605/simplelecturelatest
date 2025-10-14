import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, BarChart3, Trash2, ShoppingBag, DollarSign, ShoppingCart } from "lucide-react";

export default function AdminDashboard() {
  const quickActions = [
    { icon: MessageSquare, label: "Comments", variant: "outline" as const },
    { icon: Mail, label: "tickets", variant: "outline" as const },
    { icon: BarChart3, label: "Reports", variant: "outline" as const },
    { icon: Trash2, label: "Clear Cache", variant: "outline" as const },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div 
        className="relative h-80 bg-cover bg-center rounded-lg overflow-hidden mx-6 mt-6"
        style={{ 
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80')",
        }}
      >
        <div className="absolute inset-0 flex flex-col items-start justify-center px-12 text-white">
          <h1 className="text-4xl font-bold mb-4">Welcome, Admin!</h1>
          <p className="text-lg mb-8 max-w-2xl">
            Everything is in your control, use quick access buttons to manage related actions easily.
          </p>
          <div className="flex flex-wrap gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant={action.variant}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-6 space-y-6">
        {/* Daily Sales */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Course Type Daily Sales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-3xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground mt-1">Live Class</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground mt-1">Course</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground mt-1">Meeting</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Platform Income</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-3xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground mt-1">Today</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground mt-1">Month</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">₹13,950</div>
                  <div className="text-sm text-muted-foreground mt-1">Year</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Sales Count</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-3xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground mt-1">Today</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground mt-1">Month</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">22</div>
                  <div className="text-sm text-muted-foreground mt-1">Year</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Income and Sales */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-lg bg-primary flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-3xl font-bold">₹14,996.47</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-lg bg-primary flex items-center justify-center">
                  <ShoppingCart className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-3xl font-bold">87</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
