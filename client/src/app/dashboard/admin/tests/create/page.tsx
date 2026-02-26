"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BulkQuestionUpload } from "@/components/admin/bulk-upload";
import { adminQuestionsApi } from "@/lib/admin-api";
import { adminTestSeriesApi, adminExamsApi } from "@/lib/admin-api";
import { toast } from "@/components/ui/use-toast";
import { Plus, FileText, Upload, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Section {
  id: string;
  name: string;
}

interface TestSeries {
  id: string;
  title: string;
}

interface Exam {
  id: string;
  name: string;
}

export default function CreateTestPage() {
  const [activeTab, setActiveTab] = useState("manual");
  const [sections, setSections] = useState<Section[]>([]);
  const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [seriesResponse, examsResponse] = await Promise.all([
          adminTestSeriesApi.getAll(),
          adminExamsApi.getAll(),
        ]);

        const series = Array.isArray(seriesResponse.data)
          ? seriesResponse.data
          : seriesResponse.data?.data || [];
        const exams = Array.isArray(examsResponse.data)
          ? examsResponse.data
          : examsResponse.data?.data || [];

        setTestSeries(series);
        setExams(exams);

        // Extract sections from test series (mock for now)
        const mockSections: Section[] = series.map((s, index) => ({
          id: s.id,
          name: `Section ${index + 1}: ${s.title}`,
        }));

        setSections(mockSections);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load test data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleBulkUpload = async (file: File, sectionId: string) => {
    setUploadLoading(true);
    try {
      const response = await adminQuestionsApi.bulkUpload(file, sectionId);

      if (response.data?.success) {
        toast({
          title: "Success!",
          description: `Successfully uploaded ${response.data?.count || 0} questions`,
        });
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Test</h1>
            <p className="text-muted-foreground">
              Create new tests and manage questions
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Test</h1>
          <p className="text-muted-foreground">
            Create new tests and manage questions
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <BarChart3 className="w-3 h-3 mr-1" />
          Test Builder
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Manual Creation
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Bulk Upload
          </TabsTrigger>
        </TabsList>

        {/* Manual Creation Tab */}
        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Test Creation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Manual Test Builder
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create tests step-by-step with custom questions and sections
                </p>
                <Button disabled className="opacity-50">
                  <Plus className="w-4 h-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Upload Tab */}
        <TabsContent value="bulk" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Select Section for Upload</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {sections.map((section) => (
                <Card
                  key={section.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <BulkQuestionUpload
                      sectionId={section.id}
                      onSuccess={() => {
                        toast({
                          title: "Success!",
                          description: `Questions uploaded to ${section.name}`,
                        });
                      }}
                    />
                    <h4 className="font-medium mt-2">{section.name}</h4>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Test Series</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testSeries.length}</div>
            <p className="text-xs text-muted-foreground">Available series</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.length}</div>
            <p className="text-xs text-muted-foreground">Available exams</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sections.length}</div>
            <p className="text-xs text-muted-foreground">Upload targets</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
