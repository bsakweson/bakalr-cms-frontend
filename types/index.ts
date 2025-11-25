// User and Authentication Types
export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  organization_id: number;
  organization?: Organization;
  two_factor_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  organization_id: number;
  is_system_role: boolean;
  level: number;
  permissions?: string[];
  user_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
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
  permission_ids?: number[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permission_ids?: number[];
}

export interface RoleResponse {
  id: number;
  name: string;
  description?: string;
  is_system_role: boolean;
  level: number;
  permissions: Permission[];
}

export interface UserListItem {
  id: number;
  email: string;
  full_name: string;
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
  full_name: string;
  role_id: number;
  send_invite_email?: boolean;
}

export interface InviteUserResponse {
  user_id: number;
  email: string;
  message: string;
}

export interface UpdateUserRoleRequest {
  role_id: number;
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
  full_name: string;
  organization_name: string;
}

// Organization Settings
export interface OrganizationProfile {
  id: number;
  name: string;
  slug: string;
  description?: string;
  email?: string;
  website?: string;
  logo_url?: string;
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
  id: number;
  code: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
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
  organization_id: number;
  organization_name: string;
  organization_slug: string;
  is_default: boolean;
  is_active: boolean;
  roles: string[];
  joined_at: string;
}

export interface UserOrganizationsResponse {
  current_organization_id: number;
  organizations: OrganizationMembership[];
  total: number;
}

export interface SwitchOrganizationRequest {
  organization_id: number;
}

export interface SwitchOrganizationResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  organization_id: number;
  organization_name: string;
}

// Audit Logs
export interface AuditLogItem {
  id: number;
  action: string;
  resource_type: string;
  resource_id?: number;
  description?: string;
  severity: string;
  status: string;
  user_id?: number;
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
  id: number;
  name: string;
  slug: string;
  description?: string;
  schema: Record<string, any>;
  organization_id: number;
  created_at: string;
  updated_at: string;
}

export interface ContentEntry {
  id: number;
  content_type_id: number;
  slug: string;
  status: "draft" | "published" | "archived";
  content_data: Record<string, any>;
  version: number;
  author_id: number;
  author?: User;
  content_type?: ContentType;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

// Media Types
export interface Media {
  id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  public_url?: string;
  alt_text?: string;
  title?: string;
  uploaded_by_id: number;
  organization_id: number;
  created_at: string;
  updated_at: string;
}

// Translation Types
export interface Locale {
  id: number;
  code: string;
  name: string;
  is_default: boolean;
  is_enabled: boolean;
  organization_id: number;
}

export interface Translation {
  id: number;
  content_entry_id: number;
  locale_id: number;
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
  id: number;
  name: string;
  slug: string;
  description?: string;
  colors: Record<string, string>;
  typography: Record<string, any>;
  spacing: Record<string, string>;
  is_active: boolean;
  is_system: boolean;
  organization_id?: number;
}

// Template Types
export interface ContentTemplate {
  id: number;
  name: string;
  slug: string;
  description?: string;
  content_type_id: number;
  field_defaults: Record<string, any>;
  field_config: Record<string, any>;
  is_published: boolean;
  usage_count: number;
  tags?: string;
  organization_id: number;
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
    id: number;
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
    id: number;
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
    id: number;
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
    id: number;
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

// API Response Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiError {
  detail: string;
  type?: string;
  status?: number;
}
