import { ComponentConfig, GeneratedComponent } from '../../core/types';
import { OpenAPIV3 } from 'openapi-types';

export function generateReactComponent(config: ComponentConfig): GeneratedComponent {
  const isForm = config.type === 'form';
  const componentName = `${config.schema.title || 'Component'}${isForm ? 'Form' : 'List'}`;

  // Get the schema for properties
  const schema = isForm 
    ? (config.schema as OpenAPIV3.SchemaObject)
    : ((config.schema as OpenAPIV3.ArraySchemaObject).items as OpenAPIV3.SchemaObject);

  const code = `
import React from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function ${componentName}() {
  ${isForm ? generateFormCode(config, schema) : generateListCode(config, schema)}
}`;

  return {
    code,
    dependencies: ['react', '@tanstack/react-query', 'react-hook-form'],
  };
}

function generateFormCode(config: ComponentConfig, schema: OpenAPIV3.SchemaObject): string {
  return `
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      ${Object.keys(schema.properties || {}).map(key => `${key}: ''`).join(',\n      ')}
    },
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch('${config.path}', {
        method: '${config.method || 'POST'}',
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
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>${schema.title || 'Create New'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => mutation.mutate(data))} className="space-y-4">
            ${generateFormFields(schema)}
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="w-full"
            >
              {mutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );`;
}

function generateListCode(config: ComponentConfig, schema: OpenAPIV3.SchemaObject): string {
  return `
  const { data, isLoading, error } = useQuery({
    queryKey: ['${config.path}'],
    queryFn: async () => {
      const res = await fetch('${config.path}');
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  if (error) return (
    <Card className="bg-destructive/10">
      <CardContent className="pt-6">
        <div className="text-destructive">Error: {error.message}</div>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>${schema.title || 'List'}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                ${Object.keys(schema.properties || {}).map(() => 
                  `<div className="h-4 bg-gray-200 rounded w-3/4"></div>`
                ).join('\n                ')}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {data?.map((item, index) => (
              <div key={index} className="p-4 border rounded">
                ${Object.keys(schema.properties || {}).map(key => 
                  `<div className="flex justify-between">
                    <span className="font-medium">${key}:</span>
                    <span>{item.${key}}</span>
                  </div>`
                ).join('\n                ')}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );`;
}

function generateFormFields(schema: OpenAPIV3.SchemaObject): string {
  let fields = '';
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
      fields += `
            <div>
              <Input
                type="${prop.type === 'number' ? 'number' : 'text'}"
                placeholder="${prop.description || key}"
                {...form.register('${key}', {
                  required: ${schema.required?.includes(key) ? 'true' : 'false'},
                  ${prop.pattern ? `pattern: { value: /${prop.pattern}/, message: 'Invalid format' },` : ''}
                  ${prop.minimum ? `min: { value: ${prop.minimum}, message: 'Minimum value is ${prop.minimum}' },` : ''}
                  ${prop.maximum ? `max: { value: ${prop.maximum}, message: 'Maximum value is ${prop.maximum}' },` : ''}
                })}
              />
              {form.formState.errors.${key} && (
                <span className="text-sm text-destructive">
                  {form.formState.errors.${key}?.message?.toString()}
                </span>
              )}
            </div>`;
    });
  }
  return fields;
}
