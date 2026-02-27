"use client";

import { useState } from "react";
import { adminQuestionsApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BulkUploadProps {
  sectionId: string;
  onSuccess?: (uploadedCount: number) => void;
}

export function BulkQuestionUpload({ sectionId, onSuccess }: BulkUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async () => {
    if (!file || !sectionId) return;

    setIsUploading(true);

    try {
      // Use authenticated admin API call
      const response = await adminQuestionsApi.bulkUpload(file, sectionId);

      toast({
        title: "Success!",
        description: `Questions uploaded successfully. Created ${response.data?.count || 0} questions.`,
      });
      if (onSuccess) onSuccess(response.data?.count || 0);
      setFile(null); // Reset
    } catch (error: any) {
      console.error("Upload Error:", error);

      // Extract the real error message from NestJS
      const backendError = error?.response?.data?.message || error?.message;
      const displayError = Array.isArray(backendError)
        ? backendError[0]
        : backendError || error?.toString() || "Unknown upload error";

      toast({
        title: "Upload Failed",
        description: `Error: ${displayError}`, // 👈 Now it will tell you EXACTLY what's wrong
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center bg-zinc-50/50 dark:bg-zinc-900/50 transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
          <FileSpreadsheet className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-medium">Upload Question Sheet</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            Drag and drop your Excel file here. Ensure columns match template.
          </p>
        </div>

        <div className="max-w-xs w-full mx-auto">
          <Input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="cursor-pointer bg-white dark:bg-zinc-950"
          />
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full max-w-xs bg-green-600 hover:bg-green-700 text-white"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" /> Upload Questions
            </>
          )}
        </Button>

        <div className="text-xs text-zinc-400 pt-2">
          Supported formats: .xlsx, .csv
        </div>
      </div>
    </div>
  );
}
