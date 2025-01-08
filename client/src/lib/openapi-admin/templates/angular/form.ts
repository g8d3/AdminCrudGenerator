import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-{{componentName}}',
  template: `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">{{ schema.title || 'Create New' }}</h3>
      </div>
      <div class="card-content">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <ng-container *ngFor="let field of fields">
            <div class="form-field">
              <label [for]="field.key" class="form-label">{{ field.key }}</label>
              <input
                [id]="field.key"
                [type]="field.type"
                [formControlName]="field.key"
                class="form-input"
                [placeholder]="field.description || field.key"
              />
              <span *ngIf="form.get(field.key)?.errors && form.get(field.key)?.touched" class="error-text">
                {{ getErrorMessage(field.key) }}
              </span>
            </div>
          </ng-container>
          
          <button 
            type="submit" 
            [disabled]="isSubmitting || !form.valid"
            class="submit-button"
          >
            {{ isSubmitting ? 'Submitting...' : 'Submit' }}
          </button>
          
          <div *ngIf="error" class="error-message">
            {{ error }}
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .card {
      @apply bg-white rounded-lg shadow-sm;
    }
    .card-header {
      @apply p-4 border-b;
    }
    .card-title {
      @apply text-lg font-semibold;
    }
    .card-content {
      @apply p-4;
    }
    .form-field {
      @apply space-y-1;
    }
    .form-label {
      @apply block text-sm font-medium text-gray-700;
    }
    .form-input {
      @apply w-full px-3 py-2 border rounded-md;
    }
    .error-text {
      @apply text-sm text-red-500;
    }
    .submit-button {
      @apply w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50;
    }
    .error-message {
      @apply mt-4 p-4 bg-red-50 text-red-500 rounded-md;
    }
  `]
})
export class {{componentName}}Component implements OnInit {
  @Input() schema: any;
  @Input() path: string;
  @Input() method = 'POST';

  form: FormGroup;
  isSubmitting = false;
  error: string | null = null;
  fields: Array<{key: string, type: string, description?: string}> = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    const group: any = {};
    this.fields = Object.entries(this.schema.properties || {}).map(([key, prop]: [string, any]) => {
      const validators = [];
      if (this.schema.required?.includes(key)) {
        validators.push(Validators.required);
      }
      if (prop.minimum !== undefined) {
        validators.push(Validators.min(prop.minimum));
      }
      if (prop.maximum !== undefined) {
        validators.push(Validators.max(prop.maximum));
      }
      if (prop.pattern) {
        validators.push(Validators.pattern(prop.pattern));
      }

      group[key] = ['', validators];
      return {
        key,
        type: prop.type === 'number' ? 'number' : 'text',
        description: prop.description
      };
    });

    this.form = this.fb.group(group);
  }

  async onSubmit() {
    if (this.form.valid) {
      this.isSubmitting = true;
      this.error = null;

      try {
        await this.http.request(
          this.method,
          this.path,
          {
            body: this.form.value,
            headers: { 'Content-Type': 'application/json' }
          }
        ).toPromise();
        
        this.form.reset();
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors) return '';

    if (control.errors['required']) {
      return `${fieldName} is required`;
    }
    if (control.errors['min']) {
      return `${fieldName} must be at least ${control.errors['min'].min}`;
    }
    if (control.errors['max']) {
      return `${fieldName} must be at most ${control.errors['max'].max}`;
    }
    if (control.errors['pattern']) {
      return `${fieldName} has invalid format`;
    }

    return 'Invalid value';
  }
}
