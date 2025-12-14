import { describe, it, expect } from 'vitest';
import { 
  FIELD_TYPES, 
  getFieldTypeDefinition, 
  generateFieldKey,
  type FieldTypeDefinition 
} from './field-types';

describe('field-types', () => {
  describe('FIELD_TYPES array', () => {
    it('should contain all 13 field type definitions', () => {
      expect(FIELD_TYPES).toHaveLength(13);
      
      const types = FIELD_TYPES.map(ft => ft.type);
      expect(types).toEqual([
        'text',
        'textarea',
        'richtext',
        'number',
        'email',
        'url',
        'select',
        'boolean',
        'image',
        'file',
        'date',
        'datetime',
        'json',
      ]);
    });

    it('should have proper structure for each field type', () => {
      FIELD_TYPES.forEach(fieldType => {
        expect(fieldType).toHaveProperty('type');
        expect(fieldType).toHaveProperty('label');
        expect(fieldType).toHaveProperty('icon');
        expect(fieldType).toHaveProperty('description');
        expect(fieldType).toHaveProperty('defaultConfig');
        expect(fieldType).toHaveProperty('configurableProperties');
        
        // Verify defaultConfig structure
        expect(fieldType.defaultConfig).toHaveProperty('label');
        expect(fieldType.defaultConfig).toHaveProperty('type');
        expect(fieldType.defaultConfig).toHaveProperty('required');
        
        // Verify configurableProperties is array
        expect(Array.isArray(fieldType.configurableProperties)).toBe(true);
      });
    });

    it('should have unique types', () => {
      const types = FIELD_TYPES.map(ft => ft.type);
      const uniqueTypes = new Set(types);
      expect(uniqueTypes.size).toBe(types.length);
    });
  });

  describe('text field type', () => {
    const textField = FIELD_TYPES.find(ft => ft.type === 'text');

    it('should have correct properties', () => {
      expect(textField).toBeDefined();
      expect(textField?.label).toBe('Text');
      expect(textField?.icon).toBe('📝');
      expect(textField?.description).toBe('Single-line text input');
    });

    it('should have proper default config', () => {
      expect(textField?.defaultConfig).toEqual({
        label: 'Text Field',
        type: 'text',
        required: false,
        description: '',
      });
    });

    it('should have configurable properties', () => {
      expect(textField?.configurableProperties).toBeDefined();
      const propNames = textField?.configurableProperties.map(p => p.name);
      expect(propNames).toContain('label');
      expect(propNames).toContain('required');
      expect(propNames).toContain('placeholder');
      expect(propNames).toContain('minLength');
      expect(propNames).toContain('maxLength');
    });
  });

  describe('select field type', () => {
    const selectField = FIELD_TYPES.find(ft => ft.type === 'select');

    it('should have options in default config', () => {
      const options = selectField?.defaultConfig.options as { value: string; label: string }[] | undefined;
      expect(options).toBeDefined();
      expect(Array.isArray(options)).toBe(true);
      expect(options).toHaveLength(2);
      expect(options?.[0]).toEqual({
        value: 'option1',
        label: 'Option 1',
      });
    });
  });

  describe('boolean field type', () => {
    const booleanField = FIELD_TYPES.find(ft => ft.type === 'boolean');

    it('should have default value in config', () => {
      expect(booleanField?.defaultConfig.defaultValue).toBe(false);
    });

    it('should have checkbox icon', () => {
      expect(booleanField?.icon).toBe('✅');
    });
  });

  describe('media field types', () => {
    it('should have image field type', () => {
      const imageField = FIELD_TYPES.find(ft => ft.type === 'image');
      expect(imageField).toBeDefined();
      expect(imageField?.icon).toBe('🖼️');
      expect(imageField?.description).toBe('Image upload with media picker');
    });

    it('should have file field type', () => {
      const fileField = FIELD_TYPES.find(ft => ft.type === 'file');
      expect(fileField).toBeDefined();
      expect(fileField?.icon).toBe('📎');
      expect(fileField?.description).toBe('File upload with media picker');
    });
  });

  describe('date field types', () => {
    it('should have date field type', () => {
      const dateField = FIELD_TYPES.find(ft => ft.type === 'date');
      expect(dateField).toBeDefined();
      expect(dateField?.icon).toBe('📅');
      expect(dateField?.label).toBe('Date');
    });

    it('should have datetime field type', () => {
      const datetimeField = FIELD_TYPES.find(ft => ft.type === 'datetime');
      expect(datetimeField).toBeDefined();
      expect(datetimeField?.icon).toBe('🕐');
      expect(datetimeField?.label).toBe('Date & Time');
    });
  });

  describe('getFieldTypeDefinition', () => {
    it('should return field type definition for valid type', () => {
      const textField = getFieldTypeDefinition('text');
      expect(textField).toBeDefined();
      expect(textField?.type).toBe('text');
      expect(textField?.label).toBe('Text');
    });

    it('should return field type for number', () => {
      const numberField = getFieldTypeDefinition('number');
      expect(numberField).toBeDefined();
      expect(numberField?.type).toBe('number');
      expect(numberField?.icon).toBe('🔢');
    });

    it('should return field type for email', () => {
      const emailField = getFieldTypeDefinition('email');
      expect(emailField).toBeDefined();
      expect(emailField?.type).toBe('email');
      expect(emailField?.icon).toBe('📧');
    });

    it('should return undefined for invalid type', () => {
      const invalidField = getFieldTypeDefinition('invalid-type');
      expect(invalidField).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const emptyField = getFieldTypeDefinition('');
      expect(emptyField).toBeUndefined();
    });
  });

  describe('generateFieldKey', () => {
    it('should convert label to kebab-case key', () => {
      expect(generateFieldKey('First Name')).toBe('first-name');
      expect(generateFieldKey('Email Address')).toBe('email-address');
      expect(generateFieldKey('Phone Number')).toBe('phone-number');
    });

    it('should handle multiple spaces', () => {
      expect(generateFieldKey('Full   Name   Here')).toBe('full-name-here');
    });

    it('should remove special characters', () => {
      expect(generateFieldKey('First-Name!')).toBe('first-name');
      expect(generateFieldKey('Email@Address')).toBe('email-address');
      expect(generateFieldKey('User#ID')).toBe('user-id');
    });

    it('should handle leading and trailing hyphens', () => {
      expect(generateFieldKey(' First Name ')).toBe('first-name');
      expect(generateFieldKey('  Title  ')).toBe('title');
    });

    it('should convert to lowercase', () => {
      expect(generateFieldKey('UPPERCASE')).toBe('uppercase');
      expect(generateFieldKey('MixedCase')).toBe('mixedcase');
    });

    it('should handle numbers', () => {
      expect(generateFieldKey('Field 1')).toBe('field-1');
      expect(generateFieldKey('Option123')).toBe('option123');
    });

    it('should handle single words', () => {
      expect(generateFieldKey('Title')).toBe('title');
      expect(generateFieldKey('name')).toBe('name');
    });

    it('should handle empty strings', () => {
      expect(generateFieldKey('')).toBe('');
    });

    it('should handle unicode and accents', () => {
      expect(generateFieldKey('Café')).toBe('caf');
      expect(generateFieldKey('Naïve')).toBe('na-ve');
    });

    it('should handle consecutive special characters', () => {
      expect(generateFieldKey('First---Name')).toBe('first-name');
      expect(generateFieldKey('Email!!!Address')).toBe('email-address');
    });
  });
});
