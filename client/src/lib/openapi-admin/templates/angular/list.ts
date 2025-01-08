import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-{{componentName}}',
  template: `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">{{ schema.title || 'List' }}</h3>
      </div>
      <div class="card-content">
        <div *ngIf="loading" class="loading">
          <div *ngFor="let i of [1,2,3]" class="skeleton-row">
            <div *ngFor="let column of columns" class="skeleton"></div>
          </div>
        </div>
        
        <div *ngIf="error" class="error">
          {{ error }}
        </div>
        
        <table *ngIf="!loading && !error" class="table">
          <thead>
            <tr>
              <th *ngFor="let column of columns">{{ column }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items">
              <td *ngFor="let column of columns">{{ item[column] }}</td>
            </tr>
          </tbody>
        </table>
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
    .table {
      @apply w-full;
    }
    .table th {
      @apply px-4 py-2 text-left bg-gray-50 font-medium text-gray-700;
    }
    .table td {
      @apply px-4 py-2 border-t;
    }
    .loading {
      @apply space-y-4;
    }
    .skeleton-row {
      @apply flex gap-4;
    }
    .skeleton {
      @apply h-6 w-24 bg-gray-200 rounded animate-pulse;
    }
    .error {
      @apply text-red-500 p-4;
    }
  `]
})
export class {{componentName}}Component implements OnInit {
  @Input() schema: any;
  @Input() path: string;

  columns: string[] = [];
  items: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.columns = Object.keys(this.schema.properties || {});
    this.fetchData();
  }

  private async fetchData() {
    try {
      this.loading = true;
      this.error = null;
      this.items = await this.http.get<any[]>(this.path).toPromise();
    } catch (err: any) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }
}
