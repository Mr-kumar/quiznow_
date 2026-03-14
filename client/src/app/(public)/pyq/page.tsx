"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileTextIcon,
  SearchIcon,
  CalendarIcon,
  ZapIcon,
  ChevronRightIcon,
  DownloadIcon,
  TrophyIcon,
  FilterIcon,
  ArrowRightIcon,
  HistoryIcon,
  LayersIcon,
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
import { EXAM_CATEGORIES as CATEGORIES } from "@/constants/exams";

// ── PYQ Papers Mock Data ─────────────────────────────────────────────────────

const PYQ_GROUPS = [
  {
    id: "upsc-cse",
    name: "UPSC Civil Services",
    icon: "🏛️",
    years: ["2024", "2023", "2022", "2021", "2020", "2019", "2018"],
    paperCount: 24,
    color: "from-amber-500 to-orange-600",
    desc: "Official UPSC Prelims and Mains papers with expert solutions.",
  },
  {
    id: "ssc-cgl",
    name: "SSC CGL",
    icon: "📋",
    years: ["2023", "2022", "2021", "2020", "2019", "2018", "2017"],
    paperCount: 48,
    color: "from-blue-500 to-cyan-600",
    desc: "All shifts of SSC CGL Tier-1 and Tier-2 papers from the last 7 years.",
  },
  {
    id: "banking-po",
    name: "Banking PO/Clerk",
    icon: "🏦",
    years: ["2024", "2023", "2022", "2021", "2020", "2019", "2018"],
    paperCount: 35,
    color: "from-green-500 to-emerald-600",
    desc: "Memory-based and official papers for SBI PO, IBPS PO, and RBI.",
  },
  {
    id: "railways-ntpc",
    name: "Railways RRB NTPC",
    icon: "🚆",
    years: ["2022", "2021", "2020", "2019", "2018", "2017", "2016"],
    paperCount: 42,
    color: "from-indigo-500 to-purple-600",
    desc: "Comprehensive collection of RRB NTPC and Group D past papers.",
  },
  {
    id: "neet-ug",
    name: "NEET UG",
    icon: "🩺",
    years: ["2024", "2023", "2022", "2021", "2020", "2019", "2018"],
    paperCount: 15,
    color: "from-red-500 to-rose-600",
    desc: "Medical entrance previous year papers with topic-wise weightage.",
  },
  {
    id: "jee-main",
    name: "JEE Main",
    icon: "⚙️",
    years: ["2024", "2023", "2022", "2021", "2020", "2019", "2018"],
    paperCount: 64,
    color: "from-sky-500 to-blue-600",
    desc: "All session papers of JEE Main with detailed NTA-style solutions.",
  },
];

export default function PYQLandingPage() {
  const [search, setSearch] = useState("");

  const filteredGroups = PYQ_GROUPS.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative py-16 md:py-24 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent_70%)]" />
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30 px-3 py-1 backdrop-blur-sm">
            <HistoryIcon className="h-3 w-3 mr-1.5" />
            10+ Years Coverage
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
            Crack Exams with <span className="text-blue-500">PYQ Papers</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Access authentic previous year question papers with expert-verified solutions. 
            Simulate real exam environments and understand recurring patterns.
          </p>

          <div className="max-w-xl mx-auto relative group">
            <div className="absolute inset-0 bg-blue-600/20 rounded-2xl blur-xl group-hover:bg-blue-600/30 transition-all" />
            <div className="relative bg-slate-800 rounded-2xl shadow-2xl p-2 border border-slate-700 flex items-center">
              <SearchIcon className="h-5 w-5 text-slate-500 ml-4" />
              <Input
                type="text"
                placeholder="Search for exam papers (e.g. UPSC 2023, SSC CGL)..."
                className="border-0 focus-visible:ring-0 text-lg h-12 bg-transparent text-white placeholder:text-slate-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 h-12 shadow-lg shadow-blue-600/20">
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <LayersIcon className="h-8 w-8 text-blue-600" />
              Solved Previous Papers
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Select an exam to browse its yearly paper collection
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl h-11 px-6 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <FilterIcon className="h-4 w-4 mr-2 text-slate-400" />
              Latest First
            </Button>
            <Button variant="outline" className="rounded-xl h-11 px-6 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <DownloadIcon className="h-4 w-4 mr-2 text-slate-400" />
              Bulk Download
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredGroups.map((group) => (
            <Card key={group.id} className="group border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col sm:flex-row h-full">
                <div className={`w-full sm:w-48 bg-linear-to-br ${group.color} p-8 flex flex-col items-center justify-center text-white relative`}>
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                  <span className="text-6xl mb-4 block group-hover:scale-110 transition-transform duration-500">{group.icon}</span>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{group.paperCount}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100">Papers</p>
                  </div>
                </div>
                <div className="flex-1 p-6 flex flex-col bg-white dark:bg-slate-900">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {group.desc}
                    </p>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Available Years
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.years.map((year) => (
                        <Link 
                          key={year} 
                          href={`/exams?q=${encodeURIComponent(group.name + " " + year)}`}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all"
                        >
                          {year}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-6 w-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-500">
                          {i === 3 ? "2M+" : "👤"}
                        </div>
                      ))}
                      <span className="ml-2 text-[10px] text-slate-400 font-medium self-center">+15k this week</span>
                    </div>
                    <Link href={`/exams?q=${encodeURIComponent(group.name)}`}>
                      <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 font-bold gap-2 p-0 hover:bg-transparent hover:text-blue-700">
                        View All Papers <ArrowRightIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Features Strip ───────────────────────────────────────────────── */}
        <div className="mt-20 p-10 rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="space-y-4 md:col-span-1">
              <h3 className="text-2xl font-bold">Why PYQs Matter?</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Previous year papers are the most authentic source for exam preparation.
              </p>
              <Button className="bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold">
                Get Started
              </Button>
            </div>
            
            {[
              {
                icon: ZapIcon,
                title: "Real Interface",
                desc: "Every PYQ is available in the actual NTA-style test interface.",
              },
              {
                icon: FileTextIcon,
                title: "Expert Solutions",
                desc: "Detailed step-by-step explanations for every single question.",
              },
              {
                icon: TrophyIcon,
                title: "Percentile Rank",
                desc: "See where you stand compared to students who gave the original exam.",
              },
            ].map((feature) => (
              <div key={feature.title} className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-blue-400" />
                </div>
                <h4 className="font-bold text-lg">{feature.title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category Path ─────────────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-950 py-20 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Explore by Category
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              Browse previous papers for all government and entrance exams.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {CATEGORIES.map((cat) => (
              <Link key={cat.id} href={`/exams?category=${cat.id}&q=PYQ`}>
                <div className="group bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:border-blue-500/20 transition-all duration-500 text-center">
                  <div className={`h-16 w-16 mx-auto mb-6 rounded-2xl bg-linear-to-br ${cat.color} flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform`}>
                    {cat.emoji}
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {cat.label}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">
                    10+ Years Solved
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
