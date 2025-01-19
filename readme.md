```
# AutoUpdateField Directus Extension

This Directus extension monitors a field in the item page and automatically updates another field in the item page based on configurable logic. It is designed to streamline workflows and ensure data consistency within your Directus instance.

## Features

- Watches a field in the item page.
- Automatically updates fields based on a value template.

## Installation

1. Clone the repository into the `extensions/` folder of your Directus project:

   ```
   git clone <repository-url> ./extensions/auto-update-field
   ```

2. Restart the server or hot reload the extensions:

3. The extension will now be available in the Directus interface.

## Usage

1. Navigate to the collection where you want to use the auto-update functionality.
2. Configure the fields and logic for auto-updating by setting the Watch Field, Update Field, and Value Template.
3. The extension will automatically apply the defined logic whenever an Update Field is changed.

## Files

### AutoUpdateField.vue
Defines the user interface for configuring and managing the auto-update functionality.

### index.ts
Entry point for registering the extension with Directus.

### resolveFields.ts
Contains the core logic for resolving and updating fields. Modify this file to define the specific conditions and update logic for your fields.

## Bugs / Things to be aware of

- Date fields are supported! Use the built-in date syntax date([number][type]). Examples:
  - 2025-01-19(1, 'day') --> 2025-01-20
  - 2025-01-19(1, 'week') --> 2025-01-26
  - 2025-01-19(1, 'month') --> 2025-02-19
  - 2025-01-19(1, 'year') --> 2026-01-19
- The extension will not update the field if any mustache template cannot be resolved or are undefined.
- The extension will behave strangely if you're trying to input more characters than the Update Field interface can accept.

## Contributing

Contributions are welcome!
## License

This project is licensed under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions, feel free to open an issue in this repository.

---

Enjoy seamless field updates with the AutoUpdateField Directus extension!
```
