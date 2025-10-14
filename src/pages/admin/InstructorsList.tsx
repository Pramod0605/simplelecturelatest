import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function InstructorsList() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Instructors</h1>
          <p className="text-muted-foreground">Manage instructor accounts</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Instructor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Instructors</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Instructor management interface coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
