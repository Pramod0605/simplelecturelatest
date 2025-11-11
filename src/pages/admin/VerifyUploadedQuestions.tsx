import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Loader2, CheckCircle2 } from "lucide-react";
import { useUploadedDocuments } from "@/hooks/useUploadedDocuments";
import { format } from "date-fns";

export default function VerifyUploadedQuestions() {
  const navigate = useNavigate();
  const { data: documents, isLoading } = useUploadedDocuments({
    status: 'completed'
  });

  const getStatusBadge = (doc: any) => {
    if (doc.verified_by_human) {
      return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>;
    }
    if (doc.verified_by_ai) {
      return <Badge variant="secondary">AI Verified</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  const getHierarchy = (doc: any) => {
    const parts = [];
    if (doc.categories?.name) parts.push(doc.categories.name);
    if (doc.popular_subjects?.name) parts.push(doc.popular_subjects.name);
    if (doc.subject_chapters?.title) parts.push(doc.subject_chapters.title);
    if (doc.subject_topics?.title) parts.push(doc.subject_topics.title);
    return parts.join(' > ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Uploaded Documents</h2>
        <p className="text-muted-foreground">
          Manage uploaded documents and extract questions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents Ready for Verification</CardTitle>
          <CardDescription>
            Click "View and Verify" to review and approve questions from each document
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : documents && documents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Names</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Hierarchy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc: any) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">Q</Badge>
                          <span className="font-medium">{doc.questions_file_name}</span>
                        </div>
                        {doc.solutions_file_name && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">S</Badge>
                            <span className="text-sm text-muted-foreground">{doc.solutions_file_name}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">PDF</Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <span className="text-sm">{getHierarchy(doc)}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(doc)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(doc.created_at), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/question-bank/verify/${doc.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View and Verify
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No documents available for verification
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
