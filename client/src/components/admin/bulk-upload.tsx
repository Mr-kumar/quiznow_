"use client";

import { useState, useEffect } from "react";
import { adminQuestionsApi, adminTopicsApi, type Topic } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useErrorHandler, errorHandlers } from "@/hooks/use-error-handler";
import {
  ErrorDisplay,
  ValidationErrorDisplay,
  ServerError,
} from "@/components/ui/error-display";
import {
  Loader2,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BulkUploadProps {
  sectionId: string;
  onSuccess?: (uploadedCount: number) => void;
}

export default function BulkQuestionUpload({
  sectionId,
  onSuccess,
}: BulkUploadProps) {
  const { toast } = useToast();
  const { handleError, errors, clearError } = useErrorHandler();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [validation, setValidation] = useState<any>(null);
  const [showValidation, setShowValidation] = useState(false);

  // Load topics for selection
  useEffect(() => {
    const loadTopics = async () => {
      setTopicsLoading(true);
      try {
        const response = await adminTopicsApi.getAll(1, 1000); // Get all topics
        setTopics(response.data); // Raw Topic[] array
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load topics",
          variant: "destructive",
        });
      } finally {
        setTopicsLoading(false);
      }
    };
    loadTopics();
  }, [toast]);

  // Handle validation - directly upload since separate validation doesn't exist
  const handleValidate = async () => {
    if (!file) return;

    setIsUploading(true);
    clearError(); // Clear previous errors

    try {
      const response = await adminQuestionsApi.bulkUpload(file, sectionId);
      setValidation({
        ...response.data,
        file: file, // 🛡️ Store file fingerprint
      });
      setShowValidation(true);
      toast({
        title: "Upload Complete",
        description: `${response.data.count} questions uploaded successfully`,
      });
      onSuccess?.(response.data.count);
    } catch (error: any) {
      handleError(error, { showToast: true });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle import - directly upload since separate import doesn't exist
  const handleImport = async (onlyValid = true) => {
    if (!file) return;

    // 🛡️ FINGERPRINT CHECK: Warn if file changed after validation
    if (validation && file !== validation.file) {
      toast({
        title: "File Changed",
        description: "Please re-upload the file",
        variant: "destructive",
      });
      setShowValidation(false);
      return;
    }

    setIsUploading(true);

    try {
      const response = await adminQuestionsApi.bulkUpload(file, sectionId);
      toast({
        title: "Import Successful",
        description: `${response.data.count} questions uploaded successfully`,
      });
      onSuccess?.(response.data.count);
      // Reset state
      setFile(null);
      setValidation(null);
      setShowValidation(false);
    } catch (error: any) {
      handleError(error, { showToast: true });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle upload (legacy - for backward compatibility)
  const handleUpload = async () => {
    if (!file || !sectionId) return;

    setIsUploading(true);

    try {
      // Use authenticated admin API call
      const response = await adminQuestionsApi.bulkUpload(file, sectionId);
      toast({
        title: "Upload Successful",
        description: `${response.data.count} questions uploaded successfully`,
      });
      onSuccess?.(response.data.count);
      setFile(null);
    } catch (error: any) {
      console.error("Bulk upload error:", error);
      console.error("Error response:", error?.response?.data);
      console.error("SectionId being sent:", sectionId);
      console.error("File details:", file?.name, file?.size, file?.type);

      // Provide better error context
      handleError(error, {
        showToast: true,
        fallbackMessage:
          "Failed to upload questions. Please check the file format and try again.",
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

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="w-full max-w-md">
            {errors.map((errorItem) => (
              <ErrorDisplay
                key={errorItem.id}
                type={errorItem.error.type as any}
                title={errorItem.error.title}
                message={errorItem.error.message}
                details={errorItem.error.details}
                action={
                  errorItem.error.action
                    ? {
                        label: errorItem.error.action,
                        onClick: () => clearError(errorItem.id),
                      }
                    : undefined
                }
                onClose={() => clearError(errorItem.id)}
                className="mb-2"
              />
            ))}
          </div>
        )}

        <div className="max-w-xs w-full mx-auto">
          <Input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setValidation(null);
              setShowValidation(false);
            }}
            disabled={showValidation} // Disable file input when validation is shown
            className="cursor-pointer bg-white dark:bg-zinc-950"
          />
        </div>

        {/* Topic Selection & Info */}
        <div className="w-full max-w-xs mx-auto space-y-2">
          <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
            <SelectGroup>
              <SelectLabel>Select Topic (Optional)</SelectLabel>
              <SelectTrigger>
                <SelectValue placeholder="Choose a topic for questions" />
              </SelectTrigger>
              <SelectContent>
                {!topics || topics.length === 0 ? (
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    No topics available
                  </div>
                ) : (
                  topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </SelectGroup>
          </Select>

          <div className="text-xs text-muted-foreground text-center">
            <p>
              {" "}
              <strong>Topic Resolution Priority:</strong>
            </p>
            <p>1. topicId column in Excel</p>
            <p>2. Topic + Subject columns</p>
            <p>3. Selected topic (fallback)</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 max-w-xs w-full mx-auto">
          <Button
            onClick={handleValidate}
            disabled={!file || isUploading}
            className="flex-1"
            variant="outline"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Validate
              </>
            )}
          </Button>

          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Quick Upload
              </>
            )}
          </Button>
        </div>

        {showValidation && validation && (
          <div className="max-w-xs w-full mx-auto mt-4">
            <Alert>
              <AlertTitle>Validation Results</AlertTitle>
              <AlertDescription>
                <p>Valid rows: {validation.validCount}</p>
                <p>Errors: {validation.errors.length}</p>
                {validation.validCount > 0 && (
                  <div className="mt-2 space-y-2">
                    {/* 🛡️ FIXED: Show "Import All Rows" when there are errors (lenient mode) */}
                    {validation.errors.length > 0 && (
                      <Button
                        onClick={() => handleImport(false)} // onlyValid=false = import all rows despite errors
                        className="w-full"
                        size="sm"
                      >
                        Import All Rows ({validation.totalRows})
                      </Button>
                    )}
                    {/* 🛡️ FIXED: Show "Import Valid Rows" when there are no errors (strict mode) */}
                    {validation.errors.length === 0 && (
                      <Button
                        onClick={() => handleImport(true)} // onlyValid=true = import only valid rows
                        className="w-full"
                        size="sm"
                      >
                        Import Valid Rows ({validation.validCount})
                      </Button>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>

            {validation.errors.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto">
                <p className="text-sm font-medium text-red-600 mb-1">Errors:</p>
                {validation.errors
                  .slice(0, 5)
                  .map((error: any, idx: number) => (
                    <div key={idx} className="text-xs text-red-600">
                      Row {error.row}: {error.errors.join(", ")}
                    </div>
                  ))}
                {validation.errors.length > 5 && (
                  <div className="text-xs text-red-600">
                    ... and {validation.errors.length - 5} more errors
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-zinc-400 pt-2">
          Supported formats: .xlsx, .csv
        </div>
      </div>
    </div>
  );
}
