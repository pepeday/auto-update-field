<script setup lang="ts">
import { watch, inject, ref, computed } from "vue";
import { resolveValue } from "./composables/resolveFields";
import { useApi, useStores } from '@directus/extensions-sdk';
import { get } from 'lodash';

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

// Flag to prevent recursive updates
const isUpdating = ref(false);

// Watch only the specific watchFields
props.autoUpdateFields.forEach(({ watchField, updateField, value: template }) => {
	console.log('Setting up watcher for:', watchField);
	
	watch(
		// Watch ONLY the specific watchField
		() => values.value[watchField],
		async (newValue, oldValue) => {
			// Skip if we're in the middle of an update
			if (isUpdating.value) {
				return;
			}

			if (oldValue === undefined || !newValue) {
				return;
			}

			try {
				isUpdating.value = true;
				const resolvedValue = await resolveValue(
					api,
					template,
					values.value,
					props.collection,
					relationsStore
				);

				if (resolvedValue !== values.value[updateField]) {
					emit("setFieldValue", { field: updateField, value: resolvedValue });
				}
			} catch (error) {
				console.warn('Template resolution failed:', error);
			} finally {
				isUpdating.value = false;
			}
		},
		{ immediate: false }
	);
});

</script>