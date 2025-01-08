import { ComponentConfig, GeneratedComponent } from '../../core/types';

export function generateReactComponent(config: ComponentConfig): GeneratedComponent {
  const isForm = config.type === 'form';
  const componentName = `${config.schema.title || 'Component'}${isForm ? 'Form' : 'List'}`;

  const code = `
import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function ${componentName}() {
  ${isForm ? generateFormCode(config) : generateListCode(config)}
}
  `;

  return {
    code,
    dependencies: ['react', '@tanstack/react-query'],
  };
}

function generateFormCode(config: ComponentConfig): string {
  return `
  const form = useForm({
    defaultValues: {},
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch('${config.path}', {
        method: '${config.method || 'POST'}',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to submit');
      return res.json();
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(data => mutation.mutate(data))}>
        <Card>
          <CardContent className="pt-6">
            ${generateFormFields(config.schema)}
            <Button type="submit">Submit</Button>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
  `;
}

function generateListCode(config: ComponentConfig): string {
  return `
  const query = useQuery({
    queryKey: ['${config.path}'],
    queryFn: async () => {
      const res = await fetch('${config.path}');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  if (query.isLoading) return <div>Loading...</div>;
  if (query.error) return <div>Error: {query.error.message}</div>;

  return (
    <div className="space-y-4">
      {query.data.map((item) => (
        <Card key={item.id}>
          <CardContent className="pt-6">
            ${generateListFields(config.schema)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
  `;
}

function generateFormFields(schema: any): string {
  let fields = '';
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
      fields += `
        <div className="space-y-2">
          <Input
            label="${key}"
            {...form.register('${key}')}
            type="${prop.type === 'number' ? 'number' : 'text'}"
          />
        </div>
      `;
    });
  }
  return fields;
}

function generateListFields(schema: any): string {
  let fields = '';
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
      fields += `<div>{item.${key}}</div>`;
    });
  }
  return fields;
}
