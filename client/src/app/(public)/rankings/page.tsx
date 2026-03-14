"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrophyIcon,
  SearchIcon,
  ZapIcon,
  ChevronRightIcon,
  UsersIcon,
  StarIcon,
  TrendingUpIcon,
  AwardIcon,
  MedalIcon,
  CrownIcon,
  TargetIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EXAM_CATEGORIES as CATEGORIES } from "@/constants/exams";

// ── Rankings Mock Data ───────────────────────────────────────────────────────

const TOP_STUDENTS = [
  {
    rank: 1,
    name: "Aditya Singh",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya",
    exam: "UPSC CSE 2024",
    score: "98.5%",
    accuracy: "99.2%",
    tests: 145,
    streak: 42,
  },
  {
    rank: 2,
    name: "Priya Sharma",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
    exam: "SSC CGL 2024",
    score: "97.8%",
    accuracy: "98.5%",
    tests: 210,
    streak: 65,
  },
  {
    rank: 3,
    name: "Rahul Verma",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul",
    exam: "JEE Main 2024",
    score: "97.2%",
    accuracy: "97.8%",
    tests: 180,
    streak: 28,
  },
  {
    rank: 4,
    name: "Sneha Reddy",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha",
    exam: "Banking PO 2024",
    score: "96.5%",
    accuracy: "96.9%",
    tests: 125,
    streak: 15,
  },
  {
    rank: 5,
    name: "Vikram Malhotra",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram",
    exam: "NEET UG 2024",
    score: "95.9%",
    accuracy: "96.2%",
    tests: 160,
    streak: 34,
  },
];

const CATEGORY_TOPPERS = [
  {
    catId: "upsc",
    name: "Ananya Iyer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya",
    score: "Rank 15 (Mock)",
    tests: 85,
  },
  {
    catId: "ssc",
    name: "Manish Kumar",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Manish",
    score: "Rank 2 (Mock)",
    tests: 120,
  },
  {
    catId: "banking",
    name: "Ishita Gupta",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ishita",
    score: "Rank 1 (Mock)",
    tests: 95,
  },
  {
    catId: "railways",
    name: "Sandeep Saini",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sandeep",
    score: "Rank 5 (Mock)",
    tests: 75,
  },
];

export default function RankingsLandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative py-20 md:py-32 bg-linear-to-b from-slate-900 to-slate-800 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-l from-blue-600/10 to-transparent" />
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-linear-to-r from-purple-600/10 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-linear-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-yellow-500/20">
              <CrownIcon className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tighter">
            Global <span className="text-yellow-500">Hall of Fame</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-3xl mx-auto font-medium">
            Celebrate the hard work and success of our top performers. 
            Compete with millions of aspirants and earn your place among the best.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 px-6 py-3 rounded-2xl flex items-center gap-3">
              <UsersIcon className="h-5 w-5 text-blue-400" />
              <span className="font-bold">2M+ Active Aspirants</span>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 px-6 py-3 rounded-2xl flex items-center gap-3">
              <TrophyIcon className="h-5 w-5 text-yellow-500" />
              <span className="font-bold">Daily Leaderboards</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Top 3 Spotlight ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-24 mb-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          {/* Rank 2 */}
          <div className="order-2 md:order-1">
            <Card className="bg-white dark:bg-slate-900 border-0 shadow-2xl hover:-translate-y-2 transition-transform duration-500">
              <CardHeader className="text-center pb-2">
                <div className="relative inline-block mx-auto">
                  <Avatar className="h-24 w-24 border-4 border-slate-100 dark:border-slate-800 shadow-xl">
                    <AvatarImage src={TOP_STUDENTS[1].avatar} />
                    <AvatarFallback>PS</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-slate-300 flex items-center justify-center font-bold text-slate-800 border-4 border-white dark:border-slate-900">
                    2
                  </div>
                </div>
                <CardTitle className="mt-4 text-xl font-bold">{TOP_STUDENTS[1].name}</CardTitle>
                <CardDescription className="font-semibold text-blue-600">{TOP_STUDENTS[1].exam}</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="flex justify-around py-4 border-y border-slate-50 dark:border-slate-800">
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{TOP_STUDENTS[1].score}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Score</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{TOP_STUDENTS[1].accuracy}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Accuracy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rank 1 */}
          <div className="order-1 md:order-2">
            <Card className="bg-white dark:bg-slate-900 border-0 shadow-2xl hover:-translate-y-4 transition-transform duration-500 scale-105 md:scale-110">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-500 rounded-t-2xl" />
              <CardHeader className="text-center pb-2">
                <div className="relative inline-block mx-auto">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <MedalIcon className="h-12 w-12 text-yellow-500 fill-yellow-500 animate-bounce" />
                  </div>
                  <Avatar className="h-32 w-32 border-4 border-yellow-100 dark:border-yellow-900/30 shadow-2xl">
                    <AvatarImage src={TOP_STUDENTS[0].avatar} />
                    <AvatarFallback>AS</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center font-black text-white border-4 border-white dark:border-slate-900 text-xl">
                    1
                  </div>
                </div>
                <CardTitle className="mt-4 text-2xl font-black tracking-tight">{TOP_STUDENTS[0].name}</CardTitle>
                <CardDescription className="font-bold text-yellow-600">{TOP_STUDENTS[0].exam}</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="flex justify-around py-4 border-y border-slate-50 dark:border-slate-800">
                  <div>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{TOP_STUDENTS[0].score}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Score</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{TOP_STUDENTS[0].accuracy}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Accuracy</p>
                  </div>
                </div>
                <div className="pt-2">
                  <Badge className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 font-bold px-4 py-1">
                    🏆 All India Rank 1
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rank 3 */}
          <div className="order-3">
            <Card className="bg-white dark:bg-slate-900 border-0 shadow-2xl hover:-translate-y-2 transition-transform duration-500">
              <CardHeader className="text-center pb-2">
                <div className="relative inline-block mx-auto">
                  <Avatar className="h-24 w-24 border-4 border-slate-100 dark:border-slate-800 shadow-xl">
                    <AvatarImage src={TOP_STUDENTS[2].avatar} />
                    <AvatarFallback>RV</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-amber-700 flex items-center justify-center font-bold text-white border-4 border-white dark:border-slate-900">
                    3
                  </div>
                </div>
                <CardTitle className="mt-4 text-xl font-bold">{TOP_STUDENTS[2].name}</CardTitle>
                <CardDescription className="font-semibold text-blue-600">{TOP_STUDENTS[2].exam}</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="flex justify-around py-4 border-y border-slate-50 dark:border-slate-800">
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{TOP_STUDENTS[2].score}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Score</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{TOP_STUDENTS[2].accuracy}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Accuracy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Category Wise Toppers ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-slate-50 dark:bg-slate-950 rounded-[3rem] my-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Category Champions</h2>
          <p className="text-slate-500 dark:text-slate-400">Leading the way in their respective exam paths.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORY_TOPPERS.map((topper) => {
            const cat = CATEGORIES.find(c => c.id === topper.catId);
            return (
              <Card key={topper.catId} className="bg-white dark:bg-slate-900 border-0 shadow-lg hover:shadow-xl transition-shadow group">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl bg-linear-to-br ${cat?.color} flex items-center justify-center text-xl shadow-md`}>
                      {cat?.emoji}
                    </div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{cat?.shortLabel}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-slate-50 dark:border-slate-800">
                      <AvatarImage src={topper.avatar} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{topper.name}</p>
                      <p className="text-xs text-blue-600 font-bold">{topper.score}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <TargetIcon className="h-3 w-3" /> {topper.tests} tests
                  </span>
                  <Link href={`/exams?category=${topper.catId}`} className="text-blue-600 hover:underline">
                    Join Path
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Hall of Fame List ─────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Recent Top Performers</h2>
          <div className="flex items-center gap-4">
             <div className="relative group hidden sm:block">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search students..." className="pl-10 h-10 w-64 rounded-xl border-slate-200 dark:border-slate-800" />
             </div>
             <Button variant="outline" className="rounded-xl">This Week</Button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Rank</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Student</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Exam Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Accuracy</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Streak</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {TOP_STUDENTS.map((student) => (
                  <tr key={student.rank} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        student.rank === 1 ? "bg-yellow-100 text-yellow-700" :
                        student.rank === 2 ? "bg-slate-100 text-slate-600" :
                        student.rank === 3 ? "bg-amber-100 text-amber-800" :
                        "text-slate-400"
                      }`}>
                        #{student.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-100 dark:border-slate-800">
                          <AvatarImage src={student.avatar} />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{student.name}</p>
                          <p className="text-[10px] text-slate-400">{student.tests} tests completed</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="rounded-lg font-bold text-[10px] px-2 py-0.5 border-slate-200 dark:border-slate-800">
                        {student.exam}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: student.accuracy }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{student.accuracy}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <ZapIcon className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{student.streak} days</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        View Profile <ChevronRightIcon className="h-4 w-4 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
            <Button variant="outline" className="rounded-xl font-bold gap-2">
              <TrendingUpIcon className="h-4 w-4 text-blue-600" />
              Load More Toppers
            </Button>
          </div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-linear-to-r from-blue-600 to-indigo-700 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter">Ready to see your name <br /> on the leaderboard?</h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Start practicing today and climb the ranks. Every test you take brings you closer to being a champion.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/login">
                <Button className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50 h-14 px-10 rounded-2xl font-black text-lg shadow-xl">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/exams">
                <Button variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 h-14 px-10 rounded-2xl font-black text-lg backdrop-blur-md">
                  Browse Exams
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
