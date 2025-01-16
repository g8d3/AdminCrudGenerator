import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ModelTableProps {
  model: string;
  operations: Record<string, any>;
}

export function ModelTable({ model, operations }: ModelTableProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/${model}`],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading data: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  // Extract fields from the schema parameters
  const fields = operations?.get?.parameters
    ?.filter((param: any) => param.$ref?.includes('rowFilter'))
    ?.map((param: any) => {
      const ref = param.$ref;
      if (ref) {
        // Extract the field name from the parameter reference
        // Format: "#/parameters/rowFilter.model.fieldname"
        const parts = ref.split('.');
        return parts[parts.length - 1];
      }
      return null;
    })
    .filter(Boolean) || [];

  // Handle the case where the response is the model operation details
  const tableData = Array.isArray(data) ? data : (data?.rows || []);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {fields.map((field: string) => (
              <TableHead key={field}>{field}</TableHead>
            ))}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.length > 0 ? (
            tableData.map((row: any, index: number) => (
              <TableRow key={index}>
                {fields.map((field: string) => (
                  <TableCell key={field}>{row[field]}</TableCell>
                ))}
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="destructive" size="sm">Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={fields.length + 1} className="text-center">
                No data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}