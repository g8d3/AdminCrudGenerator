import { OpenAPIV3 } from 'openapi-types';
import { OpenAPIParser } from './core/OpenAPIParser';
import { ComponentGenerator } from './core/ComponentGenerator';
import { 
  Framework, 
  GeneratorOptions, 
  ComponentConfig,
  GeneratedComponent
} from './core/types';
import { generateReactComponent } from './generators/react';
import { generateVueComponent } from './generators/vue';
import { generateAngularComponent } from './generators/angular';

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

  public generateComponent(config: ComponentConfig): GeneratedComponent {
    switch (this.options.framework) {
      case 'react':
        return generateReactComponent(config);
      case 'vue':
        return generateVueComponent(config);
      case 'angular':
        return generateAngularComponent(config);
      default:
        throw new Error(`Unsupported framework: ${this.options.framework}`);
    }
  }

  public generateAll(): Record<string, GeneratedComponent> {
    const components: Record<string, GeneratedComponent> = {};
    const operations = this.parser.getOperations();

    Object.entries(operations).forEach(([path, operation]) => {
      // Handle POST/PUT operations for forms
      if (operation.requestBody) {
        const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject;
        const schema = requestBody.content['application/json'].schema;
        const method = path.split(' ')[0];
        const endpoint = path.split(' ')[1];

        components[`${method} ${endpoint} Form`] = this.generateComponent({
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

          components[`${method} ${endpoint} List`] = this.generateComponent({
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