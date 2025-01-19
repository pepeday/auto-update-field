<template>
	<div>
		<v-button></v-button>
	</div>
</template>

<script setup lang="ts">
import { watch, inject, ref } from "vue";
import { resolveValue } from "./composables/resolveFields";
import { useApi, useStores } from '@directus/extensions-sdk';

const { useRelationsStore } = useStores();
const relationsStore = useRelationsStore();
const api = useApi();

const emit = defineEmits<{
	(e: 'setFieldValue', payload: { field: string; value: string }): void
}>();

interface Props {
	autoUpdateFields: Array<{
		watchField: string;
		updateField: string;
		value: string;
	}>;
	collection: string;
}

const props = withDefaults(defineProps<Props>(), {
	autoUpdateFields: () => [],
	collection: '',
});

const values = inject('values', ref<Record<string, any>>({}));

// Watch only the specific watchFields
props.autoUpdateFields.forEach(({ watchField, updateField, value: template }) => {
	console.log('Setting up watcher for:', watchField);
	
	watch(
		() => values.value[watchField],
		async (newValue, oldValue) => {
			console.log(`Watch triggered for ${watchField}:`, { newValue, oldValue });
			
			// Skip if this is the initial value or no real change
			if (newValue === oldValue || newValue === undefined) {
				console.log('Skipping update - no user change detected');
				return;
			}

			console.log('template:', template);
			console.log('values:', JSON.stringify(values.value));
			
			if (newValue !== undefined) {
				try {
					const resolvedValue = await resolveValue(
						api,
						template,
						values.value,
						props.collection,
						relationsStore
					);
					console.log('Resolved value:', resolvedValue);
					emit("setFieldValue", { field: updateField, value: resolvedValue });
				} catch (error) {
					console.error('Failed to resolve template:', error);
				}
			}
		}
	);
});

</script>