import { ComponentConfig, GeneratedComponent } from '../../core/types';

export function generateVueComponent(config: ComponentConfig): GeneratedComponent {
  const isForm = config.type === 'form';
  const componentName = `${config.schema.title || 'Component'}${isForm ? 'Form' : 'List'}`;

  const code = `
<template>
  ${isForm ? generateFormTemplate(config) : generateListTemplate(config)}
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuery, useMutation } from '@tanstack/vue-query';

${isForm ? generateFormScript(config) : generateListScript(config)}
</script>
  `;

  return {
    code,
    dependencies: ['vue', '@tanstack/vue-query'],
  };
}

function generateFormTemplate(config: ComponentConfig): string {
  return `
  <form @submit.prevent="onSubmit">
    <div class="space-y-4">
      ${generateFormFields(config.schema)}
      <button type="submit" :disabled="mutation.isLoading">
        {{ mutation.isLoading ? 'Submitting...' : 'Submit' }}
      </button>
    </div>
  </form>
  `;
}

function generateListTemplate(config: ComponentConfig): string {
  return `
  <div v-if="query.isLoading">Loading...</div>
  <div v-else-if="query.error">Error: {{ query.error }}</div>
  <div v-else class="space-y-4">
    <div v-for="item in query.data" :key="item.id" class="card">
      ${generateListFields(config.schema)}
    </div>
  </div>
  `;
}

function generateFormScript(config: ComponentConfig): string {
  return `
const formData = ref({});

const mutation = useMutation({
  mutationFn: async (data) => {
    const res = await fetch('${config.path}', {
      method: '${config.method || 'POST'}',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit');
    return res.json();
  },
});

const onSubmit = () => {
  mutation.mutate(formData.value);
};
  `;
}

function generateListScript(config: ComponentConfig): string {
  return `
const query = useQuery({
  queryKey: ['${config.path}'],
  queryFn: async () => {
    const res = await fetch('${config.path}');
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  },
});
  `;
}

function generateFormFields(schema: any): string {
  let fields = '';
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
      fields += `
        <div>
          <label>${key}</label>
          <input
            v-model="formData.${key}"
            type="${prop.type === 'number' ? 'number' : 'text'}"
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
