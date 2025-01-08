import { ComponentConfig, GeneratorOptions, GeneratedComponent } from './types';
import { generateReactComponent } from '../generators/react';
import { generateVueComponent } from '../generators/vue';
import { generateAngularComponent } from '../generators/angular';

export class ComponentGenerator {
  constructor(private options: GeneratorOptions) {}

  public generate(config: ComponentConfig): GeneratedComponent {
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

  private getDependencies(config: ComponentConfig): string[] {
    const deps: string[] = [];

    switch (this.options.framework) {
      case 'react':
        deps.push('react', '@tanstack/react-query');
        break;
      case 'vue':
        deps.push('vue', '@tanstack/vue-query');
        break;
      case 'angular':
        deps.push('@angular/core', '@angular/common');
        break;
    }

    return deps;
  }
}