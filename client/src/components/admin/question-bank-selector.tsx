"use client";

import { useState, useEffect } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  Hash,
  Eye,
  CheckCircle2,
  Database,
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
    options: any;
    explanation?: string;
  }>;
  isActive: boolean;
  createdAt: string;
  sectionLinks: Array<{
    section: { test: { title: string } };
  }>;
}

interface QuestionBankSelectorProps {
  onQuestionsSelected: (questionIds: string[]) => void;
  maxQuestions?: number;
}

export function QuestionBankSelector({
  onQuestionsSelected,
  maxQuestions,
}: QuestionBankSelectorProps) {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [topics, setTopics] = useState<any[]>([]);

  // Fetch questions and topics
  useEffect(() => {
    fetchQuestions();
    fetchTopics();
  }, []);

  // Filter questions based on search and filters
  useEffect(() => {
    let filtered = questions;

    if (searchTerm) {
      filtered = filtered.filter((q) =>
        q.translations.some((t) =>
          t.content.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      );
    }

    if (selectedTopic && selectedTopic !== "all") {
      filtered = filtered.filter((q) => q.topic?.id === selectedTopic);
    }

    if (selectedSubject && selectedSubject !== "all") {
      filtered = filtered.filter((q) => q.topic?.subject === selectedSubject);
    }

    filtered = filtered.filter((q) => q.isActive);

    setFilteredQuestions(filtered);
  }, [questions, searchTerm, selectedTopic, selectedSubject]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/questions");
      setQuestions(res.data.data || res.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const res = await api.get("/topics");
      setTopics(res.data.data || res.data);
    } catch (error) {
      console.error("Failed to fetch topics:", error);
    }
  };

  const handleQuestionSelect = (questionId: string) => {
    if (
      maxQuestions &&
      selectedQuestions.length >= maxQuestions &&
      !selectedQuestions.includes(questionId)
    ) {
      toast({
        title: "Maximum Limit Reached",
        description: `You can only select up to ${maxQuestions} questions`,
        variant: "destructive",
      });
      return;
    }

    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId],
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      const limit = maxQuestions
        ? Math.min(filteredQuestions.length, maxQuestions)
        : filteredQuestions.length;
      setSelectedQuestions(filteredQuestions.slice(0, limit).map((q) => q.id));
    }
  };

  const handleInjectQuestions = () => {
    if (selectedQuestions.length === 0) {
      toast({
        title: "No Questions Selected",
        description: "Please select at least one question",
        variant: "destructive",
      });
      return;
    }

    onQuestionsSelected(selectedQuestions);
  };

  const getUniqueSubjects = () => {
    const subjects = new Set(topics.map((t) => t.subject).filter(Boolean));
    return Array.from(subjects);
  };

  const getQuestionPreview = (question: Question) => {
    const englishTranslation = question.translations.find(
      (t) => t.lang === "en",
    );
    return (
      englishTranslation?.content || question.translations[0]?.content || ""
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Select from Question Bank
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Choose from {questions.length} existing questions in your global
            repository
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {selectedQuestions.length} selected
            {maxQuestions && ` / ${maxQuestions}`}
          </Badge>
          <Button
            onClick={handleInjectQuestions}
            disabled={selectedQuestions.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Inject Selected Questions
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Subject" />
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

        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {topics
              .filter(
                (t) =>
                  !selectedSubject ||
                  selectedSubject === "all" ||
                  t.subject === selectedSubject,
              )
              .map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>
                  {topic.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={fetchQuestions} disabled={isLoading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Questions List */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Available Questions ({filteredQuestions.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  selectedQuestions.length === filteredQuestions.length &&
                  filteredQuestions.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Select All
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded mb-2"></div>
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
                No questions found
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className={`p-4 border rounded-lg transition-all ${
                    selectedQuestions.includes(question.id)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedQuestions.includes(question.id)}
                      onCheckedChange={() => handleQuestionSelect(question.id)}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 line-clamp-2">
                            {getQuestionPreview(question)}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            {question.topic && (
                              <Badge variant="secondary" className="text-xs">
                                {question.topic.name}
                              </Badge>
                            )}
                            {question.topic?.subject && (
                              <Badge variant="outline" className="text-xs">
                                {question.topic.subject}
                              </Badge>
                            )}
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {question.sectionLinks.length} tests
                            </span>
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {question.hash.substring(0, 8)}...
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
