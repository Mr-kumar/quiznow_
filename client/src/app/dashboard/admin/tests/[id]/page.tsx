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
      <div className="flex justify-center items-center p-12">
        <Loader2 className="animate-spin w-8 h-8" />
        <span className="ml-2">Loading test details...</span>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="text-center">
          <Database className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-700">Test Not Found</h3>
          <p className="text-zinc-500">The test you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-6">
      {/* 1. TEST HEADER */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-indigo-900 dark:text-indigo-400">{testData.title}</h1>
          <p className="text-zinc-500 mt-1 flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Settings className="w-4 h-4"/>
              Duration: {testData.durationMins} mins
            </span>
            <span className="flex items-center gap-1">
              <Layers className="w-4 h-4"/>
              Marks: {testData.totalMarks}
            </span>
            <span className="flex items-center gap-1">
              <Database className="w-4 h-4"/>
              Sections: {testData.sections?.length || 0}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Input 
             placeholder="New Section (e.g., Mathematics)" 
             value={newSectionName} 
             onChange={(e) => setNewSectionName(e.target.value)} 
             className="w-64"
             onKeyPress={(e) => e.key === 'Enter' && handleCreateSection()}
           />
           <Button 
             onClick={handleCreateSection} 
             disabled={isCreatingSection || !newSectionName.trim()}
             className="bg-indigo-600 hover:bg-indigo-700"
           >
             {isCreatingSection ? (
               <Loader2 className="w-4 h-4 animate-spin mr-1" />
             ) : (
               <Plus className="w-4 h-4 mr-1" />
             )}
             Add Section
           </Button>
        </div>
      </div>

      {/* 2. THE VISUAL TABS (Where confusion ends) */}
      {testData.sections?.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          
          <TabsList className="w-full justify-start h-auto p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-x-auto">
            {testData.sections.map((section: any) => (
              <TabsTrigger 
                key={section.id} 
                value={section.id}
                className="px-6 py-3 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm rounded-md transition-all"
              >
                <Layers className="w-4 h-4 mr-2"/>
                {section.name} 
                <span className="ml-2 px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs rounded-full">
                  {section.questions?.length || 0} Qs
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* 3. ACTIVE SECTION WORKSPACE */}
          {testData.sections.map((section: any) => (
            <TabsContent key={section.id} value={section.id} className="mt-6 space-y-6">
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-green-200 bg-green-50/30">
                  <CardHeader className="bg-green-50/50 pb-4 border-b border-green-200">
                    <CardTitle className="text-green-700 text-lg flex items-center gap-2">
                      <Upload className="w-5 h-5"/>
                      Upload New Questions
                    </CardTitle>
                    <CardDescription>Inject an Excel file directly into {section.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <BulkQuestionUpload sectionId={section.id} onSuccess={fetchTestDetails} />
                  </CardContent>
                </Card>

                <Card className="border-indigo-200 bg-indigo-50/30">
                  <CardHeader className="bg-indigo-50/50 pb-4 border-b border-indigo-200">
                    <CardTitle className="text-indigo-700 text-lg flex items-center gap-2">
                      <Database className="w-5 h-5"/>
                      Add from Global Vault
                    </CardTitle>
                    <CardDescription>Select existing questions to link to {section.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 h-full flex items-center justify-center">
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

              {/* Current Questions in Section */}
              <Card className="border-zinc-200">
                 <CardHeader className="bg-zinc-50/50 pb-4 border-b border-zinc-200">
                   <CardTitle className="text-zinc-700 text-lg flex items-center gap-2">
                     <Database className="w-5 h-5"/>
                     Questions in {section.name}
                   </CardTitle>
                   <CardDescription>
                     Currently {section.questions?.length || 0} questions in this section
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   {section.questions && section.questions.length > 0 ? (
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
                           <TableRow key={question.id}>
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
                   ) : (
                     <div className="text-center py-8">
                       <Database className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                       <p className="text-zinc-500 italic text-sm">
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
        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-300">
          <Layers className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-700">No Sections Yet</h3>
          <p className="text-zinc-500 max-w-md mx-auto">
            Create your first section using the input box above. For single-section exams, create one section called "Complete Paper".
          </p>
          <div className="mt-6 space-y-2 text-sm text-zinc-600">
            <p><strong>💡 Tip:</strong> For multi-section exams, create sections like "Mathematics", "Reasoning", "Science"</p>
            <p><strong>💡 Tip:</strong> For single-section exams, create one section called "Complete Paper"</p>
          </div>
        </div>
      )}
    </div>
  );
}
