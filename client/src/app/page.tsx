import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  BookOpen,
  Zap,
  Users,
  Award,
  CheckCircle2,
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-white via-blue-50/10 to-white dark:from-black dark:via-blue-950/20 dark:to-black">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-zinc-900 dark:text-white">
                QuizNow
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Online Exams Made{" "}
                <span className="bg-linear-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Effortless
                </span>
              </h1>
              <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-lg">
                Create, manage, and conduct online tests with advanced features.
                Streamline assessment with intelligent question banking and
                real-time analytics.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login">
                <Button className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white text-base">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                className="h-12 px-8 border-zinc-300 dark:border-zinc-700 text-base"
              >
                Watch Demo
              </Button>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  No credit card required
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  14-day free trial
                </span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="lg:block hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-700/20 rounded-2xl blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl p-8 border border-blue-200/50 dark:border-blue-800/50">
              <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-24 bg-gradient-to-r from-blue-200 to-blue-300 dark:from-blue-900 dark:to-blue-800 rounded"></div>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-2 w-2 rounded-full bg-green-500"
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold text-zinc-900 dark:text-white">
            Powerful Features for Modern Education
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Everything you need to create and manage professional online
            assessments
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: BookOpen,
              title: "Question Bank",
              description:
                "Build a comprehensive library of questions organized by topic and subject for easy reuse",
            },
            {
              icon: Zap,
              title: "Bulk Upload",
              description:
                "Import hundreds of questions at once using Excel with smart deduplication",
            },
            {
              icon: BarChart3,
              title: "Advanced Analytics",
              description:
                "Real-time insights into student performance, engagement, and learning patterns",
            },
            {
              icon: Users,
              title: "User Management",
              description:
                "Manage students, instructors, and admins with flexible role-based access control",
            },
            {
              icon: Award,
              title: "Leaderboards",
              description:
                "Gamify learning with interactive leaderboards and performance tracking",
            },
            {
              icon: Zap,
              title: "Real-time Monitoring",
              description:
                "Monitor ongoing tests with live metrics and proctoring capabilities",
            },
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors mb-4">
                  <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          {[
            { number: "10K+", label: "Users Worldwide" },
            { number: "500K+", label: "Tests Created" },
            { number: "50M+", label: "Questions in Vault" },
            { number: "99.9%", label: "Platform Uptime" },
          ].map((stat, idx) => (
            <div key={idx} className="space-y-2">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                {stat.number}
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 sm:p-16 text-center space-y-6">
          <h2 className="text-4xl font-bold text-white">
            Ready to Transform Your Assessment Process?
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Join thousands of educators and institutions using QuizNow to
            streamline online testing
          </p>
          <Link href="/login">
            <Button className="h-12 px-8 bg-white text-blue-600 hover:bg-blue-50 text-base font-semibold">
              Start Your Free Trial Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <span className="font-bold text-lg text-zinc-900 dark:text-white">
                  QuizNow
                </span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Professional online assessment platform for educators
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">
                Product
              </h3>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">
                Company
              </h3>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li>
                  <a href="#" className="hover:text-blue-600">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">
                Legal
              </h3>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                &copy; 2026 QuizNow. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="#"
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <Github className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
