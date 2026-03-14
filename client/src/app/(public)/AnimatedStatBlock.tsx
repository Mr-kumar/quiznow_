"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

export function AnimatedStatBlock({
  number,
  label,
  suffix = "",
}: {
  number: number;
  label: string;
  suffix?: string;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const [hasAnimated, setHasAnimated] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      onViewportEnter={() => {
        if (!hasAnimated) {
          animate(count, number, { duration: 2, ease: "easeOut" });
          setHasAnimated(true);
        }
      }}
      className="text-center group"
    >
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-linear-to-br from-purple-500 to-blue-600 text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
        <span className="text-2xl font-bold tabular-nums flex items-center">
          <motion.span>{rounded}</motion.span>
          {suffix}
        </span>
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </motion.div>
  );
}
