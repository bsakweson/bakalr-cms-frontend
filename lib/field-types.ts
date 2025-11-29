// Field type definitions for content type builder

export interface FieldTypeDefinition {
  type: string;
  label: string;
  icon: string;
  description: string;
  defaultConfig: {
    label: string;
    type: string;
    required: boolean;
    description?: string;
    [key: string]: unknown;
  };
  configurableProperties: {
    name: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'array';
    options?: { value: string; label: string }[];
    default?: unknown;
  }[];
}

export const FIELD_TYPES: FieldTypeDefinition[] = [
  {
    type: 'text',
    label: 'Text',
    icon: '📝',
    description: 'Single-line text input',
    defaultConfig: {
      label: 'Text Field',
      type: 'text',
      required: false,
      description: '',
    },
    configurableProperties: [
      { name: 'label', label: 'Label', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'required', label: 'Required', type: 'boolean', default: false },
      { name: 'placeholder', label: 'Placeholder', type: 'text' },
      { name: 'defaultValue', label: 'Default Value', type: 'text' },
      { name: 'minLength', label: 'Min Length', type: 'number' },
      { name: 'maxLength', label: 'Max Length', type: 'number' },
    ],
  },
  {
    type: 'textarea',
    label: 'Textarea',
    icon: '📄',
    description: 'Multi-line text input',
    defaultConfig: {
      label: 'Textarea Field',
      type: 'textarea',
      required: false,
      description: '',
    },
    configurableProperties: [
      { name: 'label', label: 'Label', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'required', label: 'Required', type: 'boolean', default: false },
      { name: 'placeholder', label: 'Placeholder', type: 'text' },
      { name: 'rows', label: 'Rows', type: 'number', default: 4 },
      { name: 'maxLength', label: 'Max Length', type: 'number' },
    ],
  },
  {
    type: 'richtext',
    label: 'Rich Text',
    icon: '✍️',
    description: 'WYSIWYG editor for formatted content',
    defaultConfig: {
      label: 'Rich Text Field',
      type: 'richtext',
      required: false,
      description: '',
    },
    configurableProperties: [
      { name: 'label', label: 'Label', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'required', label: 'Required', type: 'boolean', default: false },
      { name: 'placeholder', label: 'Placeholder', type: 'text' },
    ],
  },
  {
    type: 'number',
    label: 'Number',
    icon: '🔢',
    description: 'Numeric input',
    defaultConfig: {
      label: 'Number Field',
      type: 'number',
      required: false,
      description: '',
    },
    configurableProperties: [
      { name: 'label', label: 'Label', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'required', label: 'Required', type: 'boolean', default: false },
      { name: 'min', label: 'Minimum Value', type: 'number' },
      { name: 'max', label: 'Maximum Value', type: 'number' },
      { name: 'step', label: 'Step', type: 'number', default: 1 },
      { name: 'defaultValue', label: 'Default Value', type: 'number' },
    ],
  },
  {
    type: 'email',
    label: 'Email',
    icon: '📧',
    description: 'Email input with validation',
    defaultConfig: {
      label: 'Email Field',
      type: 'email',
      required: false,
      description: '',
    },
    configurableProperties: [
      { name: 'label', label: 'Label', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'required', label: 'Required', type: 'boolean', default: false },
      { name: 'placeholder', label: 'Placeholder', type: 'text' },
    ],
  },
  {
    type: 'url',
    label: 'URL',
    icon: '🔗',
    description: 'URL input with validation',
    defaultConfig: {
      label: 'URL Field',
      type: 'url',
      required: false,
      description: '',
    },
    configurableProperties: [
      { name: 'label', label: 'Label', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'required', label: 'Required', type: 'boolean', default: false },
      { name: 'placeholder', label: 'Placeholder', type: 'text' },
    ],
  },
  {
    type: 'select',
    label: 'Select',
    icon: '📋',
    description: 'Dropdown with predefined options',
    defaultConfig: {
      label: 'Select Field',
      type: 'select',
      required: false,
      description: '',
      options: [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ],
    },
    configurableProperties: [
      { name: 'label', label: 'Label', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'required', label: 'Required', type: 'boolean', default: false },
      { name: 'options', label: 'Options (JSON)', type: 'textarea' },
    ],
  },
  {
    type: 'boolean',
    label: 'Boolean',
    icon: '✅',
    description: 'Checkbox for true/false values',
    defaultConfig: {
      label: 'Boolean Field',
      type: 'boolean',
      required: false,
      description: '',
      defaultValue: false,
    },
    configurableProperties: [
      { name: 'label', label: 'Label', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'defaultValue', label: 'Default Value', type: 'boolean', default: false },
    ],
  },
  {
    type: 'image',
    label: 'Image',
    icon: '🖼️',
    description: 'Image upload with media picker',
    defaultConfig: {
      label: 'Image Field',
      type: 'image',
      required: false,
      description: '',
    },
    configurableProperties: [
      { name: 'label', label: 'Label', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'required', label: 'Required', type: 'boolean', default: false },
    ],
  },
  {
    type: 'file',
    label: 'File',
    icon: '📎',
    description: 'File upload with media picker',
    defaultConfig: {
      label: 'File Field',
      type: 'file',
      required: false,
      description: '',
    },
    configurableProperties: [
      { name: 'label', label: 'Label', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'required', label: 'Required', type: 'boolean', default: false },
    ],
  },
  {
    type: 'date',
    label: 'Date',
    icon: '📅',
    description: 'Date picker',
    defaultConfig: {
      label: 'Date Field',
      type: 'date',
      required: false,
      description: '',
    },
    configurableProperties: [
      { name: 'label', label: 'Label', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'required', label: 'Required', type: 'boolean', default: false },
    ],
  },
  {
    type: 'datetime',
    label: 'Date & Time',
    icon: '🕐',
    description: 'Date and time picker',
    defaultConfig: {
      label: 'DateTime Field',
      type: 'datetime',
      required: false,
      description: '',
    },
    configurableProperties: [
      { name: 'label', label: 'Label', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'required', label: 'Required', type: 'boolean', default: false },
    ],
  },
];

export function getFieldTypeDefinition(type: string): FieldTypeDefinition | undefined {
  return FIELD_TYPES.find((ft) => ft.type === type);
}

export function generateFieldKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
