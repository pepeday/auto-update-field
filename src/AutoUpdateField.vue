<script setup lang="ts">
import { watch, inject, ref, onMounted } from "vue";
import { resolveValue } from "./composables/resolveFields";
import { useApi, useStores } from '@directus/extensions-sdk';

const { useRelationsStore } = useStores();
const relationsStore = useRelationsStore();
const api = useApi();
console.log('Version 17');
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
	loading?: boolean;
	primaryKey: string;
	initialValues: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
	autoUpdateFields: () => [],
	collection: '',
	loading: false,
	primaryKey: '',
	initialValues: () => ({}),
});

const values = inject('values', ref<Record<string, any>>({}));
const isUpdating = ref(false);
const isInitialized = ref(false);
const hasWatchers = ref(false);

console.log('Primary Key', props.primaryKey);
console.log('Initial Values', props.initialValues);

// Add loading state watcher at the top level
watch(
	() => props.loading,
	(newValue, oldValue) => {
		console.log('[AutoUpdateField] Loading changed:', {
			from: oldValue,
			to: newValue,
			primaryKey: props.primaryKey,
			hasValues: Object.keys(values.value || {}).length > 0
		});
	},
	{ immediate: true }
);

// Move setup into onMounted
onMounted(() => {
	console.log('[AutoUpdateField] Component mounted');
	isInitialized.value = true;
	
	// Create watchers only after loading is false
	watch(
		() => props.loading,
		(isLoading) => {
			if (!isLoading && values.value && isInitialized.value) {
				console.log('[AutoUpdateField] Loading complete');
				console.log('Primary Key after loading', props.primaryKey);
				console.log('Initial Values after loading', props.initialValues);
				
				// Now we know if we're dealing with a new item before setting up watchers
				console.log('[AutoUpdateField] Setting up field watchers');
				setupFieldWatchers();
			}
		},
		{ immediate: true }
	);
});

const setupFieldWatchers = () => {
	if (hasWatchers.value) {
		console.log('[AutoUpdateField] Watchers already set up, skipping');
		return;
	}

	if (!props.autoUpdateFields || !Array.isArray(props.autoUpdateFields)) {
		console.warn('[AutoUpdateField] Invalid autoUpdateFields configuration');
		return;
	}

	// Store watcher callbacks for manual triggering
	const watcherCallbacks: Array<(value: any) => void> = [];

	props.autoUpdateFields.forEach(({ watchField, updateField, value: template }) => {
		if (!watchField || !updateField || !template) {
			console.warn('[AutoUpdateField] Missing required field configuration', { watchField, updateField, template });
			return;
		}

		// In the watcher callback, only log value changes
		watch(
			() => values.value?.[watchField],
			async (newValue) => {
				console.log('[AutoUpdateField] Value changed:', {
					field: watchField,
					value: newValue,
					loading: props.loading,
					primaryKey: props.primaryKey
				});

				if (isUpdating.value || !values.value || props.loading) {
					return;
				}

				try {
					isUpdating.value = true;
					const resolvedValue = await resolveValue(
						api,
						template,
						values.value || {},
						props.collection,
						relationsStore
					);

					if (resolvedValue !== values.value?.[updateField]) {
						emit("setFieldValue", { field: updateField, value: resolvedValue });
					}
				} catch (error) {
					console.warn('[AutoUpdateField] Template resolution failed:', error);
				} finally {
					isUpdating.value = false;
				}
			},
			{ immediate: false }
		);

		// Store the callback for manual triggering
		watcherCallbacks.push((value) => {
			if (values.value?.[watchField]) {
				console.log('[AutoUpdateField] Manually triggering watcher for:', watchField);
				isUpdating.value = false; // Reset updating flag for manual trigger
				return resolveValue(
					api,
					template,
					values.value,
					props.collection,
					relationsStore
				).then((resolvedValue) => {
					if (resolvedValue !== values.value?.[updateField]) {
						emit("setFieldValue", { field: updateField, value: resolvedValue });
					}
				});
			}
		});
	});

	// If this is a new item and we have values, manually trigger the watchers
	if (props.primaryKey === '+' && values.value && Object.keys(values.value).length > 0) {
		console.log('[AutoUpdateField] New item with values detected, manually triggering watchers');
		Promise.all(watcherCallbacks.map(callback => callback(values.value))).catch(error => {
			console.warn('[AutoUpdateField] Error during manual watcher trigger:', error);
		});
	}

	hasWatchers.value = true;
};
</script>

<template>
	<!-- Empty template but required for Vue component -->
	<div class="auto-update-field" style="display: none;"></div>
</template>
