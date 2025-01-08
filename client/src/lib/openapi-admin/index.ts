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
      if (operation.requestBody) {
        const schema = (operation.requestBody as OpenAPIV3.RequestBodyObject).content['application/json'].schema;
        components[`${path}Form`] = this.generateComponent({
          type: 'form',
          schema: schema as OpenAPIV3.SchemaObject,
          path,
          method: path.split(' ')[0],
        });
      }

      if (operation.responses?.['200']) {
        const schema = (operation.responses['200'] as OpenAPIV3.ResponseObject).content?.['application/json']?.schema;
        if (schema) {
          components[`${path}List`] = this.generateComponent({
            type: 'list',
            schema: schema as OpenAPIV3.SchemaObject,
            path,
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
