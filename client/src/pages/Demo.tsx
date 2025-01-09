import React, { useState } from 'react';
import { OpenAPIAdmin, Framework } from '@/lib/openapi-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  useQuery, 
  useMutation, 
  QueryClient, 
  QueryClientProvider 
} from '@tanstack/react-query';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  GroupingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OpenAPIV3 } from 'openapi-types';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, Settings, Edit, Trash, Group, Save, X } from 'lucide-react';

// Default OpenAPI spec for demonstration
const defaultSpec: OpenAPIV3.Document = {
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
                      id: { type: 'integer' },
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
                    id: { type: 'integer' },
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
  components: {
    schemas: {}
  }
};

// Generate components for preview
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

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          mutation.mutate(Object.fromEntries(formData));
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
  const { toast } = useToast();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});

  const columns = React.useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          ID
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue('name');
        const isEditing = editingRow === row.id;

        if (isEditing) {
          return (
            <Input
              value={editedValues['name'] ?? value}
              onChange={(e) => 
                setEditedValues(prev => ({
                  ...prev,
                  name: e.target.value
                }))
              }
              className="h-8"
            />
          );
        }

        return <div>{value as string}</div>;
      },
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue('email');
        const isEditing = editingRow === row.id;

        if (isEditing) {
          return (
            <Input
              value={editedValues['email'] ?? value}
              onChange={(e) => 
                setEditedValues(prev => ({
                  ...prev,
                  email: e.target.value
                }))
              }
              className="h-8"
            />
          );
        }

        return <div>{value as string}</div>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const isEditing = editingRow === row.id;

        return (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    updateMutation.mutate({
                      id: row.original.id,
                      data: { ...row.original, ...editedValues }
                    });
                  }}
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingRow(null);
                    setEditedValues({});
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingRow(row.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(row.original.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ], [editingRow, editedValues]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
      setEditingRow(null);
      setEditedValues({});
    },
  });

  const table = useReactTable({
    data: data || [],
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      grouping,
    },
    enableRowSelection: true,
    enableGrouping: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGroupingChange: setGrouping,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
  });

  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <Input
            placeholder="Filter names..."
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('name')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGrouping(grouping.length ? [] : ['id'])}
            >
              <Group className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, idx) => (
                  <TableRow key={idx}>
                    {columns.map((_, colIdx) => (
                      <TableCell key={colIdx}>
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const queryClient = new QueryClient();

const usageCode = `// Install the package
npm install openapi-admin-generator

// Import and use
import { adminFor } from 'openapi-admin-generator';

// Generate admin interface components
const components = await adminFor(
  'https://api.example.com/openapi.json', // OpenAPI spec URL or object
  'react', // Framework: 'react' | 'vue' | 'angular'
  {
    baseUrl: '/api', // Optional base URL for API requests
    customTemplates: {}, // Optional custom component templates
  }
);

// Use the generated components
const { UserForm, UserList } = components;`;

export function Demo() {
  const { toast } = useToast();
  const [framework, setFramework] = useState<Framework>('react');
  const [viewType, setViewType] = useState<'form' | 'list'>('form');
  const [spec, setSpec] = useState<OpenAPIV3.Document>(defaultSpec);
  const [specInput, setSpecInput] = useState(JSON.stringify(defaultSpec, null, 2));

  // Update OpenAPI spec
  const updateSpec = () => {
    try {
      const newSpec = JSON.parse(specInput);
      setSpec(newSpec);
      toast({
        title: 'Success',
        description: 'OpenAPI specification updated successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Invalid JSON format',
        variant: 'destructive',
      });
    }
  };

  // Generate code for display
  const generateCode = () => {
    const admin = new OpenAPIAdmin(spec, { framework });
    const components = admin.generateAll();
    const componentKey = viewType === 'form' ? 'POST /api/users Form' : 'GET /api/users List';
    return components[componentKey]?.code || 'No component generated';
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto p-8 space-y-8">
        <h1 className="text-3xl font-bold mb-8">OpenAPI Admin Interface Generator</h1>

        {/* Framework Selection */}
        <Card>
          <CardHeader>
            <CardTitle>1. Select Framework</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* OpenAPI Spec Editor */}
        <Card>
          <CardHeader>
            <CardTitle>2. OpenAPI Specification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea 
                value={specInput}
                onChange={(e) => setSpecInput(e.target.value)}
                className="font-mono text-sm"
                rows={10}
              />
              <Button onClick={updateSpec}>Update Spec</Button>
            </div>
          </CardContent>
        </Card>

        {/* Usage Code */}
        <Card>
          <CardHeader>
            <CardTitle>3. Usage Code</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={usageCode}
              readOnly
              className="font-mono text-sm"
              rows={15}
            />
          </CardContent>
        </Card>

        {/* Generated Code */}
        <Card>
          <CardHeader>
            <CardTitle>4. Generated Component Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={() => setViewType('form')}
                variant={viewType === 'form' ? 'default' : 'outline'}
              >
                Form Component
              </Button>
              <Button 
                onClick={() => setViewType('list')}
                variant={viewType === 'list' ? 'default' : 'outline'}
              >
                List Component
              </Button>
            </div>
            <Textarea 
              value={generateCode()}
              readOnly
              className="font-mono text-sm"
              rows={20}
            />
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle>5. Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div id="preview" className="space-y-4">
              {viewType === 'form' ? <UserForm /> : <UserList />}
            </div>
          </CardContent>
        </Card>
      </div>
    </QueryClientProvider>
  );
}