import React, { useState } from 'react';
import { OpenAPIAdmin, Framework } from '@/lib/openapi-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Sample OpenAPI spec for demonstration
const sampleSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Sample API',
    version: '1.0.0',
  },
  paths: {
    '/api/users': {
      get: {
        responses: {
          '200': {
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
        requestBody: {
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

export function Demo() {
  const [framework, setFramework] = useState<Framework>('react');
  const [viewType, setViewType] = useState<'form' | 'list'>('form');
  const [components, setComponents] = useState<Record<string, any>>({});

  const generateInterface = () => {
    const admin = new OpenAPIAdmin(sampleSpec, { framework });
    const generatedComponents = admin.generateAll();
    setComponents(generatedComponents);
  };

  // Generate components on framework change
  React.useEffect(() => {
    generateInterface();
  }, [framework]);

  // Dynamically render the generated component
  const renderPreview = () => {
    const componentKey = viewType === 'form' ? '/api/users POST Form' : '/api/users GET List';
    const component = components[componentKey];

    if (!component) return null;

    // Create a new function component from the generated code
    const PreviewComponent = new Function('React', 'props', `
      const {useQuery, useMutation} = props.queryHooks;
      const {Form, Input, Button, Card, CardContent} = props.ui;
      ${component.code}
      return ${framework === 'react' ? componentKey : `Vue.createApp(${componentKey}).mount(el)`}
    `);

    return PreviewComponent;
  };

  return (
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
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-[500px]">
                  {components['/api/users POST Form']?.code || 'No form component generated'}
                </pre>
              </TabsContent>
              <TabsContent value="list">
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-[500px]">
                  {components['/api/users GET List']?.code || 'No list component generated'}
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
            <div id="preview">
              {renderPreview()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}