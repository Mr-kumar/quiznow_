"use client";

import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { DataTable, ActionDropdown } from "@/components/admin/admin-data-table";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  type User,
  type CreateUserRequest,
  type UpdateUserRequest,
} from "@/api/users";
import { useUsers } from "@/features/admin-users/hooks/use-users";
import {
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUpdateUserStatus,
} from "@/features/admin-users/hooks/use-user-mutations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Mail,
  Calendar,
  Shield,
  User as UserIcon,
  Ban,
  AlertCircle,
  CheckCircle,
  Eye,
  Search,
  Crown,
  CreditCard,
  X,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { User as UserType } from "@/api/users";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Schema ───────────────────────────────────────────────────────────────────

const userFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]),
});

type UserFormValues = z.infer<typeof userFormSchema>;

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = "all" | "students" | "paid" | "free" | "staff";
type RoleFilter = "ALL" | "STUDENT" | "INSTRUCTOR" | "ADMIN";
type StatusFilter = "ALL" | "ACTIVE" | "SUSPENDED" | "BANNED";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All Users", icon: <Users className="h-3.5 w-3.5" /> },
  { key: "students", label: "Students", icon: <UserIcon className="h-3.5 w-3.5" /> },
  { key: "paid", label: "Paid", icon: <Crown className="h-3.5 w-3.5" /> },
  { key: "free", label: "Free", icon: <CreditCard className="h-3.5 w-3.5" /> },
  { key: "staff", label: "Staff", icon: <Shield className="h-3.5 w-3.5" /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getActiveSubscription(user: UserType) {
  return (user.subscriptions ?? []).find(
    (s) => s.status === "ACTIVE" && new Date(s.expiresAt) > new Date()
  );
}

function getSubscriptionStatus(user: UserType): "active" | "expired" | "none" {
  const subs = user.subscriptions ?? [];
  if (subs.length === 0) return "none";
  const active = getActiveSubscription(user);
  return active ? "active" : "expired";
}

function formatRelativeDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  gradient,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-4 border",
        gradient,
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider opacity-80">
          {label}
        </span>
        <span className="opacity-60">{icon}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersManagementPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Filters
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const { data: usersData, isLoading } = useUsers({
    page: 1,
    limit: 100,
    search: debouncedSearch,
  });

  const allUsers = usersData?.data || [];

  // Derived stats
  const stats = useMemo(() => {
    const students = allUsers.filter((u) => u.role === "STUDENT");
    const paid = students.filter((u) => getSubscriptionStatus(u) === "active");
    const free = students.filter((u) => getSubscriptionStatus(u) !== "active");
    const staff = allUsers.filter((u) => u.role === "ADMIN" || u.role === "INSTRUCTOR");
    const suspended = allUsers.filter((u) => u.status === "SUSPENDED");
    const banned = allUsers.filter((u) => u.status === "BANNED");

    return {
      total: allUsers.length,
      students: students.length,
      paid: paid.length,
      free: free.length,
      staff: staff.length,
      suspended: suspended.length,
      banned: banned.length,
    };
  }, [allUsers]);

  // Filtered users based on tab + role + status
  const filteredUsers = useMemo(() => {
    let filtered = allUsers;

    // Tab filtering
    if (activeTab === "students") {
      filtered = filtered.filter((u) => u.role === "STUDENT");
    } else if (activeTab === "paid") {
      filtered = filtered.filter(
        (u) => u.role === "STUDENT" && getSubscriptionStatus(u) === "active"
      );
    } else if (activeTab === "free") {
      filtered = filtered.filter(
        (u) => u.role === "STUDENT" && getSubscriptionStatus(u) !== "active"
      );
    } else if (activeTab === "staff") {
      filtered = filtered.filter(
        (u) => u.role === "ADMIN" || u.role === "INSTRUCTOR"
      );
    }

    // Role filter (only applies when tab is "all")
    if (roleFilter !== "ALL" && activeTab === "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((u) => u.status === statusFilter);
    }

    return filtered;
  }, [allUsers, activeTab, roleFilter, statusFilter]);

  // Mutations
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const updateStatusMutation = useUpdateUserStatus();

  // Forms
  const createForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { email: "", name: "", role: "STUDENT" },
  });

  const editForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
  });

  const handleCreateUser = async (data: UserFormValues) => {
    try {
      await createMutation.mutateAsync(data as CreateUserRequest);
      setIsCreateDialogOpen(false);
      createForm.reset();
    } catch {
      // Error handled by mutation hook
    }
  };

  const handleUpdateUser = async (data: UserFormValues) => {
    if (!selectedUser) return;
    try {
      await updateMutation.mutateAsync({
        id: selectedUser.id,
        data: data as UpdateUserRequest,
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      editForm.reset();
    } catch {
      // Error handled by mutation hook
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteMutation.mutateAsync(userToDelete.id);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch {
      // Error handled by mutation hook
    }
  };

  const openEditDialog = (user: UserType) => {
    setSelectedUser(user);
    editForm.reset({
      email: user.email,
      name: user.name || "",
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  // ─── Table Columns ─────────────────────────────────────────────────────────

  const columns: ColumnDef<UserType>[] = [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.image} />
              <AvatarFallback className="bg-linear-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold">
                {user.name?.charAt(0).toUpperCase() ||
                  user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                {user.name || "Unnamed"}
              </p>
              <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                <Mail className="h-2.5 w-2.5 shrink-0" />
                {user.email}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        const cfg = {
          ADMIN: {
            cls: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800",
            icon: <Shield className="h-3 w-3" />,
          },
          INSTRUCTOR: {
            cls: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 border-violet-200 dark:border-violet-800",
            icon: <Users className="h-3 w-3" />,
          },
          STUDENT: {
            cls: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
            icon: <UserIcon className="h-3 w-3" />,
          },
        };
        const c = cfg[role as keyof typeof cfg] ?? cfg.STUDENT;
        return (
          <Badge variant="outline" className={cn("gap-1 text-[10px] font-semibold", c.cls)}>
            {c.icon}
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const cfg = {
          ACTIVE: {
            cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
            icon: <CheckCircle className="h-3 w-3" />,
          },
          SUSPENDED: {
            cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
            icon: <AlertCircle className="h-3 w-3" />,
          },
          BANNED: {
            cls: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800",
            icon: <Ban className="h-3 w-3" />,
          },
        };
        const c = cfg[status as keyof typeof cfg] ?? cfg.ACTIVE;
        return (
          <Badge variant="outline" className={cn("gap-1 text-[10px] font-semibold", c.cls)}>
            {c.icon}
            {status}
          </Badge>
        );
      },
    },
    {
      id: "subscription",
      header: "Subscription",
      cell: ({ row }) => {
        const user = row.original;
        if (user.role !== "STUDENT") {
          return <span className="text-xs text-slate-300 dark:text-slate-600">—</span>;
        }
        const subStatus = getSubscriptionStatus(user);
        const activeSub = getActiveSubscription(user);
        if (subStatus === "active" && activeSub) {
          return (
            <div className="space-y-0.5">
              <Badge variant="outline" className="gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                <Crown className="h-3 w-3" />
                {activeSub.plan.name}
              </Badge>
              <p className="text-[10px] text-slate-400">
                Expires {new Date(activeSub.expiresAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
          );
        }
        if (subStatus === "expired") {
          return (
            <Badge variant="outline" className="text-[10px] font-semibold text-slate-400 border-slate-200 dark:border-slate-700">
              Expired
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="text-[10px] font-semibold text-slate-400 border-slate-200 dark:border-slate-700">
            Free
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="h-3 w-3 text-slate-400" />
          {formatRelativeDate(row.getValue("createdAt"))}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <ActionDropdown>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/admin/users/${user.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEditDialog(user)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Details
            </DropdownMenuItem>

            {user.status !== "ACTIVE" && (
              <DropdownMenuItem
                onClick={() => updateStatusMutation.mutate({ id: user.id, status: "ACTIVE" })}
                className="text-emerald-600 focus:text-emerald-600"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Activate
              </DropdownMenuItem>
            )}

            {user.status !== "SUSPENDED" && (
              <DropdownMenuItem
                onClick={() => updateStatusMutation.mutate({ id: user.id, status: "SUSPENDED" })}
                className="text-amber-600 focus:text-amber-600"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Suspend
              </DropdownMenuItem>
            )}

            {user.status !== "BANNED" && (
              <DropdownMenuItem
                onClick={() => updateStatusMutation.mutate({ id: user.id, status: "BANNED" })}
                className="text-red-600 focus:text-red-600"
              >
                <Ban className="mr-2 h-4 w-4" />
                Ban
              </DropdownMenuItem>
            )}

            <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />

            <DropdownMenuItem
              onClick={() => {
                setUserToDelete(user);
                setDeleteDialogOpen(true);
              }}
              className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950/50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Data
            </DropdownMenuItem>
          </ActionDropdown>
        );
      },
    },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-5 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Users Management
            </h1>
          </div>
          <div className="flex-1" />
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700">
                <UserPlus className="h-3.5 w-3.5" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="user@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="STUDENT">Student</SelectItem>
                            <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Create User</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 py-5 space-y-5">
        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard
            label="Total"
            value={stats.total}
            icon={<Users className="h-4 w-4" />}
            gradient="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          />
          <StatCard
            label="Students"
            value={stats.students}
            icon={<UserIcon className="h-4 w-4" />}
            gradient="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300"
          />
          <StatCard
            label="Paid"
            value={stats.paid}
            icon={<Crown className="h-4 w-4" />}
            gradient="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300"
          />
          <StatCard
            label="Free"
            value={stats.free}
            icon={<CreditCard className="h-4 w-4" />}
            gradient="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300"
          />
          <StatCard
            label="Staff"
            value={stats.staff}
            icon={<Shield className="h-4 w-4" />}
            gradient="bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-900/20 border-violet-200 dark:border-violet-800/40 text-violet-700 dark:text-violet-300"
          />
          <StatCard
            label="Suspended"
            value={stats.suspended}
            icon={<AlertCircle className="h-4 w-4" />}
            gradient="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800/40 text-orange-700 dark:text-orange-300"
          />
          <StatCard
            label="Banned"
            value={stats.banned}
            icon={<Ban className="h-4 w-4" />}
            gradient="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300"
          />
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                // Reset role filter when switching tabs
                setRoleFilter("ALL");
              }}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === tab.key
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              )}
            >
              {tab.icon}
              {tab.label}
              <span
                className={cn(
                  "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  activeTab === tab.key
                    ? "bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                )}
              >
                {tab.key === "all"
                  ? stats.total
                  : tab.key === "students"
                    ? stats.students
                    : tab.key === "paid"
                      ? stats.paid
                      : tab.key === "free"
                        ? stats.free
                        : stats.staff}
              </span>
            </button>
          ))}
        </div>

        {/* ── Filters Row ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by name or email…"
              className="pl-8 h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {activeTab === "all" && (
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
              <SelectTrigger className="h-9 w-[140px] text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="STUDENT">Students</SelectItem>
                <SelectItem value="INSTRUCTOR">Instructors</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="h-9 w-[140px] text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="BANNED">Banned</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-xs text-slate-400 ml-auto">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Users Table ── */}
        <DataTable
          columns={columns}
          data={filteredUsers}
          searchKey=""
          title=""
          description=""
        />
      </div>

      {/* ── Edit Dialog ── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateUser)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="STUDENT">Student</SelectItem>
                        <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  Update User
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-4 w-4" />
              Delete user data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes{" "}
              <strong>"{userToDelete?.name || userToDelete?.email}"</strong> and
              all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
