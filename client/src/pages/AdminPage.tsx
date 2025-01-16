import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { ModelTable } from "@/components/ModelTable";
import { ModelForm } from "@/components/ModelForm";

interface Model {
  name: string;
  path: string;
  operations: Record<string, any>;
}

export function AdminPage() {
  const { data: modelsData, isLoading, error } = useQuery<{ models: Model[] }>({
    queryKey: ['/api/models'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load models: {error instanceof Error ? error.message : 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs defaultValue={modelsData?.models[0]?.name} className="w-full">
        <TabsList className="w-full flex-wrap">
          {modelsData?.models.map((model) => (
            <TabsTrigger key={model.name} value={model.name} className="text-sm">
              {model.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {modelsData?.models.map((model) => (
          <TabsContent key={model.name} value={model.name}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add {model.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ModelForm 
                    model={model.name} 
                    operations={model.operations}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{model.name} List</CardTitle>
                </CardHeader>
                <CardContent>
                  <ModelTable 
                    model={model.name} 
                    operations={model.operations}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default AdminPage;