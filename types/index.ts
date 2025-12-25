// User and Authentication Types
export interface User {
  id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string; // Computed field for backward compatibility
  is_active?: boolean; // Optional for test compat
  is_email_verified?: boolean; // Optional for test compat
  organization_id: string;
  organization?: Organization;
  bio?: string;
  preferences?: string; // JSON string
  avatar_url?: string;
  two_factor_enabled?: boolean;
  created_at?: string; // Optional for test compat
  updated_at?: string; // Optional for test compat
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  is_system_role: boolean;
  level: number;
  permissions?: string[];
  user_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

export interface RoleListResponse {
  roles: Role[];
  total: number;
}

export interface PermissionListResponse {
  permissions: Permission[];
  total: number;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permission_ids?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permission_ids?: string[];
}

export interface RoleResponse {
  id: string;
  name: string;
  description?: string;
  is_system_role: boolean;
  level: number;
  permissions: Permission[];
}

export interface UserListItem {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  roles: string[];
  created_at: string;
  last_login?: string;
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
}

export interface InviteUserRequest {
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string; // Legacy alias
  role_id?: string; // Optional for test compat
  role_ids?: string[]; // Alternative format
  send_invite_email?: boolean;
}

export interface InviteUserResponse {
  user_id: string;
  email: string;
  message: string;
}

export interface UpdateUserRoleRequest {
  role_id: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
  first_name?: string; // Alternative to full_name
  last_name?: string;  // Alternative to full_name
  organization_name: string;
}

// Organization Settings
export interface OrganizationProfile {
  id: string;
  name: string;
  slug: string;
  description?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  owner_id?: string;
  is_active: boolean;
  plan_type: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationProfileUpdate {
  name?: string;
  description?: string;
  email?: string;
  website?: string;
  logo_url?: string;
}

export interface Locale {
  id: string;
  code: string;
  name: string;
  native_name?: string;
  is_default: boolean;
  is_enabled: boolean;
  is_active: boolean;
  auto_translate: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface LocaleListResponse {
  locales: Locale[];
  total: number;
}

export interface CreateLocaleRequest {
  code: string;
  name: string;
  is_default?: boolean;
  is_active?: boolean;
}

export interface UpdateLocaleRequest {
  name?: string;
  is_default?: boolean;
  is_active?: boolean;
}

// Tenant/Organization Switching
export interface OrganizationMembership {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  is_default: boolean;
  is_active: boolean;
  roles: string[];
  joined_at: string;
}

export interface UserOrganizationsResponse {
  current_organization_id: string;
  organizations: OrganizationMembership[];
  total: number;
}

export interface SwitchOrganizationRequest {
  organization_id: string;
}

export interface SwitchOrganizationResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  organization_id: string;
  organization_name: string;
}

// Audit Logs
export interface AuditLogItem {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  description?: string;
  severity: string;
  status: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  ip_address?: string;
  created_at: string;
}

export interface AuditLogListResponse {
  logs: AuditLogItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface AuditLogStats {
  total_logs: number;
  actions_today: number;
  failed_actions: number;
  unique_users: number;
}

// Content Types
export interface ContentType {
  id: string;
  name: string;
  api_id?: string; // API uses api_id not slug (optional for test compat)
  description?: string;
  fields?: Array<{
    name: string;
    type: string;
    label?: string;
    required?: boolean;
    unique?: boolean;
    localized?: boolean;
    default?: any;
    validation?: Record<string, any>;
    help_text?: string;
  }>;
  display_field?: string;
  is_active?: boolean;
  entry_count?: number;
  organization_id: string;
  created_at: string;
  updated_at: string;
  // Legacy compatibility
  slug?: string;
  schema?: Record<string, any>;
}

export interface ContentEntry {
  id: string;
  content_type_id: string;
  slug: string;
  status: "draft" | "published" | "archived";
  content_data?: Record<string, any>;  // Legacy field name
  data?: Record<string, any>;          // API returns 'data', not 'content_data'
  version?: number; // Optional for test compat
  author_id?: string; // Optional for test compat
  author?: User;
  content_type?: ContentType;
  published_at?: string;
  created_at?: string; // Optional for test compat
  updated_at?: string; // Optional for test compat
}

// Media Types
export interface Media {
  id: string;
  organization_id?: string; // Optional for test compat
  uploaded_by_id?: string;
  filename: string;
  original_filename?: string; // Optional for test compat
  file_path?: string; // Optional for test compat
  url?: string; // Optional for test compat
  mime_type: string;
  file_size: number;
  file_extension?: string;
  media_type?: 'image' | 'video' | 'audio' | 'document' | 'other'; // Optional for test compat
  width?: number;
  height?: number;
  alt_text?: string;
  description?: string;
  tags?: string[];
  thumbnail_url?: string;
  cdn_url?: string;
  created_at?: string; // Optional for test compat
  updated_at?: string; // Optional for test compat
  // Legacy aliases for backward compatibility
  file_type?: string;
  storage_path?: string;
  public_url?: string;
  title?: string;
}

// Translation Types
export interface Locale {
  id: string;
  code: string;
  name: string;
  is_default: boolean;
  is_enabled: boolean;
  organization_id: string;
}

export interface Translation {
  id: string;
  content_entry_id: string;
  locale_id: string;
  translated_data: Record<string, any>;
  status: "pending" | "completed" | "failed";
  source_locale?: string;
  translation_service?: string;
  quality_score?: number;
  is_manual: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  locale?: Locale;
}

// Theme Types
export interface Theme {
  id: string;
  name: string;
  slug: string;
  description?: string;
  colors: Record<string, string>;
  typography: Record<string, any>;
  spacing: Record<string, string>;
  is_active: boolean;
  is_system: boolean;
  organization_id?: string;
}

// Template Types
export interface ContentTemplate {
  id: string;
  name: string;
  slug: string;
  description?: string;
  content_type_id: string;
  field_defaults: Record<string, any>;
  field_config: Record<string, any>;
  is_published: boolean;
  usage_count: number;
  tags?: string;
  organization_id: string;
  content_type?: ContentType;
}

// Analytics Types
export interface ContentStats {
  total_entries: number;
  published_entries: number;
  draft_entries: number;
  total_types: number;
  entries_by_type: Array<{ type: string; count: number }>;
  recent_entries: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
  }>;
}

export interface UserStats {
  total_users: number;
  active_users_7d: number;
  active_users_30d: number;
  new_users_7d: number;
  new_users_30d: number;
  top_contributors: Array<{
    id: string;
    name: string;
    email: string;
    entries_count: number;
  }>;
}

export interface MediaStats {
  total_media: number;
  total_size_mb: number;
  media_by_type: Array<{ type: string; count: number }>;
  recent_uploads: Array<{
    id: string;
    filename: string;
    mime_type: string;
    size: number;
    created_at: string;
  }>;
}

export interface ActivityStats {
  actions_today: number;
  actions_7d: number;
  actions_30d: number;
  recent_activities: Array<{
    id: string;
    action: string;
    resource_type: string;
    description?: string;
    user_name: string;
    created_at: string;
  }>;
  actions_by_type: Array<{ action: string; count: number }>;
}

export interface TrendDataPoint {
  date: string;
  value: number;
}

export interface TrendsResponse {
  content_trend: TrendDataPoint[];
  user_trend: TrendDataPoint[];
  activity_trend: TrendDataPoint[];
}

export interface DashboardOverview {
  content_stats: ContentStats;
  user_stats: UserStats;
  media_stats: MediaStats;
  activity_stats: ActivityStats;
}

// ============================================================================
// Pagination Types - Re-exported from @/lib/pagination for convenience
// ============================================================================
// For new code, prefer importing directly from '@/lib/pagination'
export type {
  PageRequest,
  PageInfo,
  PagedResponse,
} from '@/lib/pagination';

export {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE,
  MAX_PAGE_SIZE,
  createPageRequest,
  calculateOffset,
  calculateTotalPages,
  createPageInfo,
  createPagedResponse,
  hasNextPage,
  hasPreviousPage,
  getItemRange,
  getPageNumbers,
  normalizePagedResponse,
  toSearchParams,
  fromSearchParams,
  isPagedResponse,
  emptyPagedResponse,
} from '@/lib/pagination';

/**
 * @deprecated Use PagedResponse from '@/lib/pagination' instead.
 * This interface is kept for backward compatibility only.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total?: number;
  page?: number;
  page_size?: number;
  pages?: number;
  // Legacy aliases - will be removed in future versions
  total_pages?: number;
  per_page?: number;
}

export interface ApiError {
  detail: string;
  type?: string;
  status?: number;
}
