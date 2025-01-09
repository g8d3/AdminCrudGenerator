import { OpenAPIV3 } from 'openapi-types';
import { Framework, GeneratorOptions } from './core/types';
import { OpenAPIParser } from './core/OpenAPIParser';
import { ComponentGenerator } from './core/ComponentGenerator';

/**
 * Generate an admin interface from an OpenAPI specification
 * @param openapiSpec OpenAPI specification URL or object
 * @param framework Target framework ('react' | 'vue' | 'angular')
 * @param options Additional generator options
 * @returns Generated admin interface components
 */
export async function adminFor(
  openapiSpec: string | OpenAPIV3.Document,
  framework: Framework,
  options: Partial<Omit<GeneratorOptions, 'framework'>> = {}
) {
  // If spec is a URL, fetch it
  const spec = typeof openapiSpec === 'string'
    ? await fetch(openapiSpec).then(res => res.json())
    : openapiSpec;

  const admin = new OpenAPIAdmin(spec, { framework, ...options });
  return admin.generateAll();
}

export class OpenAPIAdmin {
  private parser: OpenAPIParser;
  private generator: ComponentGenerator;

  constructor(
    private spec: OpenAPIV3.Document,
    private options: GeneratorOptions
  ) {
    this.parser = new OpenAPIParser(spec);
    this.generator = new ComponentGenerator(options);
  }

  public generateAll() {
    const components: Record<string, any> = {};
    const operations = this.parser.getOperations();

    Object.entries(operations).forEach(([path, operation]) => {
      // Handle POST/PUT operations for forms
      if (operation.requestBody) {
        const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject;
        const schema = requestBody.content['application/json'].schema;
        const method = path.split(' ')[0];
        const endpoint = path.split(' ')[1];

        components[`${method} ${endpoint} Form`] = this.generator.generate({
          type: 'form',
          schema: schema as OpenAPIV3.SchemaObject,
          path: endpoint,
          method,
        });
      }

      // Handle GET operations for lists
      if (operation.responses?.['200']) {
        const response = operation.responses['200'] as OpenAPIV3.ResponseObject;
        const schema = response.content?.['application/json']?.schema;
        if (schema) {
          const method = path.split(' ')[0];
          const endpoint = path.split(' ')[1];

          components[`${method} ${endpoint} List`] = this.generator.generate({
            type: 'list',
            schema: schema as OpenAPIV3.SchemaObject,
            path: endpoint,
          });
        }
      }
    });

    return components;
  }

  public validateSchema(schema: OpenAPIV3.SchemaObject, data: any) {
    return this.parser.validateSchema(schema, data);
  }
}

export type {
  Framework,
  GeneratorOptions,
  ComponentConfig,
  GeneratedComponent,
  ParsedOpenAPI,
  ValidationError,
} from './core/types';