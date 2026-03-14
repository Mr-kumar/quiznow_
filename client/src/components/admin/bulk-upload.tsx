"use client";

import { useState, useEffect } from "react";
import { adminQuestionsApi } from "@/api/questions";
import { adminTopicsApi, type Topic } from "@/api/subjects";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { ErrorDisplay } from "@/components/ui/error-display";
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

// ─────────────────────────────────────────────────────────────────────────────
// NOTE for admin-api.ts — add this method to adminQuestionsApi if it doesn't exist:
//
//   validateBulkFile: async (file: File, topicId?: string) => {
//     const formData = new FormData();
//     formData.append('file', file);
//     if (topicId) formData.append('topicId', topicId);
//     return api.post('/questions/validate-bulk-file', formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//   },
//
// The component uses api directly for validate to avoid requiring an admin-api change.
// ─────────────────────────────────────────────────────────────────────────────

interface BulkUploadProps {
  sectionId: string;
  onSuccess?: (uploadedCount: number) => void;
}

export default function BulkQuestionUpload({
  sectionId,
  onSuccess,
}: BulkUploadProps) {
  const { handleError, errors, clearError } = useErrorHandler();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [validation, setValidation] = useState<any>(null);
  const [showValidation, setShowValidation] = useState(false);

  // ── Load topics ────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadTopics = async () => {
      setTopicsLoading(true);
      try {
        const response = await adminTopicsApi.getAll();
        // ✅ FIX: adminTopicsApi.getAll returns Topic[] directly, not wrapped
        setTopics(Array.isArray(response) ? response : []);
      } catch {
        toast.error("Error", { description: "Failed to load topics" });
      } finally {
        setTopicsLoading(false);
      }
    };
    loadTopics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Validate (dry run — no DB writes) ─────────────────────────────────────
  // ✅ FIX: Previously called adminQuestionsApi.bulkUpload(), which performed the
  // actual DB insert. Clicking "Validate" was silently uploading all questions, and
  // then clicking "Import" would re-attempt the same upload — failing with duplicate
  // hash errors. Now validate calls the dedicated dry-run endpoint with zero DB writes.
  const handleValidate = async () => {
    if (!file) return;

    setIsUploading(true);
    clearError();

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (selectedTopicId) formData.append("topicId", selectedTopicId);

      const response = await api.post(
        "/questions/validate-bulk-file",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setValidation({
        ...response.data,
        _file: file, // store reference so we can detect file swap before import
      });
      setShowValidation(true);

      toast("Validation Complete", {
        description: `${response.data.validCount ?? 0} valid rows, ${
          response.data.errors?.length ?? 0
        } errors`,
      });
    } catch (error: any) {
      handleError(error, { showToast: true });
    } finally {
      setIsUploading(false);
    }
  };

  // ── Import (real DB write + section link) ─────────────────────────────────
  // ✅ FIX: Now calls bulkUpload (which creates questions AND links them to the
  // section in one transaction). importBulkFile endpoint was also an option but
  // doesn't handle the section link — bulkUpload does both correctly.
  const handleImport = async () => {
    if (!file) return;

    // Guard: warn if file changed after validation
    if (validation && file !== validation._file) {
      toast.error("File Changed", {
        description: "Please re-validate before importing",
      });
      setShowValidation(false);
      setValidation(null);
      return;
    }

    setIsUploading(true);

    try {
      const response = await adminQuestionsApi.bulkUpload(
        file,
        sectionId,
        selectedTopicId || undefined
      );
      toast("Import Successful", {
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

  // ── Quick upload (validate + import in one shot, no preview) ──────────────
  const handleUpload = async () => {
    if (!file || !sectionId) return;
    setIsUploading(true);
    try {
      const response = await adminQuestionsApi.bulkUpload(file, sectionId);
      toast("Upload Successful", {
        description: `${response.data.count} questions uploaded successfully`,
      });
      onSuccess?.(response.data.count);
      setFile(null);
    } catch (error: any) {
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
            disabled={showValidation}
            className="cursor-pointer bg-white dark:bg-zinc-950"
          />
        </div>

        {/* Topic selector */}
        <div className="w-full max-w-xs mx-auto space-y-2">
          {/*
            ✅ FIX: Radix UI Select requires this exact nesting:
              <Select>
                <SelectTrigger />     ← must be direct child of Select
                <SelectContent>
                  <SelectGroup>       ← SelectGroup belongs INSIDE SelectContent
                    <SelectLabel />
                    <SelectItem />
                  </SelectGroup>
                </SelectContent>
              </Select>

            The original code wrapped SelectTrigger and SelectContent inside
            SelectGroup (which is invalid), making the dropdown non-functional.
          */}
          <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a topic (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Select Topic (Optional)</SelectLabel>
                {!topics || topics.length === 0 ? (
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    {topicsLoading ? "Loading topics…" : "No topics available"}
                  </div>
                ) : (
                  topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))
                )}
              </SelectGroup>
            </SelectContent>
          </Select>

          <div className="text-xs text-muted-foreground text-center">
            <p>
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

        {/* Validation results panel */}
        {showValidation && validation && (
          <div className="max-w-xs w-full mx-auto mt-4">
            <Alert
              variant={
                validation.errors?.length > 0 ? "destructive" : "default"
              }
            >
              <AlertTitle className="flex items-center gap-2">
                {validation.errors?.length > 0 ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                Validation Results
              </AlertTitle>
              <AlertDescription>
                <p>Valid rows: {validation.validCount ?? 0}</p>
                <p>Total rows: {validation.totalRows ?? 0}</p>
                <p>Errors: {validation.errors?.length ?? 0}</p>

                {(validation.validCount ?? 0) > 0 && (
                  <div className="mt-2">
                    <Button
                      onClick={handleImport}
                      disabled={isUploading}
                      className="w-full"
                      size="sm"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5 mr-2" />
                          Import {validation.validCount} Valid Row
                          {validation.validCount !== 1 ? "s" : ""}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>

            {(validation.errors?.length ?? 0) > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto">
                <p className="text-sm font-medium text-red-600 mb-1">Errors:</p>
                {validation.errors
                  ?.slice(0, 5)
                  .map((error: any, idx: number) => (
                    <div key={idx} className="text-xs text-red-600">
                      Row {error.row}: {error.errors?.join(", ")}
                    </div>
                  ))}
                {(validation.errors?.length ?? 0) > 5 && (
                  <div className="text-xs text-red-600">
                    ... and {(validation.errors?.length ?? 0) - 5} more errors
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
