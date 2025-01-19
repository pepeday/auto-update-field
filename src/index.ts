import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './AutoUpdateField.vue';


export default defineInterface({
	id: 'auto-update-field',
	name: 'Auto Update Field',
	description: 'Adds a field that automatically updates based on the value of another field.',
	icon: 'flash_auto',
	component: InterfaceComponent,
	hideLabel: true,
	hideLoader: true,
	types: ['alias'],
	localTypes: ['presentation'],
	group: 'presentation',
	options: ( context) => [
		// Define the fields
			{
				field: 'autoUpdateFields',
				name: 'Fields to monitor for updates',
				type: 'json',
				meta: {
					width: 'full',
					interface: 'list',
					options: {
						template: '{{ field }}: {{ value }}',
						fields: [
							{
								field: 'watchField',
								name: 'Field to watch',
								type: 'string',
								meta: {
									width: 'half',
									interface: 'system-field',
									options: {
										collectionName: context.collection,
										allowPrimaryKey: false,
									},
								},
							},

							{
								field: 'updateField',
								name: 'Field to update',
								type: 'string',
								meta: {
									width: 'half',
									interface: 'system-field',
									options: {
										collectionName: context.collection,
										allowPrimaryKey: false,
									},
								},
							},

							{
								field: 'value',
								name: 'Value Template',
								type: 'string',
								meta: {
									width: 'full',
									interface: 'system-display-template',
									options: {
										collectionName: context.collection,
										placeholder: 'Enter static value or {{ field }}',
									},
								},
							},

						],
					},
				},
				schema: {
					default_value: [],
				},
			},
		],
});
