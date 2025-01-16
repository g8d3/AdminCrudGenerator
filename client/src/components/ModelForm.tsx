import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ModelFormProps {
  model: string;
  operations: Record<string, any>;
}

export function ModelForm({ model, operations }: ModelFormProps) {
  const queryClient = useQueryClient();
  
  // Extract fields from schema parameters
  const fields = operations?.post?.parameters
    ?.find((param: any) => param.$ref?.includes('body'))
    ?.schema?.properties || {};

  const form = useForm({
    defaultValues: Object.keys(fields).reduce((acc, field) => ({
      ...acc,
      [field]: '',
    }), {}),
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await fetch(`/api/${model}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${model}`] });
      form.reset();
    },
  });

  const onSubmit = (values: any) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {Object.entries(fields).map(([field, schema]: [string, any]) => (
          <FormField
            key={field}
            control={form.control}
            name={field}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field}</FormLabel>
                <FormControl>
                  <Input 
                    {...formField} 
                    type={schema.type === 'number' ? 'number' : 'text'}
                    placeholder={`Enter ${field}`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button 
          type="submit" 
          disabled={mutation.isPending}
          className="w-full"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Create'
          )}
        </Button>
      </form>
    </Form>
  );
}
