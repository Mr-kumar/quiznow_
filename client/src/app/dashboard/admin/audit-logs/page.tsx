"use client";

import { useState } from "react";
import { adminAuditLogsApi, type AuditLog } from "@/lib/admin-api";
import { useListData } from "@/hooks/use-admin-crud";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Shield, Search, Filter, Trash2, Loader2 } from "lucide-react";
import { DataTable } from "@/components/admin/admin-data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

const ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "EXPORT",
  "IMPORT",
];

export default function AuditLogsPage() {
  const { toast } = useToast();
  const [actionFilter, setActionFilter] = useState("");

  const {
    data: auditLogs,
    loading,
    total,
    page,
    limit,
    search,
    setPage,
    setLimit,
    setSearch,
  } = useListData<AuditLog>(async (options) => {
    const response = await adminAuditLogsApi.getAll(
      options.page,
      options.limit,
      options.search,
      actionFilter,
    );
    return response.data;
  });

  const handleCleanup = async () => {
    if (
      !confirm("Delete audit logs older than 90 days? This cannot be undone.")
    ) {
      return;
    }
    try {
      await adminAuditLogsApi.cleanup(90);
      toast({
        title: "Success",
        description: "Old logs cleaned up successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to cleanup logs",
        variant: "destructive",
      });
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "LOGIN":
        return "bg-purple-100 text-purple-800";
      case "LOGOUT":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <Badge className={getActionColor(row.getValue("action") as string)}>
          {row.getValue("action")}
        </Badge>
      ),
    },
    {
      accessorKey: "targetType",
      header: "Target Type",
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("targetType") || "—"}</span>
      ),
    },
    {
      accessorKey: "targetId",
      header: "Target ID",
      cell: ({ row }) => (
        <span className="text-sm font-mono text-muted-foreground">
          {(row.getValue("targetId") as string)?.slice(0, 12) || "—"}
        </span>
      ),
    },
    {
      accessorKey: "actorRole",
      header: "Actor Role",
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("actorRole") || "—"}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Timestamp",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.getValue("createdAt") as string).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Audit Logs
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              View all system activities and admin actions
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleCleanup}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clean Logs
          </Button>
        </CardHeader>
      </Card>

      {/* Filters */}
      <div className="flex gap-2 items-center">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by action, target..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
        <Filter className="h-4 w-4 text-muted-foreground ml-4" />
        <Select
          value={actionFilter}
          onValueChange={(value) => {
            setActionFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Actions</SelectItem>
            {ACTIONS.map((action) => (
              <SelectItem key={action} value={action}>
                {action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading audit logs...</span>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <>
              <DataTable columns={columns} data={auditLogs} />
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(total / 10)} ({total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1 || loading}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= Math.ceil(total / 10) || loading}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
