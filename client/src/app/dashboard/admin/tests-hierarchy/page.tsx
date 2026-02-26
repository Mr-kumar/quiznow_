"use client";

import { useState } from "react";
import { HierarchyView } from "@/components/admin/hierarchy-view";
import { useTestHierarchy } from "@/hooks/use-test-hierarchy";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, Folder, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function TestsHierarchyPage() {
  const { hierarchy, isLoading, error, refresh } = useTestHierarchy();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { toast } = useToast();

  const handleItemSelect = (item: any) => {
    setSelectedItem(item);
  };

  const handleItemEdit = (item: any) => {
    toast({
      title: "Edit Feature",
      description: `Edit ${item.type}: ${item.name}`,
    });
  };

  const handleItemDelete = (item: any) => {
    toast({
      title: "Delete Feature",
      description: `Delete ${item.type}: ${item.name}`,
      variant: "destructive",
    });
  };

  const handleItemCreate = (type: string, parentId?: string) => {
    toast({
      title: "Create Feature",
      description: `Create new ${type}${parentId ? ` under parent ${parentId}` : ''}`,
    });
  };

  function HierarchySkeleton() {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Test Hierarchy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tests Management</h1>
          <p className="text-muted-foreground">
            Manage your test hierarchy with categories, exams, series, and tests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => handleItemCreate('category')}>
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Hierarchy View */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <HierarchySkeleton />
          ) : error ? (
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="text-red-600 mb-4">
                  <Folder className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Error Loading Hierarchy</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={refresh}>Try Again</Button>
              </CardContent>
            </Card>
          ) : (
            <HierarchyView
              data={hierarchy}
              onItemSelect={handleItemSelect}
              onItemEdit={handleItemEdit}
              onItemDelete={handleItemDelete}
              onItemCreate={handleItemCreate}
            />
          )}
        </div>

        {/* Details Panel */}
        <div>
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedItem ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedItem.name}</h3>
                    <Badge className="mt-1">{selectedItem.type}</Badge>
                  </div>
                  
                  {selectedItem.metadata && (
                    <div className="space-y-2">
                      {selectedItem.metadata.isActive !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge variant={selectedItem.metadata.isActive ? "default" : "secondary"}>
                            {selectedItem.metadata.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      )}
                      
                      {selectedItem.metadata.isLive && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Live Status</span>
                          <Badge className="bg-red-100 text-red-800">Live</Badge>
                        </div>
                      )}
                      
                      {selectedItem.metadata.isPremium && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Premium</span>
                          <Badge className="bg-yellow-100 text-yellow-800">Premium</Badge>
                        </div>
                      )}
                      
                      {selectedItem.metadata.durationMins && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Duration</span>
                          <span className="text-sm">{selectedItem.metadata.durationMins} minutes</span>
                        </div>
                      )}
                      
                      {selectedItem.metadata.totalMarks && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Marks</span>
                          <span className="text-sm">{selectedItem.metadata.totalMarks}</span>
                        </div>
                      )}
                      
                      {selectedItem.metadata.createdAt && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Created</span>
                          <span className="text-sm">
                            {new Date(selectedItem.metadata.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="pt-4 border-t space-y-2">
                    <Button onClick={() => handleItemEdit(selectedItem)} className="w-full">
                      Edit {selectedItem.type}
                    </Button>
                    <Button 
                      onClick={() => handleItemDelete(selectedItem)} 
                      variant="destructive" 
                      className="w-full"
                    >
                      Delete {selectedItem.type}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Select an item from the hierarchy to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
