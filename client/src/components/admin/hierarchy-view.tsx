"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HierarchyItem {
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
  onItemSelect?: (item: HierarchyItem) => void;
  onItemEdit?: (item: HierarchyItem) => void;
  onItemDelete?: (item: HierarchyItem) => void;
  onItemCreate?: (type: string, parentId?: string) => void;
}

function TreeNode({
  item,
  level = 0,
  onSelect,
  onEdit,
  onDelete,
  onCreate,
}: {
  item: HierarchyItem;
  level?: number;
  onSelect?: (item: HierarchyItem) => void;
  onEdit?: (item: HierarchyItem) => void;
  onDelete?: (item: HierarchyItem) => void;
  onCreate?: (type: string, parentId?: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

  const getIcon = () => {
    switch (item.type) {
      case "category":
        return isExpanded ? (
          <FolderOpen className="h-4 w-4" />
        ) : (
          <Folder className="h-4 w-4" />
        );
      case "exam":
        return <FileText className="h-4 w-4" />;
      case "series":
        return <FileText className="h-4 w-4" />;
      case "test":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getBadgeColor = () => {
    switch (item.type) {
      case "category":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "exam":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "series":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "test":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusBadge = () => {
    if (!item.metadata) return null;

    const badges = [];
    if (item.metadata.isActive !== false) {
      badges.push(
        <Badge
          key="active"
          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        >
          Active
        </Badge>,
      );
    }
    if (item.metadata.isLive) {
      badges.push(
        <Badge
          key="live"
          className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        >
          Live
        </Badge>,
      );
    }
    if (item.metadata.isPremium) {
      badges.push(
        <Badge
          key="premium"
          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
        >
          Premium
        </Badge>,
      );
    }
    return badges;
  };

  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors`}
        style={{
          paddingLeft: `${level * 20 + 8}px`,
          paddingRight: "8px",
        }}
        onClick={() => {
          if (hasChildren) {
            setIsExpanded(!isExpanded);
          }
          onSelect?.(item);
        }}
      >
        {hasChildren && (
          <div className="flex items-center">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-zinc-500" />
            ) : (
              <ChevronRight className="h-3 w-3 text-zinc-500" />
            )}
          </div>
        )}
        {!hasChildren && <div className="w-4" />}

        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {item.name}
          </span>
          <Badge className={getBadgeColor()} variant="outline">
            {item.type}
          </Badge>
          {getStatusBadge()}
        </div>

        <div className="ml-auto flex items-center gap-1">
          {item.metadata?.durationMins && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {item.metadata.durationMins}min
            </span>
          )}
          {item.metadata?.totalMarks && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {item.metadata.totalMarks}pts
            </span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Plus className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {item.type === "category" && (
                <>
                  <DropdownMenuItem onClick={() => onCreate?.("exam", item.id)}>
                    <Plus className="h-3 w-3 mr-2" /> Add Exam
                  </DropdownMenuItem>
                </>
              )}
              {item.type === "exam" && (
                <>
                  <DropdownMenuItem
                    onClick={() => onCreate?.("series", item.id)}
                  >
                    <Plus className="h-3 w-3 mr-2" /> Add Test Series
                  </DropdownMenuItem>
                </>
              )}
              {item.type === "series" && (
                <>
                  <DropdownMenuItem onClick={() => onCreate?.("test", item.id)}>
                    <Plus className="h-3 w-3 mr-2" /> Add Test
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Edit className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(item)}>
                <Edit className="h-3 w-3 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(item)}
                className="text-red-600"
              >
                <Trash2 className="h-3 w-3 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-2">
          {item.children?.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              level={level + 1}
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

export function HierarchyView({
  data,
  onItemSelect,
  onItemEdit,
  onItemDelete,
  onItemCreate,
}: HierarchyViewProps) {
  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Folder className="h-5 w-5" />
          Test Hierarchy
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {data.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
              <Folder className="h-12 w-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm">No categories found</p>
              <Button
                onClick={() => onItemCreate?.("category")}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Category
              </Button>
            </div>
          ) : (
            <div className="py-2">
              {data.map((item) => (
                <TreeNode
                  key={item.id}
                  item={item}
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
