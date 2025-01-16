import React, { useState, useCallback } from 'react';
import { OpenAPIAdmin, Framework } from '@/lib/openapi-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OpenAPIV3 } from 'openapi-types';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';

// Default OpenAPI spec for demonstration
const defaultSpec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Sample API',
    version: '1.0.0',
    description: 'A sample API for demonstrating the admin interface generator'
  },
  paths: {
    '/api/users': {
      get: {
        summary: 'List all users',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                      email: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

// Error boundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="bg-destructive/10">
          <CardContent className="pt-6">
            <div className="text-destructive">
              Error: {this.state.error?.message}
            </div>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

// Convert PostgREST Swagger to OpenAPI 3.0
const convertPostgRESTSwagger = (swagger: any): OpenAPIV3.Document => {
  if (!swagger.paths) return swagger;

  const paths: Record<string, any> = {};

  // Process each path
  Object.entries(swagger.paths).forEach(([path, methods]: [string, any]) => {
    // Skip the root path that returns the OpenAPI description
    if (path === '/') return;

    paths[path] = {};

    // Handle GET endpoints
    if (methods.get) {
      paths[path].get = {
        ...methods.get,
        responses: {
          '200': {
            description: methods.get.responses['200'].description,
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: swagger.definitions[path.slice(1)]?.properties || {},
                  },
                },
              },
            },
          },
        },
      };
    }

    // Handle POST endpoints
    if (methods.post) {
      const schema = swagger.definitions[path.slice(1)];
      paths[path].post = {
        ...methods.post,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: schema?.properties || {},
                required: schema?.required || [],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: schema?.properties || {},
                },
              },
            },
          },
        },
      };
    }
  });

  return {
    openapi: '3.0.0',
    info: swagger.info,
    paths,
    components: {
      schemas: swagger.definitions,
    },
  };
};

// Dynamic Form Component
const DynamicForm = ({ schema, endpoint }: { schema: any; endpoint: string }) => {
  const form = useForm();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Form submitted successfully',
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(data => mutation.mutate(data))} className="space-y-4">
          {Object.entries(schema.properties || {}).map(([key, prop]: [string, any]) => (
            <div key={key}>
              <Input
                {...form.register(key)}
                type={prop.type === 'number' ? 'number' : 'text'}
                placeholder={prop.description || key}
                required={schema.required?.includes(key)}
              />
            </div>
          ))}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// Dynamic List Component
const DynamicList = ({ schema, endpoint }: { schema: any; endpoint: string }) => {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data = [], isLoading, error } = useQuery({
    queryKey: [endpoint],
    queryFn: async () => {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const properties = schema.type === 'array' ? schema.items.properties : schema.properties;

  const sortedData = React.useMemo(() => {
    if (!sortField || !data) return data;
    return [...data].sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection]);

  const toggleSort = useCallback((field: string) => {
    setSortField(prev => field === prev ? prev : field);
    setSortDirection(prev => field === sortField ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
  }, [sortField]);

  if (error) {
    return (
      <Card className="bg-destructive/10">
        <CardContent className="pt-6">
          <div className="text-destructive">Error: {(error as Error).message}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {Object.entries(properties || {}).map(([key]) => (
                  <TableHead key={key}>
                    <Button
                      variant="ghost"
                      onClick={() => toggleSort(key)}
                    >
                      {key}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={Object.keys(properties || {}).length} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : sortedData.length > 0 ? (
                sortedData.map((item: any, index: number) => (
                  <TableRow key={index}>
                    {Object.keys(properties || {}).map(key => (
                      <TableCell key={key}>{item[key]}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={Object.keys(properties || {}).length} className="h-24 text-center">
                    No data found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

const queryClient = new QueryClient();

const usageCode = `// Install the package
npm install openapi-admin-generator

// Import and use
import { adminFor } from 'openapi-admin-generator';

// Generate admin interface components
const components = await adminFor(
  'https://api.example.com/openapi.json', // OpenAPI spec URL or object
  'react', // Framework: 'react' | 'vue' | 'angular'
  {
    baseUrl: '/api', // Optional base URL for API requests
    customTemplates: {}, // Optional custom component templates
  }
);

// Use the generated components
const { UserForm, UserList } = components;`;

const Demo = () => {
  const { toast } = useToast();
  const [framework, setFramework] = useState<Framework>('react');
  const [viewType, setViewType] = useState<'form' | 'list'>('form');
  const [spec, setSpec] = useState<OpenAPIV3.Document>(defaultSpec);
  const [specInput, setSpecInput] = useState(JSON.stringify(defaultSpec, null, 2));

  // Update spec and regenerate components
  const updateSpec = () => {
    try {
      const parsedSpec = JSON.parse(specInput);
      const convertedSpec = convertPostgRESTSwagger(parsedSpec);
      console.log('Converted spec:', convertedSpec);
      setSpec(convertedSpec);
      toast({
        title: 'Success',
        description: 'Schema updated successfully',
      });
    } catch (err) {
      console.error('Error updating spec:', err);
      toast({
        title: 'Error',
        description: `Failed to parse schema: ${(err as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  // Generate code for display with error handling
  const generateCode = useCallback(() => {
    try {
      const admin = new OpenAPIAdmin(spec, { framework });
      const components = admin.generateAll();
      const paths = Object.entries(spec.paths || {});

      let componentKey = '';
      if (viewType === 'form') {
        const [path, methods] = paths.find(([_, m]) => m.post) || [];
        componentKey = path ? `POST ${path} Form` : '';
      } else {
        const [path, methods] = paths.find(([_, m]) => m.get) || [];
        componentKey = path ? `GET ${path} List` : '';
      }

      if (!componentKey) {
        return `No ${viewType} component found in the specification`;
      }

      return components[componentKey]?.code || 'No component generated';
    } catch (err) {
      console.error('Error generating code:', err);
      return `Error generating code: ${(err as Error).message}`;
    }
  }, [spec, framework, viewType]);

  // Get current schema and endpoint for preview
  const previewProps = React.useMemo(() => {
    const paths = Object.entries(spec.paths || {});
    if (viewType === 'form') {
      const [path, methods] = paths.find(([_, m]) => m.post) || [];
      return path && methods?.post?.requestBody?.content?.['application/json']?.schema
        ? {
            schema: methods.post.requestBody.content['application/json'].schema,
            endpoint: path
          }
        : null;
    } else {
      const [path, methods] = paths.find(([_, m]) => m.get) || [];
      return path && methods?.get?.responses?.['200']?.content?.['application/json']?.schema
        ? {
            schema: methods.get.responses['200'].content['application/json'].schema,
            endpoint: path
          }
        : null;
    }
  }, [spec, viewType]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto p-8 space-y-8">
        <h1 className="text-3xl font-bold mb-8">OpenAPI Admin Interface Generator</h1>

        {/* Framework Selection */}
        <Card>
          <CardHeader>
            <CardTitle>1. Select Framework</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                onClick={() => setFramework('react')}
                variant={framework === 'react' ? 'default' : 'outline'}
              >
                React
              </Button>
              <Button
                onClick={() => setFramework('vue')}
                variant={framework === 'vue' ? 'default' : 'outline'}
              >
                Vue
              </Button>
              <Button
                onClick={() => setFramework('angular')}
                variant={framework === 'angular' ? 'default' : 'outline'}
              >
                Angular
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* OpenAPI Spec Editor */}
        <Card>
          <CardHeader>
            <CardTitle>2. OpenAPI Specification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={specInput}
                onChange={(e) => setSpecInput(e.target.value)}
                className="font-mono text-sm"
                rows={10}
              />
              <Button onClick={updateSpec}>Update Spec</Button>
            </div>
          </CardContent>
        </Card>

        {/* Usage Code */}
        <Card>
          <CardHeader>
            <CardTitle>3. Usage Code</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={usageCode}
              readOnly
              className="font-mono text-sm"
              rows={15}
            />
          </CardContent>
        </Card>

        {/* Generated Code */}
        <Card>
          <CardHeader>
            <CardTitle>4. Generated Component Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={() => setViewType('form')}
                variant={viewType === 'form' ? 'default' : 'outline'}
              >
                Form Component
              </Button>
              <Button
                onClick={() => setViewType('list')}
                variant={viewType === 'list' ? 'default' : 'outline'}
              >
                List Component
              </Button>
            </div>
            <Textarea
              value={generateCode()}
              readOnly
              className="font-mono text-sm"
              rows={20}
            />
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle>5. Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <div id="preview" className="space-y-4">
                {previewProps ? (
                  viewType === 'form' 
                    ? <DynamicForm {...previewProps} />
                    : <DynamicList {...previewProps} />
                ) : (
                  <div>No {viewType} configuration found in the specification</div>
                )}
              </div>
            </ErrorBoundary>
          </CardContent>
        </Card>
      </div>
    </QueryClientProvider>
  );
};

export { Demo };