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

  // Extract parameter names from the GET operation parameters
  const columns = operations.get?.parameters?.map((param: any) => {
    const ref = param.$ref;
    if (ref) {
      const paramName = ref.split('.').pop();
      return paramName;
    }
    return param.name;
  }).filter(Boolean) || [];

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column: string) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.isArray(data) ? (
            data.map((row: any, index: number) => (
              <TableRow key={index}>
                {columns.map((column: string) => (
                  <TableCell key={column}>{row[column]}</TableCell>
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
              <TableCell colSpan={columns.length + 1} className="text-center">
                No data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
