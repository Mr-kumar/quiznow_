"use client";

import { useState, useCallback, useEffect } from "react";
import { adminTopicsApi, type Topic } from "@/lib/admin-api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  BookOpen,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Search,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/lib/api";

interface Question {
  id: string;
  hash: string;
  topicId?: string;
  topic?: Topic;
  isActive: boolean;
  correctAnswer: number;
  createdAt: string;
  translations: Array<{
    lang: string;
    content: string;
    options: string[];
    explanation?: string;
  }>;
}

export default function QuestionBankPage() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>("");

  // Load questions and topics
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [questionsRes, topicsRes] = await Promise.all([
        api.get("/questions"),
        adminTopicsApi.getAll(1, 1000),
      ]);
      setQuestions(questionsRes.data.data || []);
      setTopics(topicsRes.data.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to load questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load on mount
  useEffect(() => {
    loadData();
  }, []);

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.translations.some(
      (t) =>
        t.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.explanation?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    const matchesTopic = selectedTopic === "all" || q.topicId === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file",
        description: "Please upload an Excel (.xlsx) or CSV file",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  // Handle bulk upload
  const handleBulkUpload = async () => {
    if (!selectedFile || !selectedSection) {
      toast({
        title: "Missing information",
        description: "Please select a file and a section",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("sectionId", selectedSection);

      const response = await api.post("/questions/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent: any) => {
          const progress = Math.round(
            (progressEvent.loaded / progressEvent.total) * 100,
          );
          setUploadProgress(progress);
        },
      });

      toast({
        title: "Success",
        description: `${response.data.count} questions uploaded successfully`,
      });

      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setSelectedSection("");
      await loadData();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description:
          error.response?.data?.message ||
          "Failed to upload questions. Check the file format.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/templates/questions-template.xlsx";
    link.download = "questions-template.xlsx";
    link.click();
  };

  const uniqueSubjects = Array.from(
    new Set(topics.map((t) => t.subject).filter(Boolean)),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Question Bank
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage questions and bulk upload new ones
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
            <Dialog
              open={isUploadDialogOpen}
              onOpenChange={setIsUploadDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Questions
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Questions from File</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Upload an Excel (.xlsx) file with questions. Download the
                      template for the correct format.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select File</label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition">
                      <input
                        type="file"
                        accept=".xlsx,.csv,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-input"
                      />
                      <label htmlFor="file-input" className="cursor-pointer">
                        {selectedFile ? (
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span>{selectedFile.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm">
                              Click to select Excel file
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Section (Optional)
                    </label>
                    <Input
                      placeholder="Enter section ID or leave blank"
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                    />
                  </div>

                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={
                            {
                              "--progress-width": `${uploadProgress}%`,
                            } as React.CSSProperties
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsUploadDialogOpen(false)}
                      disabled={uploading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleBulkUpload}
                      disabled={uploading || !selectedFile}
                      className="flex-1"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Import
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <div className="flex gap-2 items-center">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {topics.map((topic) => (
              <SelectItem key={topic.id} value={topic.id}>
                {topic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{questions.length}</div>
              <p className="text-xs text-muted-foreground">Total Questions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {questions.filter((q) => q.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{topics.length}</div>
              <p className="text-xs text-muted-foreground">Topics</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{uniqueSubjects.length}</div>
              <p className="text-xs text-muted-foreground">Subjects</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions List */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading questions...</span>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No questions found matching your filters
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {question.translations[0]?.content.substring(0, 100)}
                        {question.translations[0]?.content.length > 100 &&
                          "..."}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        {question.topic && (
                          <>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {question.topic.name}
                            </span>
                          </>
                        )}
                        <span>
                          {new Date(question.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                        {question.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
