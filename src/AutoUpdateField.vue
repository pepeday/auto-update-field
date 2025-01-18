<template>
	<div>
	  <v-button></v-button>
	</div>
  </template>
  
  <script setup lang="ts">
  import { watch, inject, ref } from "vue";
  import { resolveValue } from "./composables/resolveFields";
  
  const emit = defineEmits<{
	(e: 'setFieldValue', payload: { field: string; value: string }): void
  }>();
  
  interface Props {
	autoUpdateFields: Array<{ 
		watchField: string;
		updateField: string;
		value: string;
	}>;
  }
  
  const props = withDefaults(defineProps<Props>(), {
	autoUpdateFields: () => [],
  });
  
  const values = inject('values', ref<Record<string, any>>({}));
  
  // Watch only the specific watchFields
  props.autoUpdateFields.forEach(({ watchField, updateField, value: template }) => {
	watch(
	  () => values.value[watchField],
	  (newValue) => {
		console.log('template:', template);
		if (newValue !== undefined) {
			const resolvedValue = resolveValue(
				template,
				values.value
			);
			console.log('Resolved value:', resolvedValue);
			emit("setFieldValue", { field: updateField, value: resolvedValue });
		}
	  }
	);
  });
  
  </script>
  