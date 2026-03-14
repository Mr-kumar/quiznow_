"use client";

/**
 * app/(student)/settings/page.tsx
 *
 * Student Settings Page — manage account, profile and preferences.
 *
 * Features:
 *  - Profile information (Name, Email)
 *  - Account security (Password change - placeholder)
 *  - App preferences (Language, Notifications)
 *  - Danger Zone (Logout)
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  UserIcon,
  LockIcon,
  BellIcon,
  LogOutIcon,
  Loader2Icon,
  CheckIcon,
  ChevronRightIcon,
  SettingsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/stores/auth-store";
import { studentKeys } from "@/api/query-keys";
import { unwrap } from "@/lib/unwrap";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Profile Section ──────────────────────────────────────────────────────────

interface ProfileFormValues {
  name: string;
  email: string;
}

function ProfileSection() {
  const { user, login, token } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: Partial<ProfileFormValues>) => {
      const res = await api.patch("/users/me", values);
      return unwrap<{ name: string; email: string }>(res);
    },
    onSuccess: (data) => {
      if (user && token) {
        login({ ...user, name: data.name, email: data.email }, token);
      }
      queryClient.invalidateQueries({ queryKey: studentKeys.profile() });
      toast.success("Profile updated successfully");
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Failed to update profile. Please try again.");
    },
  });

  if (!user) return null;

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-blue-500" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your account details and how others see you
            </CardDescription>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8"
            >
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                disabled={!isEditing}
                {...register("name", {
                  required: "Name is required",
                  minLength: { value: 2, message: "Minimum 2 characters" },
                })}
                className={cn(
                  "h-10",
                  !isEditing &&
                    "bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed border-transparent shadow-none"
                )}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                disabled={!isEditing}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                className={cn(
                  "h-10",
                  !isEditing &&
                    "bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed border-transparent shadow-none"
                )}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting || mutation.isPending}
              >
                {isSubmitting || mutation.isPending ? (
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckIcon className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  reset();
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

// ── Security Section ─────────────────────────────────────────────────────────

function SecuritySection() {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50">
        <CardTitle className="text-lg flex items-center gap-2">
          <LockIcon className="h-5 w-5 text-amber-500" />
          Security
        </CardTitle>
        <CardDescription>
          Manage your password and account security settings
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/30">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Change Password</p>
            <p className="text-xs text-slate-500">
              Update your password regularly to keep your account secure
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            Update <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/30">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Two-Factor Authentication</p>
            <p className="text-xs text-slate-500">
              Add an extra layer of security to your account
            </p>
          </div>
          <Badge
            variant="secondary"
            className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          >
            Coming Soon
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Preferences Section ──────────────────────────────────────────────────────

function PreferencesSection() {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50">
        <CardTitle className="text-lg flex items-center gap-2">
          <BellIcon className="h-5 w-5 text-purple-500" />
          Preferences
        </CardTitle>
        <CardDescription>
          Customize your experience and notification settings
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Email Notifications</p>
            <p className="text-xs text-slate-500">
              Receive updates about new tests and results
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <Separator className="opacity-50" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Push Notifications</p>
            <p className="text-xs text-slate-500">
              Get instant alerts on your mobile or desktop
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <Separator className="opacity-50" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Leaderboard Visibility</p>
            <p className="text-xs text-slate-500">
              Show your rank to other students on the leaderboard
            </p>
          </div>
          <Switch defaultChecked />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { logout } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your account settings and preferences
          </p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
          <SettingsIcon className="h-6 w-6 text-blue-600" />
        </div>
      </div>

      <div className="space-y-6">
        <ProfileSection />
        <SecuritySection />
        <PreferencesSection />

        <Card className="border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10">
          <CardHeader>
            <CardTitle className="text-lg text-red-600 dark:text-red-400">
              Danger Zone
            </CardTitle>
            <CardDescription>
              Once you log out, you will need to log in again to access your
              dashboard.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-2">
            <Button
              variant="destructive"
              className="w-full sm:w-auto font-semibold gap-2"
              onClick={logout}
            >
              <LogOutIcon className="h-4 w-4" />
              Log Out of QuizNow
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
