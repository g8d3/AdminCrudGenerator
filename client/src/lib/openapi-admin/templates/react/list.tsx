import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface ListProps {
  schema: any;
  path: string;
}

export function {{componentName}}({ schema, path }: ListProps) {
  const query = useQuery({
    queryKey: [path],
    queryFn: async () => {
      const res = await fetch(path);
      if (!res.ok) {
        throw new Error(await res.text());
      }
      return res.json();
    },
  });

  if (query.error) {
    return (
      <Card className="bg-destructive/10">
        <CardContent className="pt-6">
          <div className="text-destructive">Error: {query.error.message}</div>
        </CardContent>
      </Card>
    );
  }

  const columns = Object.keys(schema.properties || {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>{schema.title || 'List'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(column => (
                <TableHead key={column}>
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isPending ? (
              [...Array(3)].map((_, idx) => (
                <TableRow key={idx}>
                  {columns.map(column => (
                    <TableCell key={column}>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              query.data?.map((item: any, idx: number) => (
                <TableRow key={idx}>
                  {columns.map(column => (
                    <TableCell key={column}>
                      {item[column]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
