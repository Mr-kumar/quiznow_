"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileText,
  RefreshCw,
} from "lucide-react";
import api from "@/lib/api";

interface Question {
  id: string;
  hash: string;
  topic?: {
    id: string;
    name: string;
    subject?: string;
  };
  translations: Array<{
    lang: string;
    content: string;
    options: string[];
    explanation?: string;
  }>;
  isActive: boolean;
  createdAt: string;
}

interface Topic {
  id: string;
  name: string;
  subject: string;
}

interface PaginatedQuestionTableProps {
  selectedQuestions: string[];
  onQuestionSelect: (questionId: string) => void;
  onSelectAll: () => void;
  maxQuestions?: number;
}

const ITEMS_PER_PAGE = 20;

export function PaginatedQuestionTable({
  selectedQuestions,
  onQuestionSelect,
  onSelectAll,
  maxQuestions,
}: PaginatedQuestionTableProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchTopics = async () => {
    try {
      const res = await api.get("/topics");
      setTopics(res.data.data || res.data);
    } catch (error) {
      console.error("Failed to fetch topics:", error);
    }
  };

  const fetchQuestions = useCallback(
    async (page = 1, reset = false) => {
      if (isLoading) return;

      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: ITEMS_PER_PAGE.toString(),
          search: debouncedSearch,
          subject: selectedSubject === "all" ? "" : selectedSubject,
          topic: selectedTopic === "all" ? "" : selectedTopic,
        });

        const res = await api.get(`/questions/paginated?${params}`);
        const data = res.data;

        if (reset) {
          setQuestions(data.questions || []);
        } else {
          setQuestions((prev) =>
            page === 1
              ? data.questions || []
              : [...prev, ...(data.questions || [])],
          );
        }

        setTotalQuestions(data.total || 0);
        setTotalPages(data.totalPages || 0);
        setHasMore(data.hasMore || false);
        setCurrentPage(data.currentPage || 1);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch questions",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, selectedSubject, selectedTopic, isLoading],
  );

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    fetchQuestions(1, true);
  }, [fetchQuestions]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    setCurrentPage(1);
  };

  const handleTopicChange = (value: string) => {
    setSelectedTopic(value);
    setCurrentPage(1);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchQuestions(currentPage + 1, false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchQuestions(page, true);
    }
  };

  const getUniqueSubjects = () => {
    const subjects = new Set(topics.map((t) => t.subject).filter(Boolean));
    return Array.from(subjects);
  };

  const getFilteredTopics = () => {
    if (selectedSubject === "all") return topics;
    return topics.filter((t) => t.subject === selectedSubject);
  };

  const getQuestionPreview = (question: Question) => {
    const englishTranslation = question.translations.find(
      (t) => t.lang === "en",
    );
    return englishTranslation || question.translations[0];
  };

  const displayedQuestions = questions.slice(0, currentPage * ITEMS_PER_PAGE);
  const isAllSelected =
    displayedQuestions.length > 0 &&
    displayedQuestions.every((q) => selectedQuestions.includes(q.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Questions ({totalQuestions.toLocaleString()})
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchQuestions(1, true)}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedSubject} onValueChange={handleSubjectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {getUniqueSubjects().map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTopic} onValueChange={handleTopicChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {getFilteredTopics().map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selection Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox checked={isAllSelected} onCheckedChange={onSelectAll} />
            <span className="text-sm text-muted-foreground">
              Select all ({displayedQuestions.length} questions)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {selectedQuestions.length} selected
            </Badge>
            {maxQuestions && (
              <Badge
                variant={
                  selectedQuestions.length >= maxQuestions
                    ? "destructive"
                    : "outline"
                }
              >
                {maxQuestions - selectedQuestions.length} remaining
              </Badge>
            )}
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {isLoading && questions.length === 0 ? (
            // Initial loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No questions found matching your filters
            </div>
          ) : (
            questions.map((question, index) => {
              const preview = getQuestionPreview(question);
              const isSelected = selectedQuestions.includes(question.id);
              const isAtLimit =
                maxQuestions &&
                selectedQuestions.length >= maxQuestions &&
                !isSelected;

              return (
                <div
                  key={question.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      : isAtLimit
                        ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                        : "border-border hover:bg-muted"
                  }`}
                  onClick={() => !isAtLimit && onQuestionSelect(question.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox checked={isSelected} disabled={!!isAtLimit} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <p className="font-medium text-sm line-clamp-2">
                          {preview.content}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-xs whitespace-nowrap"
                        >
                          #{index + 1}
                        </Badge>
                      </div>

                      <div className="space-y-1 mb-2">
                        {preview.options.slice(0, 2).map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className="text-xs text-muted-foreground"
                          >
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </div>
                        ))}
                        {preview.options.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            ... and {preview.options.length - 2} more options
                          </div>
                        )}
                      </div>

                      {question.topic && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {question.topic.subject}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {question.topic.name}
                          </Badge>
                        </div>
                      )}

                      {isAtLimit && (
                        <p className="text-xs text-red-600 mt-2">
                          Maximum limit reached ({maxQuestions} questions)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalQuestions)}{" "}
              to {Math.min(currentPage * ITEMS_PER_PAGE, totalQuestions)} of{" "}
              {totalQuestions} questions
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isLoading}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Load More Button (Alternative to pagination) */}
        {hasMore && totalPages <= 1 && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading
                ? "Loading..."
                : `Load More (${questions.length}/${totalQuestions})`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
