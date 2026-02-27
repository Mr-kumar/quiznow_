"use client";

import { useState, useEffect } from "react";
import {
  DataTable,
  ActionDropdown,
  StatusBadge,
} from "@/components/admin/admin-data-table";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  adminUsersApi,
  type User,
  type CreateUserRequest,
  type UpdateUserRequest,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Users,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  Mail,
  Calendar,
  Shield,
  User as UserIcon,
  TrendingUp,
  Activity,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  Download,
  Target,
  BarChart3,
  PieChart,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { User as UserType } from "@/lib/admin-api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardDescription } from "@/components/ui/card";

// Form validation schema
const userFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function UsersAnalyticsPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { toast } = useToast();

  // Forms
  const createForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      name: "",
      role: "STUDENT",
    },
  });

  const editForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
  });

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true);

      // Mock data for demo
      const mockUsers: UserType[] = [
        {
          id: "1",
          email: "admin@quiznow.com",
          name: "Super Admin",
          role: "ADMIN",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          email: "student@quiznow.com",
          name: "John Student",
          role: "STUDENT",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "3",
          email: "teacher@quiznow.com",
          name: "Jane Instructor",
          role: "INSTRUCTOR",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      try {
        const response = await adminUsersApi.getAll();
        setUsers(response.data.data);
      } catch (apiError) {
        console.log("API endpoints not ready, using mock data:", apiError);
        setUsers(mockUsers);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Create user
  const handleCreateUser = async (data: UserFormValues) => {
    try {
      await adminUsersApi.create(data as CreateUserRequest);
      toast({
        title: "Success",
        description: "User created successfully",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
      loadUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    }
  };

  // Update user
  const handleUpdateUser = async (data: UserFormValues) => {
    if (!selectedUser) return;

    try {
      await adminUsersApi.update(selectedUser.id, data as UpdateUserRequest);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      editForm.reset();
      loadUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await adminUsersApi.delete(userToDelete.id);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  // Edit user dialog
  const openEditDialog = (user: UserType) => {
    setSelectedUser(user);
    editForm.reset({
      email: user.email,
      name: user.name || "",
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  // Delete user dialog
  const openDeleteDialog = (user: UserType) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // Table columns
  const columns: ColumnDef<UserType>[] = [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image} />
              <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white">
                {user.name?.charAt(0).toUpperCase() ||
                  user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.name || "No name"}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </div>
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
        const roleColors = {
          ADMIN: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
          INSTRUCTOR:
            "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
          STUDENT:
            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        };
        const roleIcons = {
          ADMIN: Shield,
          INSTRUCTOR: Users,
          STUDENT: UserIcon,
        };
        const Icon = roleIcons[role as keyof typeof roleIcons];

        return (
          <Badge className={roleColors[role as keyof typeof roleColors]}>
            <Icon className="w-3 h-3 mr-1" />
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div className="text-sm">
            <div className="font-medium">{date.toLocaleDateString()}</div>
            <div className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {date.toLocaleTimeString()}
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;

        return (
          <ActionDropdown>
            <DropdownMenuItem onClick={() => openEditDialog(user)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openDeleteDialog(user)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </DropdownMenuItem>
          </ActionDropdown>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Users Management
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Manage all users in the system
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(handleCreateUser)}
                className="space-y-4"
              >
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create User</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {users.length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-linear-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Students
            </CardTitle>
            <UserIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {users.filter((u) => u.role === "STUDENT").length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Instructors
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {users.filter((u) => u.role === "INSTRUCTOR").length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-linear-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
              Admins
            </CardTitle>
            <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">
              {users.filter((u) => u.role === "ADMIN").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={users}
        searchKey="users"
        title="All Users"
        description="Manage user accounts and permissions"
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleUpdateUser)}
              className="space-y-4"
            >
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update User</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user "{userToDelete?.name || userToDelete?.email}" and remove
              their data from the servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
