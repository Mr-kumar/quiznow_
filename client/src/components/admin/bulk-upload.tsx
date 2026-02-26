"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";

interface BulkUploadProps {
  onUpload: (file: File, sectionId: string) => Promise<void>;
  sections: Array<{ id: string; name: string }>;
  loading?: boolean;
}

export function BulkUpload({ onUpload, sections, loading = false }: BulkUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
                 file.type === "application/vnd.ms-excel" ||
                 file.name.endsWith('.xlsx') ||
                 file.name.endsWith('.xls'))) {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!selectedFile || !selectedSection) {
      toast({
        title: "Missing Information",
        description: "Please select a file and section",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await onUpload(selectedFile, selectedSection);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast({
        title: "Upload Successful",
        description: `${selectedFile.name} uploaded successfully`,
      });

      // Reset form
      setTimeout(() => {
        setSelectedFile(null);
        setSelectedSection("");
        setUploadProgress(0);
        setIsUploading(false);
      }, 1500);

    } catch (error) {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Question Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Section</label>
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a section..." />
            </SelectTrigger>
            <SelectContent>
              {sections.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
              : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            {selectedFile ? (
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <div className="text-left">
                    <p className="font-medium text-green-800 dark:text-green-200">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {isDragActive
                      ? "Drop your Excel file here"
                      : "Drag & drop Excel file here, or click to select"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Supports .xlsx and .xls files with columns: Question, Option A, Option B, Option C, Option D, Correct Answer, Explanation
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {(isUploading || uploadProgress > 0) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Uploading...</span>
              <span className="text-sm text-gray-500">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !selectedSection || isUploading || loading}
          className="w-full"
          size="lg"
        >
          {isUploading ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Questions
            </>
          )}
        </Button>

        {/* Success State */}
        {uploadProgress === 100 && !isUploading && (
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-green-800 dark:text-green-200 font-medium">
              Upload completed successfully!
            </span>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Excel Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>Column A: Question text</li>
                <li>Column B: Option A</li>
                <li>Column C: Option B</li>
                <li>Column D: Option C</li>
                <li>Column E: Option D</li>
                <li>Column F: Correct Answer (A, B, C, D or 1, 2, 3, 4)</li>
                <li>Column G: Explanation (optional)</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
