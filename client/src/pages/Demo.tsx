import React, { useState } from 'react';
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
            <Input
              name="name"
              type="text"
              placeholder="Name"
              required
            />
          </div>
          <div>
            <Input
              name="email"
              type="email"
              placeholder="Email"
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

const UserList = () => {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const sortedData = React.useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => toggleSort('id')}
                  >
                    ID
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => toggleSort('name')}
                  >
                    Name
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => toggleSort('email')}
                  >
                    Email
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : sortedData.length > 0 ? (
                sortedData.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No users found.
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

export function Demo() {
  const [framework, setFramework] = useState<Framework>('react');
  const [viewType, setViewType] = useState<'form' | 'list'>('form');
  const [spec, setSpec] = useState<OpenAPIV3.Document>(defaultSpec);
  const [specInput, setSpecInput] = useState(JSON.stringify(defaultSpec, null, 2));

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
              <Button onClick={() => {
                try {
                  setSpec(JSON.parse(specInput));
                } catch (err) {
                  console.error('Invalid JSON:', err);
                }
              }}>Update Spec</Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle>3. Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Button
                onClick={() => setViewType('form')}
                variant={viewType === 'form' ? 'default' : 'outline'}
              >
                Form View
              </Button>
              <Button
                onClick={() => setViewType('list')}
                variant={viewType === 'list' ? 'default' : 'outline'}
              >
                List View
              </Button>
            </div>
            <ErrorBoundary>
              <div id="preview" className="space-y-4">
                {viewType === 'form' ? <UserForm /> : <UserList />}
              </div>
            </ErrorBoundary>
          </CardContent>
        </Card>
      </div>
    </QueryClientProvider>
  );
}