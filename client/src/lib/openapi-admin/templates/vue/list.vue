<template>
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">{{ schema.title || 'List' }}</h3>
    </div>
    <div class="card-content">
      <div v-if="isLoading" class="loading">
        <div v-for="i in 3" :key="i" class="skeleton-row">
          <div v-for="column in columns" :key="column" class="skeleton"></div>
        </div>
      </div>
      
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      
      <table v-else class="table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column">{{ column }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in data" :key="index">
            <td v-for="column in columns" :key="column">
              {{ item[column] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';

const props = defineProps<{
  schema: any;
  path: string;
}>();

const columns = computed(() => Object.keys(props.schema.properties || {}));

const { 
  isLoading,
  error,
  data,
} = useQuery({
  queryKey: [props.path],
  queryFn: async () => {
    const res = await fetch(props.path);
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res.json();
  },
});
</script>

<style scoped>
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
</style>
