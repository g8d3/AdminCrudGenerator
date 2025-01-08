import React, { useState } from 'react';
import { OpenAPIAdmin, Framework } from '@/lib/openapi-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Sample OpenAPI spec for demonstration
const sampleSpec = {
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
                      id: { type: 'number' },
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
                    id: { type: 'number' },
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

// Create a new admin instance
const admin = new OpenAPIAdmin(sampleSpec, { framework: 'react' });

// Generate components
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

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          onSubmit(Object.fromEntries(formData));
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

const UserList = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {data.map((user: any) => (
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

export function Demo() {
  const [framework, setFramework] = useState<Framework>('react');
  const [viewType, setViewType] = useState<'form' | 'list'>('form');

  // Generate code for display
  const generateCode = () => {
    const admin = new OpenAPIAdmin(sampleSpec, { framework });
    const components = admin.generateAll();
    const componentKey = viewType === 'form' ? '/api/users POST Form' : '/api/users GET List';
    return components[componentKey]?.code || 'No component generated';
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto p-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>OpenAPI Admin Interface Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
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
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Code Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Code</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="form" onValueChange={(value) => setViewType(value as 'form' | 'list')}>
                <TabsList>
                  <TabsTrigger value="form">Form</TabsTrigger>
                  <TabsTrigger value="list">List</TabsTrigger>
                </TabsList>
                <TabsContent value="form">
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-[500px] text-sm">
                    {generateCode()}
                  </pre>
                </TabsContent>
                <TabsContent value="list">
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-[500px] text-sm">
                    {generateCode()}
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div id="preview" className="space-y-4">
                {viewType === 'form' ? <UserForm /> : <UserList />}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </QueryClientProvider>
  );
}