import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Upload, Download, FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  usePreviousYearPapers,
  useCreatePreviousYearPaper,
  useDeletePreviousYearPaper,
  useUploadPaperPDF,
} from "@/hooks/usePreviousYearPapers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SubjectPreviousYearTabProps {
  subjectId: string;
  subjectName: string;
}

export function SubjectPreviousYearTab({ subjectId, subjectName }: SubjectPreviousYearTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    exam_name: "",
    paper_type: "",
    total_questions: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: papers, isLoading } = usePreviousYearPapers(subjectId);
  const createPaper = useCreatePreviousYearPaper();
  const deletePaper = useDeletePreviousYearPaper();
  const uploadPDF = useUploadPaperPDF();

  const handleSubmit = async () => {
    let pdfUrl = undefined;

    // Upload PDF if selected
    if (selectedFile) {
      const tempId = `temp-${Date.now()}`;
      const url = await uploadPDF.mutateAsync({ file: selectedFile, paperId: tempId });
      pdfUrl = url;
    }

    createPaper.mutate(
      {
        subject_id: subjectId,
        year: formData.year,
        exam_name: formData.exam_name,
        paper_type: formData.paper_type || undefined,
        pdf_url: pdfUrl,
        total_questions: formData.total_questions,
      },
      {
        onSuccess: () => {
          setIsAddOpen(false);
          setFormData({
            year: new Date().getFullYear(),
            exam_name: "",
            paper_type: "",
            total_questions: 0,
          });
          setSelectedFile(null);
        },
      }
    );
  };

  const handleDelete = () => {
    if (deleteId) {
      deletePaper.mutate(
        { id: deleteId, subjectId },
        {
          onSuccess: () => setDeleteId(null),
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Previous Year Papers</CardTitle>
              <CardDescription>
                Manage previous year examination papers for {subjectName}
              </CardDescription>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Paper
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Previous Year Paper</DialogTitle>
                  <DialogDescription>
                    Add a new previous year examination paper
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year *</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({ ...formData, year: parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exam-name">Exam Name *</Label>
                    <Input
                      id="exam-name"
                      placeholder="e.g., NEET, JEE Mains"
                      value={formData.exam_name}
                      onChange={(e) =>
                        setFormData({ ...formData, exam_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paper-type">Paper Type</Label>
                    <Input
                      id="paper-type"
                      placeholder="e.g., Phase 1, Main, Advanced"
                      value={formData.paper_type}
                      onChange={(e) =>
                        setFormData({ ...formData, paper_type: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total-questions">Total Questions</Label>
                    <Input
                      id="total-questions"
                      type="number"
                      value={formData.total_questions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          total_questions: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pdf-upload">Upload PDF (Optional)</Label>
                    <Input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    {selectedFile && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      !formData.exam_name ||
                      createPaper.isPending ||
                      uploadPDF.isPending
                    }
                  >
                    {createPaper.isPending || uploadPDF.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Paper"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : papers && papers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Exam Name</TableHead>
                  <TableHead>Paper Type</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>PDF</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {papers.map((paper) => (
                  <TableRow key={paper.id}>
                    <TableCell className="font-medium">{paper.year}</TableCell>
                    <TableCell>{paper.exam_name}</TableCell>
                    <TableCell>
                      {paper.paper_type ? (
                        <Badge variant="outline">{paper.paper_type}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{paper.total_questions || 0}</TableCell>
                    <TableCell>
                      {paper.pdf_url ? (
                        <a
                          href={paper.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          View
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(paper.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No previous year papers added yet</p>
              <p className="text-sm mt-2">Click "Add Paper" to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Previous Year Paper?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the paper record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
