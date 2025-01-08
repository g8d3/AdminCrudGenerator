import React, { useState } from 'react';
import { OpenAPIAdmin, Framework } from '@/lib/openapi-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Sample OpenAPI spec for demonstration
const sampleSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Sample API',
    version: '1.0.0',
  },
  paths: {
    '/users': {
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
      },
    },
  },
};

export function Demo() {
  const [framework, setFramework] = useState<Framework>('react');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  
  const generateInterface = () => {
    const admin = new OpenAPIAdmin(sampleSpec, { framework });
    const components = admin.generateAll();
    
    // For demo, just show the first component
    const firstComponent = Object.values(components)[0];
    setGeneratedCode(firstComponent?.code || 'No components generated');
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
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
            
            <Button onClick={generateInterface}>Generate Interface</Button>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Generated Code:</h3>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-[500px]">
                {generatedCode}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
