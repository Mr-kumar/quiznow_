"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { BulkQuestionUpload } from "@/components/admin/bulk-upload";
export default function CreateTestWizard() {
  const router = useRouter();
  const { toast } = useToast();

  // Wizard State
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Data State
  const [createdTestId, setCreatedTestId] = useState<string | null>(null);
  const [createdSectionId, setCreatedSectionId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "RRB JE Full Mock Test 1",
    duration: 60,
    totalMarks: 100,
    passingMarks: 40,
    negativeMark: 0.33,
    testSeriesId: "ea3d49f5-6c18-4f62-931a-b15f606e6938", // Make sure this is a valid Series ID from your DB
  });

  const handleCreateTestAndSection = async () => {
    setIsLoading(true);
    try {
      // 1. Create the Test
      const testPayload = {
        title: formData.title,
        duration: Number(formData.duration),
        totalMarks: Number(formData.totalMarks),
        passingMarks: Number(formData.passingMarks),
        negativeMarking: Number(formData.negativeMark),
        testSeriesId: formData.testSeriesId,
      };
      const testRes = await api.post("/tests", testPayload);
      const testId = testRes.data.id;
      setCreatedTestId(testId);

      // 2. Automatically Create a Default Section for this Test
      const sectionPayload = {
        testId: testId,
        name: "General Section",
        order: 1,
      };
      const secRes = await api.post("/sections", sectionPayload);
      const sectionId = secRes.data.id;
      setCreatedSectionId(sectionId);

      toast({
        title: "Success",
        description: "Test container created! Now upload questions.",
      });

      // 3. Move to Step 2 (Upload)
      setStep(2);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Database Error",
        description:
          error.response?.data?.message ||
          "Failed to create Test. Check your testSeriesId.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    // What happens after Excel is processed!
    toast({
      title: "Boom! 🚀",
      description: "All questions injected successfully!",
    });
    router.push("/dashboard/admin/tests"); // Redirect to tests list
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 1 ? "bg-blue-600 text-white" : "bg-zinc-200 text-zinc-500"}`}
        >
          1
        </div>
        <div
          className={`h-1 w-16 ${step >= 2 ? "bg-blue-600" : "bg-zinc-200"}`}
        ></div>
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 2 ? "bg-blue-600 text-white" : "bg-zinc-200 text-zinc-500"}`}
        >
          2
        </div>
      </div>

      {step === 1 && (
        <Card className="border-zinc-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Step 1: Test Details</CardTitle>
            <CardDescription>
              Create the container for your exam.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Test Title</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Duration (Mins)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Total Marks</Label>
                <Input
                  type="number"
                  value={formData.totalMarks}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalMarks: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t p-6 bg-zinc-50 dark:bg-zinc-900/50">
            <Button
              onClick={handleCreateTestAndSection}
              disabled={isLoading || !formData.title}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create & Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && createdSectionId && (
        <Card className="border-green-200 shadow-lg dark:border-green-900/50">
          <CardHeader className="bg-green-50/50 dark:bg-green-900/10 pb-8 border-b border-green-100 dark:border-green-900/30">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle className="text-2xl text-green-800 dark:text-green-400">
                  Step 2: Inject Questions
                </CardTitle>
                <CardDescription className="text-green-600/80">
                  Test container created successfully. Now upload your Excel
                  sheet.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            {/* The Excel Uploader with the REAL Database Section ID */}
            <BulkQuestionUpload
              sectionId={createdSectionId}
              onSuccess={handleUploadSuccess}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
