"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Plus,
  Layers,
  Trash2,
  Clock,
  Award,
  Search,
  LayoutDashboard,
} from "lucide-react";
import api from "@/lib/api";

export default function ManageTestsCommandCenter() {
  const { toast } = useToast();
  const [tests, setTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTests = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/tests");
      let fetchedTests = res.data.data || res.data;

      // Filter out soft-deleted tests (Data Armor)
      fetchedTests = fetchedTests.filter((t: any) => t.isActive !== false);

      // Sort by newest first
      fetchedTests.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setTests(fetchedTests);
    } catch (error) {
      toast({
        title: "Failed to load master test list",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  // 🟢 The Safety Switch (Live vs Draft)
  const toggleLiveStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/tests/${id}`, { isLive: !currentStatus });
      toast({
        title: !currentStatus ? "Test Published! 🟢" : "Test moved to Draft ⚪",
        description: !currentStatus
          ? "Students can now see and take this test."
          : "This test is now hidden from students.",
      });
      fetchTests();
    } catch (error) {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  // 🛡️ Data Armor (Soft Delete)
  const handleSoftDelete = async (id: string) => {
    if (
      !confirm(
        "Archive this test? It will be hidden, but student attempt history will be preserved perfectly.",
      )
    )
      return;

    try {
      await api.patch(`/tests/${id}`, { isActive: false });
      toast({
        title: "Test Archived",
        description: "Safely removed without corrupting data.",
      });
      fetchTests();
    } catch (error) {
      toast({ title: "Failed to archive test", variant: "destructive" });
    }
  };

  const filteredTests = tests.filter((t) =>
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Master Test Directory
          </h1>
          <p className="text-zinc-500 mt-1">
            Manage rules, visibility, and assembly for all platform tests.
          </p>
        </div>
        <Link href="/dashboard/admin/tests/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
            <Plus className="w-5 h-5 mr-2" /> Create New Test Shell
          </Button>
        </Link>
      </div>

      <Card className="border-indigo-100 shadow-lg">
        <CardHeader className="bg-zinc-50 border-b pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center gap-2">
              <Layers className="text-indigo-600 w-5 h-5" /> All Tests
            </CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search by test name..."
                className="pl-9 border-zinc-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="text-center p-12 text-zinc-500">
              No tests found. Create your first one!
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-zinc-100/50">
                <TableRow>
                  <TableHead className="w-[300px]">Test Details</TableHead>
                  <TableHead className="text-center">Vital Signs</TableHead>
                  <TableHead className="text-center">
                    Visibility (Publish)
                  </TableHead>
                  <TableHead className="text-right pr-6">
                    Master Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.map((test) => (
                  <TableRow
                    key={test.id}
                    className="group hover:bg-zinc-50/80 transition-colors"
                  >
                    {/* COLUMN 1: DETAILS */}
                    <TableCell className="py-4">
                      <div className="font-bold text-zinc-900 text-base">
                        {test.title}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-zinc-100 text-zinc-600"
                        >
                          ID: {test.id.slice(0, 8)}
                        </Badge>
                        {test.series?.name && (
                          <span>📂 {test.series.name}</span>
                        )}
                      </div>
                    </TableCell>

                    {/* COLUMN 2: VITAL SIGNS */}
                    <TableCell className="text-center py-4">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="flex items-center text-sm font-medium text-zinc-700">
                          <Clock className="w-4 h-4 mr-1 text-blue-500" />{" "}
                          {test.durationMins} Mins
                        </span>
                        <span className="flex items-center text-sm font-medium text-zinc-700">
                          <Award className="w-4 h-4 mr-1 text-amber-500" />{" "}
                          {test.totalMarks} Marks
                        </span>
                      </div>
                    </TableCell>

                    {/* COLUMN 3: SAFETY SWITCH */}
                    <TableCell className="text-center py-4">
                      <div className="flex flex-col items-center gap-2">
                        <Switch
                          checked={test.isLive}
                          onCheckedChange={() =>
                            toggleLiveStatus(test.id, test.isLive)
                          }
                          className={
                            test.isLive ? "bg-green-500!" : "bg-zinc-300!"
                          }
                        />
                        <span
                          className={`text-xs font-bold ${test.isLive ? "text-green-600" : "text-zinc-500"}`}
                        >
                          {test.isLive ? "LIVE" : "DRAFT"}
                        </span>
                      </div>
                    </TableCell>

                    {/* COLUMN 4: MASTER ACTIONS */}
                    <TableCell className="text-right py-4 pr-6">
                      <div className="flex justify-end gap-3 items-center">
                        {/* 🌟 The Gateway to Assembly Line */}
                        <Link href={`/dashboard/admin/tests/${test.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                          >
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Build Content
                          </Button>
                        </Link>

                        {/* 🛡️ Soft Delete Armor */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSoftDelete(test.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Archive Test safely"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
