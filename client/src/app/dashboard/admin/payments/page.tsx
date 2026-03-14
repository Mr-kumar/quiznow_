"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { paymentsApi, type PaymentRecord } from "@/api/payments";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/admin/admin-data-table";
import { ColumnDef } from "@tanstack/react-table";
import { SearchIcon, CreditCardIcon, RefreshCwIcon } from "lucide-react";
import { format } from "date-fns";

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-payments", page, limit, search],
    queryFn: () =>
      paymentsApi.getAdminPayments(page, limit, search).then((r) => r.data),
  });

  const payments = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "PENDING":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "FAILED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const columns: ColumnDef<PaymentRecord>[] = [
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">
            {row.original.user?.name || "Unknown"}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.original.user?.email}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "plan",
      header: "Plan",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">
            {row.original.plan?.name || "Unknown"}
          </p>
          <p className="text-xs text-muted-foreground">
            ₹{row.original.amount / 100}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "razorpayOrderId",
      header: "Razorpay Order ID",
      cell: ({ row }) => (
        <span className="text-xs font-mono text-muted-foreground">
          {row.original.razorpayOrderId}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          className={getStatusColor(row.original.status)}
          variant="outline"
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm">
          {format(new Date(row.original.createdAt), "MMM d, yyyy h:mm a")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5 text-primary" />
              Payments History
            </CardTitle>
            <CardDescription>
              View all Razorpay transaction records, orders, and payment
              statuses.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="w-10 h-10 p-0"
          >
            <RefreshCwIcon
              className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
            />
          </Button>
        </CardHeader>
      </Card>

      <div className="flex gap-2 items-center">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, name, or Order ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading payments...
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No payments found matching your criteria.
            </div>
          ) : (
            <>
              <DataTable columns={columns} data={payments} />
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({total} total records)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1 || isLoading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || isLoading}
                    onClick={() => setPage((p) => p + 1)}
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
