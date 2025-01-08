import React from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface FormProps {
  schema: any;
  path: string;
  method?: string;
}

export function {{componentName}}({ schema, path, method = 'POST' }: FormProps) {
  const { toast } = useToast();
  const form = useForm({
    defaultValues: Object.keys(schema.properties || {}).reduce((acc, key) => ({
      ...acc,
      [key]: '',
    }), {}),
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(path, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
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
      <CardHeader>
        <CardTitle>{schema.title || 'Create New'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => mutation.mutate(data))} className="space-y-4">
            {Object.entries(schema.properties || {}).map(([key, prop]: [string, any]) => (
              <div key={key}>
                <Input
                  type={prop.type === 'number' ? 'number' : 'text'}
                  placeholder={prop.description || key}
                  {...form.register(key, {
                    required: schema.required?.includes(key),
                    min: prop.minimum,
                    max: prop.maximum,
                    pattern: prop.pattern && {
                      value: new RegExp(prop.pattern),
                      message: `Must match pattern: ${prop.pattern}`,
                    },
                  })}
                />
                {form.formState.errors[key] && (
                  <span className="text-sm text-destructive">
                    {form.formState.errors[key]?.message?.toString()}
                  </span>
                )}
              </div>
            ))}
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
  );
}
