"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Layers,
  GraduationCap,
  Library,
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Zap,
  Star,
  Clock,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface HierarchyItem {
  id: string;
  name: string;
  type: "category" | "exam" | "series" | "test";
  children?: HierarchyItem[];
  metadata?: {
    isActive?: boolean;
    isLive?: boolean;
    isPremium?: boolean;
    durationMins?: number;
    totalMarks?: number;
    createdAt?: string;
  };
}

interface HierarchyViewProps {
  data: HierarchyItem[];
  selectedId?: string;
  onItemSelect?: (item: HierarchyItem) => void;
  onItemEdit?: (item: HierarchyItem) => void;
  onItemDelete?: (item: HierarchyItem) => void;
  onItemCreate?: (type: string, parentId?: string) => void;
}

// ── Per-type config ───────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  category: {
    icon: Layers,
    label: "Category",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    childType: "exam",
    childLabel: "Add Exam",
  },
  exam: {
    icon: GraduationCap,
    label: "Exam",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    childType: "series",
    childLabel: "Add Series",
  },
  series: {
    icon: Library,
    label: "Series",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
    dot: "bg-violet-500",
    badge:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
    childType: "test",
    childLabel: "Add Test",
  },
  test: {
    icon: ClipboardList,
    label: "Test",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    childType: null,
    childLabel: null,
  },
} as const;

// ── Tree node ─────────────────────────────────────────────────────────────────

function TreeNode({
  item,
  level = 0,
  isLast = false,
  parentLines = [],
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onCreate,
}: {
  item: HierarchyItem;
  level?: number;
  isLast?: boolean;
  parentLines?: boolean[];
  selectedId?: string;
  onSelect?: (item: HierarchyItem) => void;
  onEdit?: (item: HierarchyItem) => void;
  onDelete?: (item: HierarchyItem) => void;
  onCreate?: (type: string, parentId?: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const cfg = TYPE_CONFIG[item.type];
  const Icon = cfg.icon;
  const hasChildren = (item.children?.length ?? 0) > 0;
  const isSelected = selectedId === item.id;
  const childCount = item.children?.length ?? 0;

  return (
    <div className="relative">
      {/* Connecting lines from parent */}
      {level > 0 && (
        <div className="absolute left-0 top-0 bottom-0 pointer-events-none">
          {parentLines.map((showLine, idx) =>
            showLine ? (
              <div
                key={idx}
                className={`absolute top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-700 left-[${idx * 24 + 11}px]`}
              />
            ) : null,
          )}
          {/* Horizontal connector to this node */}
          <div
            className={`absolute top-[18px] w-3 h-px bg-zinc-200 dark:bg-zinc-700 left-[${(level - 1) * 24 + 11}px]`}
          />
          {/* Vertical line to this node, stopping at midpoint if last */}
          <div
            className={`absolute top-0 w-px bg-zinc-200 dark:bg-zinc-700 left-[${(level - 1) * 24 + 11}px] ${isLast ? "h-[18px]" : "h-full"}`}
          />
        </div>
      )}

      {/* Node row */}
      <div
        className={cn(
          "group relative flex items-center gap-2 py-1 pr-2 rounded-lg cursor-pointer transition-all duration-150",
          "hover:bg-zinc-100 dark:hover:bg-zinc-800/60",
          isSelected &&
            "bg-zinc-100 dark:bg-zinc-800 ring-1 ring-inset ring-zinc-300 dark:ring-zinc-600",
        )}
        style={{ paddingLeft: `${level * 24 + 8}px` }}
        onClick={() => {
          onSelect?.(item);
          if (hasChildren) setIsExpanded((p) => !p);
        }}
      >
        {/* Expand chevron */}
        <button
          className="shrink-0 h-4 w-4 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setIsExpanded((p) => !p);
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          ) : (
            <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600 block" />
          )}
        </button>

        {/* Type icon */}
        <div
          className={cn(
            "shrink-0 h-6 w-6 rounded-md flex items-center justify-center",
            cfg.bg,
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
        </div>

        {/* Name */}
        <span
          className={cn(
            "flex-1 text-sm truncate",
            isSelected
              ? "font-semibold text-zinc-900 dark:text-zinc-100"
              : "font-medium text-zinc-700 dark:text-zinc-300",
          )}
        >
          {item.name}
        </span>

        {/* Count badge */}
        {childCount > 0 && (
          <span className="shrink-0 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 tabular-nums">
            {childCount}
          </span>
        )}

        {/* Status pills */}
        {item.metadata?.isLive && (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        )}
        {item.metadata?.isPremium && (
          <Star className="shrink-0 h-3 w-3 text-amber-500 fill-amber-400" />
        )}

        {/* Actions dropdown — only visible on hover */}
        <div
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {cfg.childType && (
                <>
                  <DropdownMenuItem
                    onClick={() => onCreate?.(cfg.childType!, item.id)}
                    className="text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-2 text-zinc-400" />
                    {cfg.childLabel}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => onEdit?.(item)}
                className="text-xs"
              >
                <Pencil className="h-3.5 w-3.5 mr-2 text-zinc-400" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(item)}
                className="text-xs text-red-600 dark:text-red-400 focus:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {item.children!.map((child, idx) => (
            <TreeNode
              key={child.id}
              item={child}
              level={level + 1}
              isLast={idx === item.children!.length - 1}
              parentLines={[...parentLines, !isLast && level >= 0]}
              selectedId={selectedId}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreate={onCreate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function HierarchyView({
  data,
  selectedId,
  onItemSelect,
  onItemEdit,
  onItemDelete,
  onItemCreate,
}: HierarchyViewProps) {
  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <CardHeader className="py-4 px-5 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Layers className="h-4 w-4 text-zinc-400" />
            Test Structure
          </CardTitle>
          {/* Level legend */}
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-medium text-zinc-400">
            {(["category", "exam", "series", "test"] as const).map((t) => (
              <span key={t} className="flex items-center gap-1">
                <span
                  className={cn("h-1.5 w-1.5 rounded-full", TYPE_CONFIG[t].dot)}
                />
                {TYPE_CONFIG[t].label}
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[calc(100vh-300px)] overflow-y-auto px-3 py-3">
          {data.length === 0 ? (
            <div className="py-16 text-center">
              <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                <Layers className="h-5 w-5 text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                No categories yet
              </p>
              <p className="text-xs text-zinc-400 mb-5">
                Start by creating a category like "Railways" or "Banking"
              </p>
              <Button
                size="sm"
                onClick={() => onItemCreate?.("category")}
                className="h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create First Category
              </Button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {data.map((item, idx) => (
                <TreeNode
                  key={item.id}
                  item={item}
                  level={0}
                  isLast={idx === data.length - 1}
                  parentLines={[]}
                  selectedId={selectedId}
                  onSelect={onItemSelect}
                  onEdit={onItemEdit}
                  onDelete={onItemDelete}
                  onCreate={onItemCreate}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
