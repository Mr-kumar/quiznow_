"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Plus,
  Layers,
  Settings,
  Upload,
  Database,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import api from "@/lib/api";
import { BulkQuestionUpload } from "@/components/admin/bulk-upload";
import { QuestionBankSelector } from "@/components/admin/question-bank-selector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function TestAssemblyDashboard() {
  const params = useParams();
  const { toast } = useToast();
  const [testData, setTestData] = useState<any>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);

  const fetchTestDetails = async () => {
    try {
      const res = await api.get(`/tests/${params.id}`);
      const data = res.data.data || res.data;
      setTestData(data);
      // Set first section as active by default
      if (data.sections && data.sections.length > 0 && !activeTab) {
        setActiveTab(data.sections[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Failed to load test details",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkQuestion = async (
    sectionId: string,
    questionId: string,
  ) => {
    if (
      !confirm(
        "Remove this question from this section? (It will stay in the Vault)",
      )
    )
      return;
    try {
      // Assuming you have this endpoint to delete the SectionQuestion link
      await api.delete(`/sections/${sectionId}/questions/${questionId}`);
      toast({ title: "Question Unlinked" });
      fetchTestDetails(); // Refresh the UI
    } catch (e) {
      toast({ title: "Failed to unlink", variant: "destructive" });
    }
  };

  const handleReorderQuestion = async (
    sectionId: string,
    questionId: string,
    direction: "up" | "down",
  ) => {
    try {
      const section = testData.sections?.find((s: any) => s.id === sectionId);
      if (!section) return;

      const questions = section.questions || [];
      const currentIndex = questions.findIndex(
        (q: any) => q.questionId === questionId,
      );

      if (
        (direction === "up" && currentIndex === 0) ||
        (direction === "down" && currentIndex === questions.length - 1)
      ) {
        toast({
          title: "Cannot move",
          description:
            direction === "up" ? "Already at the top" : "Already at the bottom",
          variant: "destructive",
        });
        return;
      }

      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      const reorderedIds = questions.map((q: any) => q.questionId);
      [reorderedIds[currentIndex], reorderedIds[newIndex]] = [
        reorderedIds[newIndex],
        reorderedIds[currentIndex],
      ];

      await api.patch(`/sections/${sectionId}/reorder-questions`, {
        questionIds: reorderedIds,
      });

      toast({
        title: "Order Updated",
        description: `Question moved ${direction}`,
      });

      await fetchTestDetails();
    } catch (error: any) {
      toast({
        title: "Failed to reorder",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Please try again",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (params.id) fetchTestDetails();
  }, [params.id]);

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) {
      toast({
        title: "Section name required",
        description: "Please enter a section name",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingSection(true);
    try {
      const response = await api.post("/sections", {
        testId: params.id,
        name: newSectionName.trim(),
        order: testData?.sections?.length + 1 || 1,
      });
      setNewSectionName("");
      await fetchTestDetails();
      toast({
        title: "Section Created",
        description: `"${newSectionName}" added to test`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to create section",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSection(false);
    }
  };

  const handleTogglePublish = async () => {
    setIsTogglingPublish(true);
    try {
      const newStatus = !testData.isLive;
      await api.patch(`/tests/${params.id}/publish`, { isLive: newStatus });
      setTestData({ ...testData, isLive: newStatus });
      toast({
        title: newStatus ? "Test Published!" : "Test Unpublished",
        description: newStatus
          ? "Students can now see and take this test."
          : "Test is now hidden from students.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to toggle publish status",
        description: error?.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsTogglingPublish(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-600">Loading test details...</p>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">
            Test Not Found
          </h3>
          <p className="text-gray-500">
            The test you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* TEST HEADER */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {testData.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Settings className="w-4 h-4" />
                  <span>Duration: {testData.durationMins} mins</span>
                </div>
                <div className="flex items-center gap-1">
                  <Layers className="w-4 h-4" />
                  <span>Marks: {testData.totalMarks}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Database className="w-4 h-4" />
                  <span>Sections: {testData.sections?.length || 0}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Publish Toggle */}
              <Button
                onClick={handleTogglePublish}
                disabled={isTogglingPublish}
                variant={testData.isLive ? "default" : "outline"}
                className={`${
                  testData.isLive
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                } min-w-30`}
              >
                {isTogglingPublish ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : testData.isLive ? (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Live
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Draft
                  </>
                )}
              </Button>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="New section name..."
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  className="w-64"
                  onKeyPress={(e) => e.key === "Enter" && handleCreateSection()}
                />
                <Button
                  onClick={handleCreateSection}
                  disabled={isCreatingSection || !newSectionName.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isCreatingSection ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTIONS */}
        {testData.sections?.length > 0 ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            {/* TABS */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2">
              <TabsList className="w-full h-auto p-1 bg-transparent space-x-1 overflow-x-auto">
                {testData.sections.map((section: any) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="px-4 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 border border-transparent rounded-md whitespace-nowrap transition-all"
                  >
                    <Layers className="w-4 h-4 mr-2" />
                    {section.name}
                    <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                      {section.questions?.length || 0}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* TAB CONTENT */}
            {testData.sections.map((section: any) => (
              <TabsContent
                key={section.id}
                value={section.id}
                className="space-y-6"
              >
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* UPLOAD CARD */}
                  <Card className="border-green-200 dark:border-green-800">
                    <CardHeader className="bg-green-50 dark:bg-green-900/20 pb-4">
                      <CardTitle className="text-green-700 dark:text-green-400 text-lg flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Upload Questions
                      </CardTitle>
                      <CardDescription>
                        Upload Excel file directly to {section.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <BulkQuestionUpload
                        sectionId={section.id}
                        onSuccess={fetchTestDetails}
                      />
                    </CardContent>
                  </Card>

                  {/* VAULT CARD */}
                  <Card className="border-blue-200 dark:border-blue-800">
                    <CardHeader className="bg-blue-50 dark:bg-blue-900/20 pb-4">
                      <CardTitle className="text-blue-700 dark:text-blue-400 text-lg flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        Add from Vault
                      </CardTitle>
                      <CardDescription>
                        Select existing questions for {section.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <QuestionBankSelector
                        maxQuestions={50}
                        onQuestionsSelected={async (questionIds) => {
                          try {
                            await api.post(
                              `/sections/${section.id}/link-questions`,
                              {
                                questionIds,
                              },
                            );
                            await fetchTestDetails();
                            toast({
                              title: "Questions Added",
                              description: `${questionIds.length} questions linked to ${section.name}`,
                            });
                          } catch (error: any) {
                            toast({
                              title: "Failed to link questions",
                              description:
                                error?.response?.data?.message ||
                                error?.message ||
                                "Please try again",
                              variant: "destructive",
                            });
                          }
                        }}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* 🌟 THE LINKED QUESTIONS TABLE */}
                <Card className="mt-8 shadow-md border-zinc-200">
                  <CardHeader className="bg-white border-b pb-4 flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="text-xl font-bold text-zinc-800">
                        Exam Paper: {section.name}
                      </CardTitle>
                      <CardDescription>
                        Drag or use arrows to reorder. Unlinking does not delete
                        from Vault.
                      </CardDescription>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-indigo-100 text-indigo-800 text-sm"
                    >
                      Total Linked: {section.questions?.length || 0}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    {section.questions?.length > 0 ? (
                      <Table>
                        <TableHeader className="bg-zinc-50">
                          <TableRow>
                            <TableHead className="w-16 text-center">
                              Order
                            </TableHead>
                            <TableHead>Question Text (English)</TableHead>
                            <TableHead className="w-32 text-center">
                              Subject
                            </TableHead>
                            <TableHead className="w-24 text-right pr-6">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {section.questions.map(
                            (linkedQ: any, index: number) => {
                              // Safely extract the master question data
                              const masterQ = linkedQ.question;
                              const translation =
                                masterQ?.translations?.find(
                                  (t: any) => t.lang === "en",
                                ) || masterQ?.translations?.[0];

                              return (
                                <TableRow
                                  key={`question-${index}`}
                                  className="group hover:bg-zinc-50 transition-colors"
                                >
                                  {/* ORDER & DRAG ICON */}
                                  <TableCell className="text-center font-medium text-zinc-500 flex items-center justify-center gap-2">
                                    <GripVertical className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 cursor-grab" />
                                    {index + 1}
                                  </TableCell>

                                  {/* QUESTION TEXT */}
                                  <TableCell>
                                    <div className="font-medium text-zinc-800 line-clamp-2">
                                      {translation?.content || (
                                        <span className="text-red-500 italic">
                                          Content Missing
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-zinc-400 mt-1">
                                      Vault ID: {masterQ?.id?.slice(0, 8)}
                                    </div>
                                  </TableCell>

                                  {/* SUBJECT BADGE */}
                                  <TableCell className="text-center">
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] bg-zinc-100"
                                    >
                                      {masterQ?.topic?.subject || "Mixed"}
                                    </Badge>
                                  </TableCell>

                                  {/* ACTIONS */}
                                  <TableCell className="text-right pr-6">
                                    <div className="flex justify-end gap-1 items-center opacity-50 group-hover:opacity-100 transition-opacity">
                                      {/* Reorder Arrows (Requires Backend Update for logic) */}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-zinc-400 hover:text-indigo-600"
                                        onClick={() =>
                                          handleReorderQuestion(
                                            section.id,
                                            masterQ.id,
                                            "up",
                                          )
                                        }
                                        disabled={index === 0}
                                      >
                                        <ArrowUp className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-zinc-400 hover:text-indigo-600"
                                        onClick={() =>
                                          handleReorderQuestion(
                                            section.id,
                                            masterQ.id,
                                            "down",
                                          )
                                        }
                                        disabled={
                                          index ===
                                          (section.questions?.length || 0) - 1
                                        }
                                      >
                                        <ArrowDown className="w-4 h-4" />
                                      </Button>
                                      {/* Unlink Button */}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() =>
                                          handleUnlinkQuestion(
                                            section.id,
                                            masterQ.id,
                                          )
                                        }
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            },
                          )}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-12 text-center text-zinc-500 flex flex-col items-center">
                        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-3">
                          <Trash2 className="w-8 h-8 text-zinc-300" />
                        </div>
                        <p>This section is empty.</p>
                        <p className="text-sm">
                          Use buttons above to inject questions.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Sections Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              Create your first section using the input above. For
              single-section exams, create one section called "Complete Paper".
            </p>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>
                <strong>💡 Tip:</strong> For multi-section exams, create
                sections like "Mathematics", "Reasoning", "Science"
              </p>
              <p>
                <strong>💡 Tip:</strong> For single-section exams, create one
                section called "Complete Paper"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
