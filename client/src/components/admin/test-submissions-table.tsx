"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { adminAttemptsApi } from "@/api/attempts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  MoreHorizontal,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  Target,
  BarChart,
  User,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface SubmissionsTableProps {
  testId: string;
}

export function TestSubmissionsTable({ testId }: SubmissionsTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-attempts", testId, page],
    queryFn: () => adminAttemptsApi.getByTest(testId, page, 10).then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminAttemptsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-attempts", testId] });
      toast({ title: "Attempt deleted permanently" });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || err.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const attempts = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
            <TableRow>
              <TableHead className="w-[200px]">Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Accuracy</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attempts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                  No submissions recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              attempts.map((attempt) => (
                <TableRow key={attempt.attemptId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                         <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                       </div>
                       <div className="min-w-0">
                         <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">
                           {attempt.studentName}
                         </p>
                         <p className="text-xs text-slate-400 truncate">
                           {attempt.studentEmail}
                         </p>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {attempt.status === "SUBMITTED" ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Submitted
                      </Badge>
                    ) : attempt.status === "STARTED" ? (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <Clock className="h-3 w-3 mr-1 animate-pulse" /> In Progress
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-100 text-slate-600">
                        {attempt.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                       {attempt.score !== null ? attempt.score.toFixed(2) : "-"} <span className="text-xs font-normal text-slate-400">/ {attempt.totalMarks}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {attempt.accuracy !== null ? (
                        <>
                           <Target className="h-3.5 w-3.5 text-slate-400" />
                           <span className="font-medium text-slate-700 dark:text-slate-300">
                             {attempt.accuracy}%
                           </span>
                        </>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                       {attempt.timeTaken ? (attempt.timeTaken / 60).toFixed(1) + "m" : "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(attempt.startTime).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] text-slate-400 ml-5">
                      {new Date(attempt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled>
                           <BarChart className="h-4 w-4 mr-2 text-indigo-500" /> View Analytics
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30"
                          onClick={() => setDeleteTarget(attempt.attemptId)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Invalidate / Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */ }
        {(data?.total ?? 0) > (data?.limit ?? 10) && (
           <div className="py-3 px-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
             <div className="text-xs text-slate-500">
               Showing {(((data?.page ?? 1) - 1) * (data?.limit ?? 10)) + 1} to {Math.min((data?.page ?? 1) * (data?.limit ?? 10), data?.total ?? 0)} of {data?.total} attempts
             </div>
             <div className="space-x-2">
               <Button
                 size="sm"
                 variant="outline"
                 disabled={(data?.page ?? 1) === 1}
                 onClick={() => setPage(p => p - 1)}
               >
                 Previous
               </Button>
               <Button
                 size="sm"
                 variant="outline"
                 disabled={(data?.page ?? 1) * (data?.limit ?? 10) >= (data?.total ?? 0)}
                 onClick={() => setPage(p => p + 1)}
               >
                 Next
               </Button>
             </div>
           </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Attempt Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the student's submission from the leaderboard and erase all their answer timings for this specific attempt. The student can retake the test if they have attempts remaining.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget);
              }}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Invalidation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
