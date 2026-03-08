"use client";

import { useState, useCallback, useEffect } from "react";
import {
  adminSubscriptionsApi,
  type Subscription,
  type CreateSubscriptionRequest,
  type UpdateSubscriptionRequest,
} from "@/api/subscriptions";
import { adminPlansApi, type Plan } from "@/api/plans";
import { adminUsersApi, type User } from "@/api/users";
import {
  useSubscriptions,
  useCreateSubscription,
  useUpdateSubscription,
  useCancelSubscription,
} from "@/features/admin-subscriptions/hooks/use-subscriptions";
import { usePlans } from "@/features/admin-plans/hooks/use-plans";
import { useUsers } from "@/features/admin-users/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  CreditCard,
  Plus,
  Trash2,
  Calendar,
  User as UserIcon,
  CheckCircle,
  XCircle,
  Search,
  Filter,
} from "lucide-react";
import { DataTable } from "@/components/admin/admin-data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";

const subscriptionFormSchema = z.object({
  userId: z.string().min(1, "User is required"),
  planId: z.string().min(1, "Plan is required"),
});

type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

export default function SubscriptionsPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] =
    useState<Subscription | null>(null);

  // Pagination and search state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const {
    data: subscriptionsData,
    isLoading,
    refetch,
  } = useSubscriptions({
    page,
    limit,
    search,
  });

  const subscriptions = subscriptionsData?.data || [];
  const total = subscriptionsData?.total || 0;

  const createMutation = useCreateSubscription();
  const updateMutation = useUpdateSubscription();
  const cancelMutation = useCancelSubscription();

  const { data: plansData, isLoading: plansLoading } = usePlans({
    page: 1,
    limit: 1000,
  });
  const { data: usersData, isLoading: usersLoading } = useUsers({
    page: 1,
    limit: 1000,
  });

  const plans = Array.isArray(plansData)
    ? plansData
    : ((plansData as any)?.data ?? []);
  const users = Array.isArray(usersData)
    ? usersData
    : ((usersData as any)?.data ?? []);

  const isCrudLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    cancelMutation.isPending;

  const createForm = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: { userId: "", planId: "" },
  });

  const handleCreateSubscription = async (data: SubscriptionFormValues) => {
    try {
      await createMutation.mutateAsync(data as CreateSubscriptionRequest);
      setIsCreateDialogOpen(false);
      createForm.reset();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleDeleteSubscription = useCallback(async () => {
    if (!subscriptionToDelete) return;
    try {
      await cancelMutation.mutateAsync(subscriptionToDelete.id);
      setDeleteDialogOpen(false);
      setSubscriptionToDelete(null);
    } catch (error) {
      // Error is handled by the mutation hook
    }
  }, [subscriptionToDelete, cancelMutation]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "EXPIRED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns: ColumnDef<Subscription>[] = [
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{row.original.user?.name || "N/A"}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.user?.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "plan",
      header: "Plan",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.plan?.name}</p>
          <p className="text-xs text-muted-foreground">
            ₹{row.original.plan?.price}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={getStatusColor(row.getValue("status") as string)}>
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      accessorKey: "startAt",
      header: "Start Date",
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.getValue("startAt") as string).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: "expiresAt",
      header: "Expires",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {new Date(row.getValue("expiresAt") as string).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-700"
          onClick={() => {
            setSubscriptionToDelete(row.original);
            setDeleteDialogOpen(true);
          }}
          disabled={isCrudLoading}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
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
              <CreditCard className="h-5 w-5" />
              Subscriptions
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage user subscriptions and access
            </p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button disabled={plansLoading || usersLoading}>
                <Plus className="h-4 w-4 mr-2" />
                New Subscription
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Subscription</DialogTitle>
              </DialogHeader>
              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(handleCreateSubscription)}
                  className="space-y-4"
                >
                  <FormField
                    control={createForm.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select user" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name} ({user.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="planId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                            <SelectContent>
                              {plans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.name} (₹{plan.price})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={isCrudLoading}
                    className="w-full"
                  >
                    {isCrudLoading ? "Creating..." : "Create Subscription"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {/* Search */}
      <div className="flex gap-2 items-center">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search subscriptions..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading subscriptions...</div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No subscriptions found
            </div>
          ) : (
            <>
              <DataTable columns={columns} data={subscriptions} />
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(total / limit)} ({total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1 || isLoading}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= Math.ceil(total / limit) || isLoading}
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the subscription for{" "}
              <strong>{subscriptionToDelete?.user?.name || "this user"}</strong>
              ? This action will immediately revoke access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Active</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubscription}
              disabled={isCrudLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {isCrudLoading ? "Cancelling..." : "Cancel Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
