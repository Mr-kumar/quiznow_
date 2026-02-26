"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  CheckCircle2,
  TrendingUp,
  Shield,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      {/* 🎯 Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-red-600 via-orange-600 to-yellow-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Shield className="h-6 w-6 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Admin Control Center
              </h1>
              <p className="text-red-100 mt-1">
                Manage your entire quiz ecosystem with powerful tools
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-6">
            <Badge className="bg-white/20 text-white border-white/30">
              <Activity className="w-3 h-3 mr-1" />
              System Active
            </Badge>
            <Badge className="bg-green-500/20 text-green-100 border-green-400/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              All Systems Operational
            </Badge>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
      </div>

      {/* 📊 Key Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Total Users
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              1,234
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              +20% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-linear-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Active Tests
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              12
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              +2 new this week
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Completed Attempts
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              573
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              +201 since yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
              Avg. Performance
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              68%
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              +4% improvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 🚀 Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-linear-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 cursor-pointer">
          <CardHeader>
            <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-red-700 dark:text-red-300">
              Create New Test
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-400">
              Design engaging quizzes with questions and timers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-linear-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white">
              Start Creating
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-linear-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 cursor-pointer">
          <CardHeader>
            <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle className="text-indigo-700 dark:text-indigo-300">
              Manage Users
            </CardTitle>
            <CardDescription className="text-indigo-600 dark:text-indigo-400">
              View, edit, and manage user accounts and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white">
              View Users
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-linear-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 cursor-pointer">
          <CardHeader>
            <div className="h-12 w-12 rounded-xl bg-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <CardTitle className="text-teal-700 dark:text-teal-300">
              System Analytics
            </CardTitle>
            <CardDescription className="text-teal-600 dark:text-teal-400">
              Deep insights into platform usage and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-linear-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white">
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 📋 Recent Activity Table */}
      <Card className="border-0 bg-white dark:bg-zinc-900 shadow-xl">
        <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">
                        Test Completed
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                    John Doe
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                    2 mins ago
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Success
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">
                        New User Registered
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                    Jane Smith
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                    15 mins ago
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      Pending
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
