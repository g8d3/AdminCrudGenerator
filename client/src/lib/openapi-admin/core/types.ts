import { OpenAPIV3 } from 'openapi-types';

export type Framework = 'react' | 'vue' | 'angular';

export interface GeneratorOptions {
  framework: Framework;
  baseUrl?: string;
  customTemplates?: Record<string, string>;
}

export interface ComponentConfig {
  type: 'form' | 'list';
  schema: OpenAPIV3.SchemaObject;
  path: string;
  method?: string;
}

export interface GeneratedComponent {
  code: string;
  dependencies: string[];
}

export interface TemplateData {
  schema: OpenAPIV3.SchemaObject;
  path: string;
  method?: string;
  options: GeneratorOptions;
}

export interface ParsedOpenAPI {
  paths: Record<string, OpenAPIV3.PathItemObject>;
  schemas: Record<string, OpenAPIV3.SchemaObject>;
  info: OpenAPIV3.InfoObject;
}

export interface ValidationError {
  path: string;
  message: string;
}

export type ValidateFunction = (data: any) => ValidationError[];
