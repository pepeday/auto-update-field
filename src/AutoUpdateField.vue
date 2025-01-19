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
			
			// Skip if:
			// 1. This is the initial load (oldValue is undefined)
			// 2. No real change in value
			// 3. New value is undefined/null/empty
			if (oldValue === undefined || 
				newValue === oldValue || 
				!newValue) {
				console.log('Skipping update - initial load, no change, or cleared value');
				return;
			}

			console.log('template:', template);
			console.log('values:', JSON.stringify(values.value));
			
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
				console.log('Skipping update - template resolution failed:', error);
				return;
			}
		},
		{ 
			// Don't fire immediately on setup
			immediate: false
		}
	);
});

</script>