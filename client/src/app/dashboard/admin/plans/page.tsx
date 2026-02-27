"use client";

import { useState, useCallback } from "react";
import {
  adminPlansApi,
  type Plan,
  type CreatePlanRequest,
  type UpdatePlanRequest,
} from "@/lib/admin-api";
import { useListData, useCrudOperations } from "@/hooks/use-admin-crud";
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
import { Input } from "@/components/ui/input";
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
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Calendar,
  TrendingUp,
  Search,
} from "lucide-react";
import { DataTable } from "@/components/admin/admin-data-table";
import { ColumnDef } from "@tanstack/react-table";

const planFormSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  price: z.number().min(0, "Price cannot be negative"),
  durationDays: z.number().min(1, "Duration must be at least 1 day"),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

export default function AdminPlansPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

  const {
    data: plans,
    loading,
    total,
    page,
    limit,
    search,
    setPage,
    setLimit,
    setSearch,
    refetch,
  } = useListData<Plan>(async (options) => {
    const response = await adminPlansApi.getAll(
      options.page,
      options.limit,
      options.search,
    );
    return response.data;
  });

  const {
    isLoading: isCrudLoading,
    create,
    update,
    remove,
  } = useCrudOperations(
    (data) => adminPlansApi.create(data),
    (id, data) => adminPlansApi.update(id, data),
    (id) => adminPlansApi.delete(id),
    () => refetch(),
  );

  const createForm = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: { name: "", price: 0, durationDays: 30 },
  });

  const editForm = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
  });

  const handleCreatePlan = async (data: PlanFormValues) => {
    const success = await create(data as CreatePlanRequest);
    if (success) {
      setIsCreateDialogOpen(false);
      createForm.reset();
    }
  };

  const handleEditPlan = useCallback(
    (plan: Plan) => {
      setSelectedPlan(plan);
      editForm.reset({
        name: plan.name,
        price: plan.price,
        durationDays: plan.durationDays,
      });
      setIsEditDialogOpen(true);
    },
    [editForm],
  );

  const handleUpdatePlan = async (data: PlanFormValues) => {
    if (!selectedPlan) return;
    const success = await update(selectedPlan.id, data as UpdatePlanRequest);
    if (success) {
      setIsEditDialogOpen(false);
      setSelectedPlan(null);
      editForm.reset();
    }
  };

  const handleDeletePlan = useCallback(async () => {
    if (!planToDelete) return;
    const success = await remove(planToDelete.id);
    if (success) {
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  }, [planToDelete, remove]);

  const columns: ColumnDef<Plan>[] = [
    {
      accessorKey: "name",
      header: "Plan Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => (
        <span className="font-semibold">₹{row.getValue("price")}</span>
      ),
    },
    {
      accessorKey: "durationDays",
      header: "Duration",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{row.getValue("durationDays")} days</span>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.getValue("createdAt") as string).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditPlan(row.original)}
            disabled={isCrudLoading}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700"
            onClick={() => {
              setPlanToDelete(row.original);
              setDeleteDialogOpen(true);
            }}
            disabled={isCrudLoading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
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
              <TrendingUp className="h-5 w-5" />
              Plans Management
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage subscription plans
            </p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Plan</DialogTitle>
              </DialogHeader>
              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(handleCreatePlan)}
                  className="space-y-4"
                >
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Premium Monthly"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="499" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="durationDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (Days)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="30" {...field} />
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
                    {isCrudLoading ? "Creating..." : "Create Plan"}
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
          placeholder="Search plans..."
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
          {loading ? (
            <div className="text-center py-8">Loading plans...</div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No plans found
            </div>
          ) : (
            <>
              <DataTable columns={columns} data={plans} />
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(total / limit)} ({total} total)
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
                    disabled={page >= Math.ceil(total / limit) || loading}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleUpdatePlan)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Premium Monthly" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="499"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="durationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (Days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isCrudLoading} className="w-full">
                {isCrudLoading ? "Updating..." : "Update Plan"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{planToDelete?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              disabled={isCrudLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {isCrudLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
