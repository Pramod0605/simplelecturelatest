import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Loader2, Eye } from "lucide-react";
import { useCategoriesWithSubjects } from "@/hooks/useCategoriesWithSubjects";
import { useAdminPopularSubjects } from "@/hooks/useAdminPopularSubjects";
import { useSubjectChapters, useChapterTopics } from "@/hooks/useSubjectManagement";
import { useSubtopics } from "@/hooks/useSubtopics";
import { useUploadedDocuments, useUploadDocument, useProcessDocument, useExtractQuestions } from "@/hooks/useUploadedDocuments";
import { useProcessingJobs } from "@/hooks/useProcessingJobs";
import { MathpixPreview } from "@/components/admin/MathpixPreview";
import { toast } from "sonner";

export default function UploadQuestionBank() {
  const [categoryId, setCategoryId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [subtopicId, setSubtopicId] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'word' | 'json'>('pdf');
  const [previewDocument, setPreviewDocument] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: categories } = useCategoriesWithSubjects();
  const { data: allSubjects } = useAdminPopularSubjects();
  const { data: chapters } = useSubjectChapters(subjectId);
  const { data: topics } = useChapterTopics(chapterId);
  const { data: subtopics } = useSubtopics(topicId);
  
  const subjects = allSubjects?.filter((s) => s.category_id === categoryId) || [];

  const { data: documents } = useUploadedDocuments({
    categoryId,
    subjectId,
    chapterId,
    topicId,
  });

  const uploadMutation = useUploadDocument();
  const processMutation = useProcessDocument();
  const extractMutation = useExtractQuestions();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Auto-detect file type
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') setFileType('pdf');
      else if (ext === 'docx') setFileType('word');
      else if (ext === 'json') setFileType('json');
      else setFileType('image');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !categoryId || !subjectId || !chapterId || !topicId) {
      toast.error("Please select file, category, subject, chapter, and topic");
      return;
    }

    await uploadMutation.mutateAsync({
      file: selectedFile,
      categoryId,
      subjectId,
      chapterId,
      topicId,
      subtopicId: subtopicId || undefined,
    });

    setIsUploadOpen(false);
    setSelectedFile(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">✅ Completed</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800"><Loader2 className="h-3 w-3 animate-spin mr-1" />🔄 Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">❌ Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">⏳ Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Upload Question Bank</h2>
        <p className="text-muted-foreground">
          Upload documents (PDF, Word, Images, JSON) to extract questions
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Select category and subject to view uploaded documents</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={(value) => {
              setCategoryId(value);
              setSubjectId("");
              setChapterId("");
              setTopicId("");
              setSubtopicId("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.display_name || cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={subjectId} onValueChange={(value) => {
              setSubjectId(value);
              setChapterId("");
              setTopicId("");
              setSubtopicId("");
            }} disabled={!categoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Chapter</Label>
            <Select value={chapterId} onValueChange={(value) => {
              setChapterId(value);
              setTopicId("");
              setSubtopicId("");
            }} disabled={!subjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select chapter" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {chapters?.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.id}>
                    {chapter.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Topic *</Label>
            <Select value={topicId} onValueChange={(value) => {
              setTopicId(value);
              setSubtopicId("");
            }} disabled={!chapterId}>
              <SelectTrigger>
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {topics?.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subtopic (Optional)</Label>
            <Select value={subtopicId} onValueChange={setSubtopicId} disabled={!topicId}>
              <SelectTrigger>
                <SelectValue placeholder="Select subtopic" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {subtopics?.map((subtopic) => (
                  <SelectItem key={subtopic.id} value={subtopic.id}>
                    {subtopic.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        
        <CardContent className="pt-0">
          <div className="flex justify-end">
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Question
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Upload Question Document</DialogTitle>
                  <DialogDescription>
                    Upload PDF, Word, Image, or JSON file to extract questions
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>File Type</Label>
                    <Select value={fileType} onValueChange={(value: any) => setFileType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">📄 PDF</SelectItem>
                        <SelectItem value="word">📝 Word (DOCX)</SelectItem>
                        <SelectItem value="image">📷 Image (JPG, PNG)</SelectItem>
                        <SelectItem value="json">📊 JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Select File</Label>
                    <Input
                      type="file"
                      accept={
                        fileType === 'pdf' ? '.pdf' :
                        fileType === 'word' ? '.docx' :
                        fileType === 'image' ? '.jpg,.jpeg,.png' :
                        '.json'
                      }
                      onChange={handleFileSelect}
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending}>
                    {uploadMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Upload
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
          <CardDescription>Manage uploaded documents and extract questions</CardDescription>
        </CardHeader>
        <CardContent>
          {documents && documents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Hierarchy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc: any) => {
                  // Check if there's an active extraction job for this document
                  const DocumentRow = () => {
                    const { data: jobs } = useProcessingJobs({ 
                      documentId: doc.id,
                      jobType: 'llm_extraction'
                    });
                    
                    const activeJob = jobs?.find(
                      (job: any) => job.status === 'running' || job.status === 'pending'
                    );

                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.file_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.file_type.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="text-muted-foreground">{doc.popular_subjects?.name}</span>
                            {' > '}
                            <span className="text-muted-foreground">{doc.subject_chapters?.title}</span>
                            {doc.subject_topics?.title && (
                              <>
                                {' > '}
                                <span className="font-medium">{doc.subject_topics.title}</span>
                              </>
                            )}
                            {doc.subtopics?.title && (
                              <>
                                {' > '}
                                <span className="text-xs">{doc.subtopics.title}</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                        <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {doc.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => processMutation.mutate({ documentId: doc.id })}
                                disabled={processMutation.isPending}
                              >
                                {processMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Process'
                                )}
                              </Button>
                            )}
                            {doc.status === 'completed' && doc.mathpix_mmd && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setPreviewDocument(doc);
                                  setIsPreviewOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                            )}
                            {doc.status === 'completed' && !doc.mathpix_mmd && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => processMutation.mutate({ documentId: doc.id })}
                                disabled={processMutation.isPending}
                              >
                                {processMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Re-process'
                                )}
                              </Button>
                            )}
                            {doc.status === 'completed' && doc.mathpix_mmd && (
                              <Button
                                size="sm"
                                onClick={() => extractMutation.mutate({ documentId: doc.id })}
                                disabled={extractMutation.isPending || !!activeJob}
                              >
                                {(extractMutation.isPending || activeJob) ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    Processing...
                                  </>
                                ) : (
                                  'Extract Questions'
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  };

                  return <DocumentRow key={doc.id} />;
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Upload a document to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {previewDocument?.file_name}
            </DialogTitle>
            <DialogDescription>
              Mathpix Markdown Preview - LaTeX formulas rendered
            </DialogDescription>
          </DialogHeader>
          {previewDocument?.mathpix_mmd ? (
            <MathpixPreview mmdText={previewDocument.mathpix_mmd} />
          ) : (
            <Alert>
              <AlertDescription>
                No preview available. Document may still be processing.
              </AlertDescription>
            </Alert>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
