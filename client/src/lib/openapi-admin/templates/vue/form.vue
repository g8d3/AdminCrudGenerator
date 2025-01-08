<template>
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">{{ schema.title || 'Create New' }}</h3>
    </div>
    <div class="card-content">
      <form @submit.prevent="onSubmit" class="space-y-4">
        <template v-for="(prop, key) in schema.properties" :key="key">
          <div class="form-field">
            <label :for="key" class="form-label">{{ key }}</label>
            <input
              :id="key"
              v-model="formData[key]"
              :type="prop.type === 'number' ? 'number' : 'text'"
              :required="schema.required?.includes(key)"
              :min="prop.minimum"
              :max="prop.maximum"
              :pattern="prop.pattern"
              class="form-input"
              :placeholder="prop.description || key"
            />
            <span v-if="errors[key]" class="error-text">
              {{ errors[key] }}
            </span>
          </div>
        </template>
        <button 
          type="submit" 
          :disabled="isSubmitting"
          class="submit-button"
        >
          {{ isSubmitting ? 'Submitting...' : 'Submit' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMutation } from '@tanstack/vue-query';

const props = defineProps<{
  schema: any;
  path: string;
  method?: string;
}>();

const formData = ref({});
const errors = ref({});
const isSubmitting = ref(false);

// Initialize form data with empty values
Object.keys(props.schema.properties || {}).forEach(key => {
  formData.value[key] = '';
});

const mutation = useMutation({
  mutationFn: async (data: any) => {
    const res = await fetch(props.path, {
      method: props.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res.json();
  },
  onSuccess: () => {
    // Reset form
    Object.keys(formData.value).forEach(key => {
      formData.value[key] = '';
    });
    errors.value = {};
  },
  onError: (error: Error) => {
    errors.value = { submit: error.message };
  },
});

const onSubmit = async () => {
  errors.value = {};
  isSubmitting.value = true;
  
  try {
    await mutation.mutateAsync(formData.value);
  } finally {
    isSubmitting.value = false;
  }
};
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
</style>
