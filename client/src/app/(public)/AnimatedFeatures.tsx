"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  TargetIcon,
  BrainIcon,
  BarChart3Icon,
  BookOpenIcon,
  TrophyIcon,
  ShieldCheckIcon,
} from "lucide-react";

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xl transition-all duration-200"
    >
      <div
        className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 ${color}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

export function AnimatedFeatures() {
  return (
    <section id="features" className="py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge
              variant="outline"
              className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
            >
              Why QuizNow
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white"
          >
            Everything you need to succeed
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-base"
          >
            Built by exam toppers and educators. Designed for serious aspirants.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.1, delayChildren: 0.3 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <FeatureCard
            icon={TargetIcon}
            title="NTA-Style Interface"
            description="Exact replica of the real exam UI — question palette, section tabs, timer, mark for review. Zero surprises on exam day."
            color="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
          />
          <FeatureCard
            icon={BrainIcon}
            title="Bilingual Questions"
            description="Toggle between English and Hindi at any point during the exam. Questions available in both languages for all major exams."
            color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
          />
          <FeatureCard
            icon={BarChart3Icon}
            title="Deep Analytics"
            description="Know your weak topics before the real exam. Section-wise breakdown, accuracy trends, topic heatmaps — all in one place."
            color="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
          />
          <FeatureCard
            icon={BookOpenIcon}
            title="Detailed Solutions"
            description="Every question has a step-by-step explanation with LaTeX math rendering. Learn why the answer is correct, not just what it is."
            color="bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
          />
          <FeatureCard
            icon={TrophyIcon}
            title="Live Leaderboards"
            description="See where you rank among thousands of aspirants. Competitive environment keeps you motivated to improve every attempt."
            color="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
          />
          <FeatureCard
            icon={ShieldCheckIcon}
            title="Anti-Cheat Monitoring"
            description="Fullscreen enforcement, tab-switch detection, copy-paste prevention. Practice under real exam conditions every time."
            color="bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400"
          />
        </motion.div>
      </div>
    </section>
  );
}
