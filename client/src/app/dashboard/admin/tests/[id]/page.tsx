'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Layers, Settings, Upload, Database } from 'lucide-react';
import api from '@/lib/api';
import { BulkQuestionUpload } from '@/components/admin/bulk-upload';
import { QuestionBankSelector } from '@/components/admin/question-bank-selector';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TestAssemblyDashboard() {
  const params = useParams();
  const { toast } = useToast();
  const [testData, setTestData] = useState<any>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchTestDetails = async () => {
    try {
      const res = await api.get(`/tests/${params.id}`);
      const data = res.data.data || res.data;
      setTestData(data);
      // Set first section as active by default
      if (data.sections && data.sections.length > 0 && !activeTab) {
        setActiveTab(data.sections[0].id);
      }
    } catch (error: any) {
      toast({ 
        title: "Failed to load test details", 
        description: error?.response?.data?.message || error?.message || "Please try again",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchTestDetails();
  }, [params.id]);

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) {
      toast({
        title: "Section name required",
        description: "Please enter a section name",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreatingSection(true);
    try {
      const response = await api.post('/sections', {
        testId: params.id,
        name: newSectionName.trim(),
        order: testData?.sections?.length + 1 || 1
      });
      setNewSectionName("");
      await fetchTestDetails();
      toast({ 
        title: "Section Created", 
        description: `"${newSectionName}" added to test` 
      });
    } catch (error: any) {
      toast({ 
        title: "Failed to create section", 
        description: error?.response?.data?.message || error?.message || "Please try again",
        variant: "destructive" 
      });
    } finally {
      setIsCreatingSection(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-600">Loading test details...</p>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">Test Not Found</h3>
          <p className="text-gray-500">The test you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* TEST HEADER */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {testData.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Settings className="w-4 h-4"/>
                  <span>Duration: {testData.durationMins} mins</span>
                </div>
                <div className="flex items-center gap-1">
                  <Layers className="w-4 h-4"/>
                  <span>Marks: {testData.totalMarks}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Database className="w-4 h-4"/>
                  <span>Sections: {testData.sections?.length || 0}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                placeholder="New section name..." 
                value={newSectionName} 
                onChange={(e) => setNewSectionName(e.target.value)} 
                className="w-64"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateSection()}
              />
              <Button 
                onClick={handleCreateSection} 
                disabled={isCreatingSection || !newSectionName.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCreatingSection ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* SECTIONS */}
        {testData.sections?.length > 0 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* TABS */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2">
              <TabsList className="w-full h-auto p-1 bg-transparent space-x-1 overflow-x-auto">
                {testData.sections.map((section: any) => (
                  <TabsTrigger 
                    key={section.id} 
                    value={section.id}
                    className="px-4 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 border border-transparent rounded-md whitespace-nowrap transition-all"
                  >
                    <Layers className="w-4 h-4 mr-2"/>
                    {section.name} 
                    <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                      {section.questions?.length || 0}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* TAB CONTENT */}
            {testData.sections.map((section: any) => (
              <TabsContent key={section.id} value={section.id} className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* UPLOAD CARD */}
                  <Card className="border-green-200 dark:border-green-800">
                    <CardHeader className="bg-green-50 dark:bg-green-900/20 pb-4">
                      <CardTitle className="text-green-700 dark:text-green-400 text-lg flex items-center gap-2">
                        <Upload className="w-5 h-5"/>
                        Upload Questions
                      </CardTitle>
                      <CardDescription>
                        Upload Excel file directly to {section.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <BulkQuestionUpload sectionId={section.id} onSuccess={fetchTestDetails} />
                    </CardContent>
                  </Card>

                  {/* VAULT CARD */}
                  <Card className="border-blue-200 dark:border-blue-800">
                    <CardHeader className="bg-blue-50 dark:bg-blue-900/20 pb-4">
                      <CardTitle className="text-blue-700 dark:text-blue-400 text-lg flex items-center gap-2">
                        <Database className="w-5 h-5"/>
                        Add from Vault
                      </CardTitle>
                      <CardDescription>
                        Select existing questions for {section.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <QuestionBankSelector
                        maxQuestions={50}
                        onQuestionsSelected={async (questionIds) => {
                          try {
                            await api.post(`/sections/${section.id}/link-questions`, {
                              questionIds
                            });
                            await fetchTestDetails();
                            toast({
                              title: "Questions Added",
                              description: `${questionIds.length} questions linked to ${section.name}`
                            });
                          } catch (error: any) {
                            toast({
                              title: "Failed to link questions",
                              description: error?.response?.data?.message || error?.message || "Please try again",
                              variant: "destructive"
                            });
                          }
                        }}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* QUESTIONS TABLE */}
                <Card className="border-gray-200 dark:border-gray-700">
                  <CardHeader className="bg-gray-50 dark:bg-gray-800/50 pb-4">
                    <CardTitle className="text-gray-700 dark:text-gray-300 text-lg flex items-center gap-2">
                      <Database className="w-5 h-5"/>
                      Questions in {section.name}
                    </CardTitle>
                    <CardDescription>
                      {section.questions?.length || 0} questions in this section
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {section.questions && section.questions.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Question</TableHead>
                              <TableHead>Subject</TableHead>
                              <TableHead>Topic</TableHead>
                              <TableHead>Options</TableHead>
                              <TableHead>Answer</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {section.questions.slice(0, 5).map((question: any, index: number) => (
                              <TableRow key={`question-${question.id || index}`}>
                                <TableCell className="font-medium">
                                  {index + 1}. {question.translations?.[0]?.content?.substring(0, 80)}...
                                </TableCell>
                                <TableCell>{question.topic?.subject?.name || '-'}</TableCell>
                                <TableCell>{question.topic?.name || '-'}</TableCell>
                                <TableCell>{question.translations?.[0]?.options?.length || 0} options</TableCell>
                                <TableCell>
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                    {['A', 'B', 'C', 'D'][question.correctAnswer] || '-'}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Database className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 italic text-sm">
                          No questions yet. Upload Excel or select from Vault to get started.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Sections Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              Create your first section using the input above. For single-section exams, create one section called "Complete Paper".
            </p>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p><strong>💡 Tip:</strong> For multi-section exams, create sections like "Mathematics", "Reasoning", "Science"</p>
              <p><strong>💡 Tip:</strong> For single-section exams, create one section called "Complete Paper"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
