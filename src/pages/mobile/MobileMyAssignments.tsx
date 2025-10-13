import { useState } from "react";
import { Clock, CheckCircle, FileText, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEOHead } from "@/components/SEO";
import { BottomNav } from "@/components/mobile/BottomNav";
import { HamburgerMenu } from "@/components/mobile/HamburgerMenu";

const mockAssignments = [
  {
    id: "1",
    title: "React Hooks Quiz",
    course: "React Fundamentals",
    dueDate: "2025-10-15",
    status: "pending",
    description: "Complete quiz on useState and useEffect hooks",
  },
  {
    id: "2",
    title: "Build a Todo App",
    course: "React Fundamentals",
    dueDate: "2025-10-18",
    status: "pending",
    description: "Create a fully functional todo application",
  },
  {
    id: "3",
    title: "Node.js REST API",
    course: "Backend Development",
    dueDate: "2025-10-20",
    status: "pending",
    description: "Build a RESTful API with Express",
  },
  {
    id: "4",
    title: "Database Schema Design",
    course: "SQL Database",
    dueDate: "2025-10-10",
    status: "submitted",
    description: "Design a normalized database schema",
  },
  {
    id: "5",
    title: "Authentication System",
    course: "Full Stack Development",
    dueDate: "2025-10-05",
    status: "graded",
    score: 92,
    description: "Implement JWT authentication",
  },
];

const MobileMyAssignments = () => {
  const [filter, setFilter] = useState("all");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case "submitted":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Submitted</Badge>;
      case "graded":
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Graded</Badge>;
      default:
        return null;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const filteredAssignments = mockAssignments.filter((assignment) => {
    if (filter === "all") return true;
    return assignment.status === filter;
  });

  const AssignmentCard = ({ assignment }: { assignment: typeof mockAssignments[0] }) => {
    const daysUntilDue = getDaysUntilDue(assignment.dueDate);
    const isUrgent = daysUntilDue <= 1 && assignment.status === "pending";

    return (
      <Card className={`p-4 ${isUrgent ? "border-red-300 bg-red-50" : ""}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">{assignment.title}</h3>
            <p className="text-xs text-muted-foreground mb-2">{assignment.course}</p>
          </div>
          {getStatusBadge(assignment.status)}
        </div>
        
        <p className="text-xs text-muted-foreground mb-3">{assignment.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {assignment.status === "pending" ? (
              <span className={isUrgent ? "text-red-600 font-medium" : ""}>
                Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
              </span>
            ) : (
              <span>Due: {assignment.dueDate}</span>
            )}
          </div>
          
          {assignment.status === "graded" && assignment.score && (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-bold text-green-600">{assignment.score}%</span>
            </div>
          )}
        </div>
        
        <div className="mt-3">
          {assignment.status === "pending" && (
            <Button size="sm" className="w-full">
              {isUrgent && <AlertCircle className="h-4 w-4 mr-2" />}
              Submit Assignment
            </Button>
          )}
          {assignment.status === "submitted" && (
            <Button variant="outline" size="sm" className="w-full">
              View Submission
            </Button>
          )}
          {assignment.status === "graded" && (
            <Button variant="outline" size="sm" className="w-full">
              View Feedback
            </Button>
          )}
        </div>
      </Card>
    );
  };

  const pendingCount = mockAssignments.filter(a => a.status === "pending").length;
  const submittedCount = mockAssignments.filter(a => a.status === "submitted").length;
  const gradedCount = mockAssignments.filter(a => a.status === "graded").length;

  return (
    <>
      <SEOHead title="My Assignments | SimpleLecture" description="Track your assignments" />
      
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background border-b">
          <div className="flex items-center justify-between p-4">
            <HamburgerMenu />
            <h1 className="font-semibold text-lg">My Assignments</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="p-4 grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <FileText className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
            <p className="text-lg font-bold text-foreground">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </Card>
          <Card className="p-3 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold text-foreground">{submittedCount}</p>
            <p className="text-xs text-muted-foreground">Submitted</p>
          </Card>
          <Card className="p-3 text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-lg font-bold text-foreground">{gradedCount}</p>
            <p className="text-xs text-muted-foreground">Graded</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={filter} onValueChange={setFilter} className="w-full">
          <TabsList className="w-full grid grid-cols-4 rounded-none border-b">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="submitted">Submitted</TabsTrigger>
            <TabsTrigger value="graded">Graded</TabsTrigger>
          </TabsList>

          <div className="p-4 space-y-4">
            {filteredAssignments.length > 0 ? (
              filteredAssignments.map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))
            ) : (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No assignments in this category</p>
              </Card>
            )}
          </div>
        </Tabs>

        <BottomNav />
      </div>
    </>
  );
};

export default MobileMyAssignments;
