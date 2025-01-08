import { ComponentConfig, GeneratedComponent } from '../../core/types';

export function generateAngularComponent(config: ComponentConfig): GeneratedComponent {
  const isForm = config.type === 'form';
  const componentName = `${config.schema.title || 'Component'}${isForm ? 'Form' : 'List'}`;

  const code = `
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-${componentName.toLowerCase()}',
  template: \`
    ${isForm ? generateFormTemplate(config) : generateListTemplate(config)}
  \`,
})
export class ${componentName}Component implements OnInit {
  ${generateComponentClass(config)}
}
  `;

  return {
    code,
    dependencies: ['@angular/core', '@angular/common', '@angular/forms'],
  };
}

function generateComponentClass(config: ComponentConfig): string {
  const isForm = config.type === 'form';

  if (isForm) {
    return `
  form: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
  ) {
    this.form = this.fb.group(${generateFormGroup(config.schema)});
  }

  ngOnInit(): void {}

  async onSubmit(): Promise<void> {
    if (this.form.valid) {
      this.loading = true;
      this.error = null;
      try {
        await this.http.${config.method?.toLowerCase() || 'post'}('${config.path}', this.form.value).toPromise();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    }
  }
    `;
  }

  return `
  items: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchItems();
  }

  async fetchItems(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      this.items = await this.http.get<any[]>('${config.path}').toPromise();
    } catch (err) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }
  `;
}

function generateFormTemplate(config: ComponentConfig): string {
  return `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      ${generateFormFields(config.schema)}
      <button type="submit" [disabled]="loading || !form.valid">
        {{ loading ? 'Submitting...' : 'Submit' }}
      </button>
      <div *ngIf="error" class="error">{{ error }}</div>
    </form>
  `;
}

function generateListTemplate(config: ComponentConfig): string {
  return `
    <div *ngIf="loading">Loading...</div>
    <div *ngIf="error">Error: {{ error }}</div>
    <div *ngIf="items.length">
      <div *ngFor="let item of items" class="item">
        ${generateListFields(config.schema)}
      </div>
    </div>
  `;
}

function generateFormGroup(schema: any): string {
  const fields: string[] = [];
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
      fields.push(`${key}: ['']`);
    });
  }
  return `{${fields.join(',')}}`;
}

function generateFormFields(schema: any): string {
  let fields = '';
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
      fields += `
        <div>
          <label for="${key}">${key}</label>
          <input
            id="${key}"
            type="${prop.type === 'number' ? 'number' : 'text'}"
            formControlName="${key}"
          />
        </div>
      `;
    });
  }
  return fields;
}

function generateListFields(schema: any): string {
  let fields = '';
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key]) => {
      fields += `<div>{{ item.${key} }}</div>`;
    });
  }
  return fields;
}
