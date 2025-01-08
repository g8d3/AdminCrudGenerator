import { OpenAPIV3 } from 'openapi-types';
import { ParsedOpenAPI, ValidationError } from './types';

export class OpenAPIParser {
  private spec: OpenAPIV3.Document;

  constructor(spec: OpenAPIV3.Document) {
    this.spec = spec;
  }

  public parse(): ParsedOpenAPI {
    return {
      paths: this.spec.paths,
      schemas: this.spec.components?.schemas || {},
      info: this.spec.info,
    };
  }

  public validateSchema(schema: OpenAPIV3.SchemaObject, data: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (schema.type === 'object' && schema.properties) {
      Object.entries(schema.properties).forEach(([key, prop]) => {
        if (prop.required && !(key in data)) {
          errors.push({
            path: key,
            message: `${key} is required`,
          });
        }

        if (key in data) {
          const value = data[key];
          if (prop.type === 'string' && typeof value !== 'string') {
            errors.push({
              path: key,
              message: `${key} must be a string`,
            });
          }
          if (prop.type === 'number' && typeof value !== 'number') {
            errors.push({
              path: key,
              message: `${key} must be a number`,
            });
          }
          // Add more type validations as needed
        }
      });
    }

    return errors;
  }

  public getOperations(): Record<string, OpenAPIV3.OperationObject> {
    const operations: Record<string, OpenAPIV3.OperationObject> = {};

    Object.entries(this.spec.paths).forEach(([path, pathItem]) => {
      Object.entries(pathItem).forEach(([method, operation]) => {
        if (method !== 'parameters') {
          operations[`${method.toUpperCase()} ${path}`] = operation as OpenAPIV3.OperationObject;
        }
      });
    });

    return operations;
  }
}
