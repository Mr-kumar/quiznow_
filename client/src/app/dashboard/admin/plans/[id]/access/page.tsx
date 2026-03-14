"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { adminPlansApi, type PlanAccess } from "@/api/plans";
import { 
  adminExamsApi, 
  type Exam,
  adminTestSeriesApi,
  type TestSeries
} from "@/api/tests";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Shield, Trash2, BookOpen, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function PlanAccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const planId = resolvedParams.id;
  const router = useRouter();
const [isLoading, setIsLoading] = useState(true);
  const [accesses, setAccesses] = useState<PlanAccess[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [series, setSeries] = useState<TestSeries[]>([]);

  const [selectedExamId, setSelectedExamId] = useState<string>("none");
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("none");
  const [isAdding, setIsAdding] = useState(false);

  const fetchAccesses = async () => {
    try {
      const data = await adminPlansApi.getAccesses(planId);
      setAccesses(data);
    } catch (error) {
      toast.error("Error", { description: "Failed to load plan access rules" });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchAccesses();
        
        // Fetch exams & series for the dropdowns
        const [examsData, seriesData] = await Promise.all([
          adminExamsApi.getAll(),
          adminTestSeriesApi.getAll(),
        ]);
        
        setExams(examsData.data);
        setSeries(seriesData.data);
      } catch (error) {
        toast.error("Error fetching data", { description: "Could not load exams or series." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [planId]);

  const handleAddAccess = async () => {
    if (selectedExamId === "none" && selectedSeriesId === "none") {
      return toast.error("Validation Error", { description: "Please select either an Exam or a Series to unlock." });
    }

    if (selectedExamId !== "none" && selectedSeriesId !== "none") {
      return toast.error("Validation Error", { description: "Cannot select both Exam and Series in the same rule." });
    }

    setIsAdding(true);
    try {
      await adminPlansApi.addAccess(planId, {
        examId: selectedExamId !== "none" ? selectedExamId : undefined,
        seriesId: selectedSeriesId !== "none" ? selectedSeriesId : undefined,
      });
      
      toast("Access Rule Added", { description: "The selected content is now unlocked by this plan." });
      
      setSelectedExamId("none");
      setSelectedSeriesId("none");
      await fetchAccesses();
    } catch (error: any) {
      toast.error("Error", { description: error.response?.data?.message || "Failed to add rule" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveAccess = async (accessId: string) => {
    if (!window.confirm("Are you sure you want to remove this unlocking rule?")) return;
    
    try {
      await adminPlansApi.removeAccess(planId, accessId);
      toast("Removed", { description: "The access rule has been removed." });
      await fetchAccesses();
    } catch (error) {
      toast.error("Error", { description: "Failed to remove the access rule." });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading access configuration...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/admin/plans")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-500" />
            Plan Access Management
          </h1>
          <p className="text-sm text-muted-foreground">Configure what Exams or Series this subscription plan unlocks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ADD NEW RULE CARD */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Add Access Rule</CardTitle>
            <CardDescription>Unlock an entire Exam or a specific Test Series.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Unlock by Entire Exam</Label>
              <Select value={selectedExamId} onValueChange={(val) => {
                setSelectedExamId(val);
                if (val !== "none") setSelectedSeriesId("none");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None --</SelectItem>
                  {exams.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">This unlocks EVERY series inside the exam.</p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Unlock by Specific Series</Label>
              <Select value={selectedSeriesId} onValueChange={(val) => {
                setSelectedSeriesId(val);
                if (val !== "none") setSelectedExamId("none");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Series" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None --</SelectItem>
                  {series.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">This unlocks ONLY the specific series.</p>
            </div>

            <Button 
              className="w-full" 
              onClick={handleAddAccess} 
              disabled={isAdding || (selectedExamId === "none" && selectedSeriesId === "none")}
            >
              {isAdding ? "Adding..." : "Add Access Rule"}
            </Button>
          </CardContent>
        </Card>

        {/* EXISTING RULES CARD */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Current Unlocking Rules</CardTitle>
            <CardDescription>If a plan has multiple rules, they combine to grant access.</CardDescription>
          </CardHeader>
          <CardContent>
            {accesses.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg bg-gray-50/50">
                <Shield className="h-10 w-10 mx-auto text-gray-400 mb-3 opacity-20" />
                No access rules defined yet.<br/>This plan currently unlocks nothing.
              </div>
            ) : (
              <div className="space-y-3">
                {accesses.map((access) => (
                  <div key={access.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                    <div className="flex items-center gap-4">
                      {access.examId ? (
                        <>
                          <div className="p-2 bg-indigo-50 text-indigo-500 rounded-md">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm">Exam Unlock</div>
                            <div className="text-muted-foreground text-sm flex items-center gap-2">
                              {access.exam?.name || `Unknown (${access.examId})`}
                              <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">Entire Exam</Badge>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-2 bg-emerald-50 text-emerald-500 rounded-md">
                            <Layers className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm">Series Unlock</div>
                            <div className="text-muted-foreground text-sm flex items-center gap-2">
                              {access.series?.title || `Unknown (${access.seriesId})`}
                              <Badge variant="outline" className="border-emerald-200 text-emerald-700">Specific Series</Badge>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveAccess(access.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
