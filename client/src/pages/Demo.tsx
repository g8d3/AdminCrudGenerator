import React, { useState } from 'react';
import { OpenAPIAdmin, Framework } from '@/lib/openapi-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useQuery, 
  useMutation, 
  QueryClient, 
  QueryClientProvider 
} from '@tanstack/react-query';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  GroupingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ChevronDown, Settings, Edit, Trash, Group, Save, X } from 'lucide-react';

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
        description: 'Returns a list of users',
        responses: {
          '200': {
            description: 'A list of users',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                      email: { type: 'string', format: 'email' },
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
        description: 'Creates a new user with the given data',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created successfully',
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
  components: {
    schemas: {}
  }
};

// Simple error boundary component
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

// Generate components for preview
const UserForm = () => {
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          mutation.mutate(Object.fromEntries(formData));
        }} className="space-y-4">
          <div>
            <input
              name="name"
              type="text"
              placeholder="Name"
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create User'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const SimpleUserList = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      console.log('Fetching users...');
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      console.log('Fetched users:', data);
      return data;
    },
  });

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {data?.map((user: any) => (
            <div key={user.id} className="p-4 border rounded">
              <div>ID: {user.id}</div>
              <div>Name: {user.name}</div>
              <div>Email: {user.email}</div>
            </div>
          ))}
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

export function Demo() {
  const { toast } = useToast();
  const [framework, setFramework] = useState<Framework>('react');
  const [viewType, setViewType] = useState<'form' | 'list'>('form');
  const [spec, setSpec] = useState<OpenAPIV3.Document>(defaultSpec);
  const [specInput, setSpecInput] = useState(JSON.stringify(defaultSpec, null, 2));

  // Update OpenAPI spec
  const updateSpec = () => {
    try {
      const newSpec = JSON.parse(specInput);
      setSpec(newSpec);
      toast({
        title: 'Success',
        description: 'OpenAPI specification updated successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Invalid JSON format',
        variant: 'destructive',
      });
    }
  };

  // Generate code for display
  const generateCode = () => {
    console.log('Generating code for:', viewType);
    try {
      const admin = new OpenAPIAdmin(spec, { framework });
      const components = admin.generateAll();
      const componentKey = viewType === 'form' ? 'POST /api/users Form' : 'GET /api/users List';
      return components[componentKey]?.code || 'No component generated';
    } catch (err) {
      console.error('Error generating code:', err);
      return `Error generating code: ${(err as Error).message}`;
    }
  };

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
                {viewType === 'form' ? <UserForm /> : <SimpleUserList />}
              </div>
            </ErrorBoundary>
          </CardContent>
        </Card>
      </div>
    </QueryClientProvider>
  );
}