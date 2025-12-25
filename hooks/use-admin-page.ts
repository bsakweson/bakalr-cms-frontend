import { useState, useEffect, useCallback } from 'react';
import { contentApi } from '@/lib/api';
import { 
  AdminPageContent, 
  AdminPageKey, 
  AdminPageContentByKey,
  EmployeePageContent,
  ReferenceDataPageContent,
} from '@/types/admin-page';

// Default fallback content for employees page
const DEFAULT_EMPLOYEE_PAGE_CONTENT: EmployeePageContent = {
  page_key: 'admin_employees',
  title: 'Employee Management',
  description: 'Manage your team members, schedules, and performance',
  tabs: {
    employees: 'Employees',
    departments: 'Departments',
    schedules: 'Schedules',
    performance: 'Performance',
    documents: 'Documents',
  },
  buttons: {
    add: 'Add',
    add_employee: 'Add Employee',
    add_department: 'Add Department',
    add_schedule: 'Add Schedule',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    save_changes: 'Save Changes',
    cancel: 'Cancel',
    close: 'Close',
    export: 'Export',
    import: 'Import',
    bulk_action: 'Bulk Action',
    apply: 'Apply',
    reset: 'Reset',
    refresh: 'Refresh',
    view_profile: 'View Profile',
    view_schedule: 'View Schedule',
    assign_schedule: 'Assign Schedule',
    upload_document: 'Upload Document',
    send_invite: 'Send Invite',
    deactivate: 'Deactivate',
    activate: 'Activate',
  },
  table_headers: {
    id: 'ID',
    employee_id: 'Employee ID',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    department: 'Department',
    position: 'Position',
    status: 'Status',
    start_date: 'Start Date',
    manager: 'Manager',
    actions: 'Actions',
    created_at: 'Created',
    updated_at: 'Updated',
    salary: 'Salary',
    employment_type: 'Type',
    shift: 'Shift',
    location: 'Location',
    performance_score: 'Performance',
    documents_count: 'Documents',
  },
  form_labels: {
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email Address',
    phone: 'Phone Number',
    department: 'Department',
    position: 'Position',
    employment_type: 'Employment Type',
    start_date: 'Start Date',
    end_date: 'End Date',
    manager: 'Reports To',
    salary: 'Salary',
    address: 'Address',
    city: 'City',
    state: 'State/Province',
    postal_code: 'Postal Code',
    country: 'Country',
    emergency_contact: 'Emergency Contact',
    emergency_phone: 'Emergency Phone',
    notes: 'Notes',
    department_name: 'Department Name',
    department_description: 'Description',
    department_head: 'Department Head',
    shift_name: 'Shift Name',
    shift_start: 'Start Time',
    shift_end: 'End Time',
    break_duration: 'Break Duration',
    working_days: 'Working Days',
  },
  form_placeholders: {
    first_name: 'Enter first name',
    last_name: 'Enter last name',
    email: 'Enter email address',
    phone: 'Enter phone number',
    department: 'Select department',
    position: 'Enter position title',
    employment_type: 'Select type',
    start_date: 'Select start date',
    manager: 'Select manager',
    salary: 'Enter salary',
    address: 'Enter street address',
    city: 'Enter city',
    state: 'Enter state or province',
    postal_code: 'Enter postal code',
    country: 'Select country',
    emergency_contact: 'Enter emergency contact name',
    emergency_phone: 'Enter emergency phone',
    notes: 'Add any notes about this employee',
    search: 'Search employees...',
  },
  form_validation: {
    first_name_required: 'First name is required',
    last_name_required: 'Last name is required',
    email_required: 'Email is required',
    email_invalid: 'Please enter a valid email address',
    phone_invalid: 'Please enter a valid phone number',
    department_required: 'Department is required',
    position_required: 'Position is required',
    start_date_required: 'Start date is required',
    salary_positive: 'Salary must be a positive number',
    department_name_required: 'Department name is required',
  },
  messages: {
    loading: 'Loading employees...',
    saving: 'Saving...',
    saved: 'Saved successfully',
    deleting: 'Deleting...',
    deleted: 'Deleted successfully',
    error: 'An error occurred',
    confirm_delete: 'Are you sure you want to delete this employee?',
    confirm_delete_department: 'Are you sure you want to delete this department?',
    employee_created: 'Employee created successfully',
    employee_updated: 'Employee updated successfully',
    employee_deleted: 'Employee deleted successfully',
    department_created: 'Department created successfully',
    department_updated: 'Department updated successfully',
    department_deleted: 'Department deleted successfully',
    invite_sent: 'Invitation sent successfully',
    import_success: 'Import completed successfully',
    export_success: 'Export completed successfully',
    no_changes: 'No changes to save',
  },
  empty_states: {
    no_employees: 'No employees found',
    no_employees_description: 'Get started by adding your first employee',
    no_departments: 'No departments found',
    no_departments_description: 'Create departments to organize your team',
    no_schedules: 'No schedules found',
    no_schedules_description: 'Create schedules to manage work shifts',
    no_documents: 'No documents found',
    no_documents_description: 'Upload employee documents here',
    no_results: 'No results match your search',
    no_results_description: 'Try adjusting your filters or search term',
  },
  filters: {
    all_departments: 'All Departments',
    all_statuses: 'All Statuses',
    all_types: 'All Types',
    active: 'Active',
    inactive: 'Inactive',
    on_leave: 'On Leave',
    terminated: 'Terminated',
    full_time: 'Full-Time',
    part_time: 'Part-Time',
    contract: 'Contract',
    intern: 'Intern',
    date_range: 'Date Range',
    this_month: 'This Month',
    last_month: 'Last Month',
    this_year: 'This Year',
    custom: 'Custom Range',
  },
  stats: {
    total_employees: 'Total Employees',
    active_employees: 'Active',
    on_leave: 'On Leave',
    new_this_month: 'New This Month',
    total_departments: 'Departments',
    avg_tenure: 'Avg. Tenure',
    open_positions: 'Open Positions',
  },
  tooltips: {
    edit_employee: 'Edit employee details',
    delete_employee: 'Delete this employee',
    view_profile: 'View full profile',
    send_invite: 'Send account invitation',
    view_schedule: 'View work schedule',
    upload_document: 'Upload a document',
  },
  modal_titles: {
    add_employee: 'Add New Employee',
    edit_employee: 'Edit Employee',
    delete_employee: 'Delete Employee',
    view_employee: 'Employee Details',
    add_department: 'Add New Department',
    edit_department: 'Edit Department',
    delete_department: 'Delete Department',
    add_schedule: 'Add Schedule',
    edit_schedule: 'Edit Schedule',
    upload_document: 'Upload Document',
    confirm_action: 'Confirm Action',
  },
  employment_types: {
    full_time: 'Full-Time',
    part_time: 'Part-Time',
    contract: 'Contract',
    intern: 'Intern',
    temporary: 'Temporary',
    freelance: 'Freelance',
  },
  performance: {
    title: 'Performance Overview',
    score: 'Score',
    reviews: 'Reviews',
    goals: 'Goals',
    excellent: 'Excellent',
    good: 'Good',
    average: 'Average',
    needs_improvement: 'Needs Improvement',
  },
  performance_ratings: {
    excellent: 'Excellent',
    good: 'Good',
    satisfactory: 'Satisfactory',
    needs_improvement: 'Needs Improvement',
    unsatisfactory: 'Unsatisfactory',
  },
  schedule: {
    today: 'Today',
    this_week: 'This Week',
    this_month: 'This Month',
    morning_shift: 'Morning Shift',
    afternoon_shift: 'Afternoon Shift',
    evening_shift: 'Evening Shift',
    night_shift: 'Night Shift',
    day_off: 'Day Off',
    holiday: 'Holiday',
    sick_leave: 'Sick Leave',
    vacation: 'Vacation',
    personal_leave: 'Personal Leave',
    work_from_home: 'Work From Home',
    no_shifts: 'No Shifts Scheduled',
  },
};

// Default fallback content for reference data page
const DEFAULT_REFERENCE_DATA_PAGE_CONTENT: ReferenceDataPageContent = {
  page_key: 'admin_reference_data',
  title: 'Custom Reference Data',
  description: 'Define custom departments, roles, and statuses for your organization',
  loading: {
    title: 'Loading Reference Data',
    message: 'Please wait while we load your custom reference data',
  },
  tabs: {
    department: 'Departments',
    role: 'Roles',
    status: 'Statuses',
  },
  buttons: {
    refresh: 'Refresh',
    add_custom: 'Add Custom {type}',
    add_first: 'Add First Custom {type}',
    create: 'Create',
    update: 'Update',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
  },
  labels: {
    department: 'Department',
    departments: 'Departments',
    role: 'Role',
    roles: 'Roles',
    status: 'Status',
    statuses: 'Statuses',
    type: 'Type',
    code: 'Code',
    label: 'Label',
    description: 'Description',
    icon: 'Icon',
    color: 'Color',
    sort_order: 'Sort Order',
    order: 'Order',
    active: 'Active',
    enabled: 'Enabled',
    disabled: 'Disabled',
    metadata: 'Metadata (JSON)',
    system: 'System',
    inactive: 'Inactive',
  },
  form_labels: {
    type: 'Type',
    code: 'Code',
    label: 'Label',
    description: 'Description',
    icon: 'Icon',
    color: 'Color',
    sort_order: 'Sort Order',
    active: 'Active',
    metadata: 'Metadata (JSON)',
  },
  form_placeholders: {
    code: 'e.g., CUSTOM_ROLE',
    label: 'e.g., Custom Role',
    description: 'Brief description of this entry',
    icon: 'e.g., user-plus',
    color: '#6B7280',
    metadata: '{"managerLevel": false, "permissions": []}',
  },
  form_help: {
    code: 'Uppercase identifier used in the system (cannot be changed after creation)',
    metadata: 'Optional JSON object for role-specific settings like permissions',
  },
  messages: {
    loading: 'Loading reference data...',
    create_title: 'Create Custom {type}',
    edit_title: 'Edit Custom {type}',
    dialog_description: 'Add a custom {type} specific to your organization',
    content_type_missing: 'The "organization_reference_data" content type has not been created yet. Please run the CMS seed script or create it manually.',
    delete_title: 'Delete Reference Data',
    delete_confirm: 'Are you sure you want to delete "{label}"? This action cannot be undone.',
    delete_confirm_title: 'Delete {label}?',
    delete_confirm_description: 'This will permanently delete this {type}. This action cannot be undone.',
    delete_system_warning: 'This is a system {type} and cannot be deleted.',
    create_success: '{type} created successfully',
    update_success: '{type} updated successfully',
    delete_success: '{type} deleted successfully',
    error_loading: 'Failed to load reference data. The content type may not exist yet.',
    error_creating: 'Failed to create {type}',
    error_updating: 'Failed to update {type}',
    error_deleting: 'Failed to delete {type}',
  },
  empty_states: {
    no_custom: 'No custom {type}',
    no_custom_title: 'No custom {type}',
    add_custom_hint: 'Add custom {type} specific to your organization',
    no_custom_description: 'Add custom {type} specific to your organization',
    add_first: 'Add First Custom {type}',
  },
  select_options: {
    department: 'Department',
    role: 'Role',
    status: 'Status',
    enabled: 'Enabled',
    disabled: 'Disabled',
  },
};

// Default content map for fallbacks
const DEFAULT_CONTENT_MAP: Partial<Record<AdminPageKey, AdminPageContent>> = {
  admin_employees: DEFAULT_EMPLOYEE_PAGE_CONTENT,
  admin_reference_data: DEFAULT_REFERENCE_DATA_PAGE_CONTENT,
};

interface UseAdminPageOptions {
  locale?: string;
  fallbackToDefault?: boolean;
}

interface UseAdminPageResult<T extends AdminPageContent> {
  content: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch admin page content from CMS
 * 
 * @param pageKey - The page key (e.g., 'admin_employees', 'admin_orders')
 * @param options - Options for fetching (locale, fallback behavior)
 * @returns Content, loading state, error, and refetch function
 * 
 * @example
 * ```tsx
 * const { content, loading, error } = useAdminPage('admin_employees');
 * 
 * if (loading) return <Loading />;
 * if (error) return <Error message={error} />;
 * 
 * return <h1>{content.title}</h1>;
 * ```
 */
export function useAdminPage<K extends AdminPageKey>(
  pageKey: K,
  options: UseAdminPageOptions = {}
): UseAdminPageResult<AdminPageContentByKey<K>> {
  const { locale = 'en', fallbackToDefault = true } = options;
  
  const [content, setContent] = useState<AdminPageContentByKey<K> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, get the admin_page content type ID
      const contentTypes = await contentApi.getContentTypes();
      const adminPageType = contentTypes.find(ct => ct.api_id === 'admin_page');
      
      if (!adminPageType) {
        throw new Error('admin_page content type not found');
      }
      
      // Fetch entries of admin_page type with matching page_key
      const entries = await contentApi.getContentEntries({
        content_type_id: adminPageType.id,
        status: 'published',
        page: 1,
        per_page: 100,
      });
      
      // Find the entry with matching page_key
      const pageEntry = entries.items?.find(
        (entry: { content_data?: { page_key?: string } }) => 
          entry.content_data?.page_key === pageKey
      );
      
      if (pageEntry?.content_data) {
        setContent(pageEntry.content_data as AdminPageContentByKey<K>);
      } else if (fallbackToDefault && DEFAULT_CONTENT_MAP[pageKey]) {
        // Use fallback content if CMS content not available
        console.warn(`CMS content for ${pageKey} not found, using fallback`);
        setContent(DEFAULT_CONTENT_MAP[pageKey] as AdminPageContentByKey<K>);
      } else {
        throw new Error(`Page content not found for ${pageKey}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch page content';
      console.error(`Error fetching admin page ${pageKey}:`, err);
      
      // Fall back to default content on error
      if (fallbackToDefault && DEFAULT_CONTENT_MAP[pageKey]) {
        console.warn(`Using fallback content for ${pageKey} due to error`);
        setContent(DEFAULT_CONTENT_MAP[pageKey] as AdminPageContentByKey<K>);
        setError(null);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [pageKey, locale, fallbackToDefault]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return {
    content,
    loading,
    error,
    refetch: fetchContent,
  };
}

/**
 * Hook for employee page content with proper typing
 */
export function useEmployeePage(options?: UseAdminPageOptions) {
  return useAdminPage('admin_employees', options);
}

/**
 * Hook for reference data page content with proper typing
 */
export function useReferenceDataPage(options?: UseAdminPageOptions) {
  return useAdminPage('admin_reference_data', options);
}

/**
 * Get a specific label from content with fallback
 */
export function getLabel<T extends AdminPageContent>(
  content: T | null,
  path: string,
  fallback: string = ''
): string {
  if (!content) return fallback;
  
  const keys = path.split('.');
  let value: unknown = content;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return fallback;
    }
  }
  
  return typeof value === 'string' ? value : fallback;
}

/**
 * Interpolate placeholders in strings like "{type}" with actual values
 */
export function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] || `{${key}}`);
}

export { DEFAULT_EMPLOYEE_PAGE_CONTENT, DEFAULT_REFERENCE_DATA_PAGE_CONTENT };
