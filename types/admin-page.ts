/**
 * Admin Page Content Types
 * 
 * These types define the structure of CMS-driven admin pages.
 * Page labels and structure come from CMS content type 'admin_page',
 * while business data comes from boutique-platform services.
 */

// Base admin page content structure
export interface AdminPageContent {
  page_key: string;
  title: string;
  description?: string;
  tabs?: Record<string, string>;
  buttons?: Record<string, string>;
  table_headers?: Record<string, string>;
  form_labels?: Record<string, string>;
  form_placeholders?: Record<string, string>;
  form_validation?: Record<string, string>;
  messages?: Record<string, string>;
  empty_states?: Record<string, string>;
  filters?: Record<string, string>;
  stats?: Record<string, string>;
  tooltips?: Record<string, string>;
  modal_titles?: Record<string, string>;
  search?: Record<string, string>;
  pagination?: Record<string, string>;
  bulk_actions?: Record<string, string>;
  status_labels?: Record<string, string>;
}

// Employee Page specific content
export interface EmployeePageContent extends AdminPageContent {
  page_key: 'admin_employees';
  tabs: {
    employees: string;
    departments: string;
    schedules: string;
    performance: string;
    documents: string;
  };
  buttons: {
    add: string;
    add_employee: string;
    add_department: string;
    add_schedule: string;
    edit: string;
    delete: string;
    save: string;
    save_changes: string;
    cancel: string;
    close: string;
    export: string;
    import: string;
    bulk_action: string;
    apply: string;
    reset: string;
    refresh: string;
    view_profile: string;
    view_schedule: string;
    assign_schedule: string;
    upload_document: string;
    send_invite: string;
    deactivate: string;
    activate: string;
  };
  table_headers: {
    id: string;
    employee_id: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    status: string;
    start_date: string;
    manager: string;
    actions: string;
    created_at: string;
    updated_at: string;
    salary: string;
    employment_type: string;
    shift: string;
    location: string;
    performance_score: string;
    documents_count: string;
  };
  form_labels: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    employment_type: string;
    start_date: string;
    end_date: string;
    manager: string;
    salary: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    emergency_contact: string;
    emergency_phone: string;
    notes: string;
    department_name: string;
    department_description: string;
    department_head: string;
    shift_name: string;
    shift_start: string;
    shift_end: string;
    break_duration: string;
    working_days: string;
  };
  form_placeholders: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    employment_type: string;
    start_date: string;
    manager: string;
    salary: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    emergency_contact: string;
    emergency_phone: string;
    notes: string;
    search: string;
  };
  form_validation: {
    first_name_required: string;
    last_name_required: string;
    email_required: string;
    email_invalid: string;
    phone_invalid: string;
    department_required: string;
    position_required: string;
    start_date_required: string;
    salary_positive: string;
    department_name_required: string;
  };
  messages: {
    loading: string;
    saving: string;
    saved: string;
    deleting: string;
    deleted: string;
    error: string;
    confirm_delete: string;
    confirm_delete_department: string;
    employee_created: string;
    employee_updated: string;
    employee_deleted: string;
    department_created: string;
    department_updated: string;
    department_deleted: string;
    invite_sent: string;
    import_success: string;
    export_success: string;
    no_changes: string;
  };
  empty_states: {
    no_employees: string;
    no_employees_description: string;
    no_departments: string;
    no_departments_description: string;
    no_schedules: string;
    no_schedules_description: string;
    no_documents: string;
    no_documents_description: string;
    no_results: string;
    no_results_description: string;
  };
  filters: {
    all_departments: string;
    all_statuses: string;
    all_types: string;
    active: string;
    inactive: string;
    on_leave: string;
    terminated: string;
    full_time: string;
    part_time: string;
    contract: string;
    intern: string;
    date_range: string;
    this_month: string;
    last_month: string;
    this_year: string;
    custom: string;
  };
  stats: {
    total_employees: string;
    active_employees: string;
    on_leave: string;
    new_this_month: string;
    total_departments: string;
    avg_tenure: string;
    open_positions: string;
  };
  tooltips: {
    edit_employee: string;
    delete_employee: string;
    view_profile: string;
    send_invite: string;
    view_schedule: string;
    upload_document: string;
  };
  modal_titles: {
    add_employee: string;
    edit_employee: string;
    delete_employee: string;
    view_employee: string;
    add_department: string;
    edit_department: string;
    delete_department: string;
    add_schedule: string;
    edit_schedule: string;
    upload_document: string;
    confirm_action: string;
  };
  employment_types: {
    full_time: string;
    part_time: string;
    contract: string;
    intern: string;
    temporary: string;
    freelance: string;
  };
  performance: {
    title: string;
    score: string;
    reviews: string;
    goals: string;
    excellent: string;
    good: string;
    average: string;
    needs_improvement: string;
  };
  performance_ratings: {
    excellent: string;
    good: string;
    satisfactory: string;
    needs_improvement: string;
    unsatisfactory: string;
  };
  schedule: {
    today: string;
    this_week: string;
    this_month: string;
    morning_shift: string;
    afternoon_shift: string;
    evening_shift: string;
    night_shift: string;
    day_off: string;
    holiday: string;
    sick_leave: string;
    vacation: string;
    personal_leave: string;
    work_from_home: string;
    no_shifts: string;
  };
}

// Orders Page specific content
export interface OrdersPageContent extends AdminPageContent {
  page_key: 'admin_orders';
}

// Customers Page specific content
export interface CustomersPageContent extends AdminPageContent {
  page_key: 'admin_customers';
}

// Inventory Page specific content
export interface InventoryPageContent extends AdminPageContent {
  page_key: 'admin_inventory';
}

// Settings Page specific content
export interface SettingsPageContent extends AdminPageContent {
  page_key: 'admin_settings';
}

// Reference Data Page specific content
export interface ReferenceDataPageContent extends AdminPageContent {
  page_key: 'admin_reference_data';
  loading: {
    title: string;
    message: string;
  };
  tabs: {
    department: string;
    role: string;
    status: string;
  };
  buttons: {
    refresh: string;
    add_custom: string;
    add_first: string;
    create: string;
    update: string;
    cancel: string;
    edit: string;
    delete: string;
  };
  labels: {
    department: string;
    departments: string;
    role: string;
    roles: string;
    status: string;
    statuses: string;
    type: string;
    code: string;
    label: string;
    description: string;
    icon: string;
    color: string;
    sort_order: string;
    order: string;
    active: string;
    enabled: string;
    disabled: string;
    metadata: string;
    system: string;
    inactive: string;
  };
  form_labels: {
    type: string;
    code: string;
    label: string;
    description: string;
    icon: string;
    color: string;
    sort_order: string;
    active: string;
    metadata: string;
  };
  form_placeholders: {
    code: string;
    label: string;
    description: string;
    icon: string;
    color: string;
    metadata: string;
  };
  form_help: {
    code: string;
    metadata: string;
  };
  messages: {
    loading: string;
    create_title: string;
    edit_title: string;
    dialog_description: string;
    content_type_missing: string;
    delete_title: string;
    delete_confirm: string;
    delete_confirm_title: string;
    delete_confirm_description: string;
    delete_system_warning: string;
    create_success: string;
    update_success: string;
    delete_success: string;
    error_loading: string;
    error_creating: string;
    error_updating: string;
    error_deleting: string;
  };
  empty_states: {
    no_custom: string;
    no_custom_title: string;
    add_custom_hint: string;
    no_custom_description: string;
    add_first: string;
  };
  select_options: {
    department: string;
    role: string;
    status: string;
    enabled: string;
    disabled: string;
  };
}

// CMS Content Entry wrapper
export interface AdminPageEntry {
  id: string;
  content_type_id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  content_data: AdminPageContent;
  created_at: string;
  updated_at: string;
}

// Page key to content type mapping
export type AdminPageKey = 
  | 'admin_employees'
  | 'admin_orders'
  | 'admin_customers'
  | 'admin_inventory'
  | 'admin_settings'
  | 'admin_analytics'
  | 'admin_reports'
  | 'admin_promotions'
  | 'admin_reference_data';

// Helper to get typed content
export type AdminPageContentByKey<K extends AdminPageKey> = 
  K extends 'admin_employees' ? EmployeePageContent :
  K extends 'admin_orders' ? OrdersPageContent :
  K extends 'admin_customers' ? CustomersPageContent :
  K extends 'admin_inventory' ? InventoryPageContent :
  K extends 'admin_settings' ? SettingsPageContent :
  K extends 'admin_reference_data' ? ReferenceDataPageContent :
  AdminPageContent;
