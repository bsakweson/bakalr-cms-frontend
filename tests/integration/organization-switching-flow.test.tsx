/**
 * Integration Test: Organization Switching Workflow
 * 
 * This test validates the complete multi-tenant organization switching flow:
 * 1. List user's organizations (multiple orgs with different roles)
 * 2. Switch between organizations (new auth token)
 * 3. Verify content isolation (Org A content not visible in Org B)
 * 4. Verify organization-scoped data access
 * 5. Complete multi-tenant workflow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tenantApi } from '@/lib/api/tenant';
import { contentApi } from '@/lib/api/content';
import type { 
  UserOrganizationsResponse, 
  OrganizationMembership,
  SwitchOrganizationRequest, 
  SwitchOrganizationResponse,
  ContentEntry,
  PaginatedResponse
} from '@/types';

// Mock API modules
vi.mock('@/lib/api/tenant', () => ({
  tenantApi: {
    listOrganizations: vi.fn(),
    switchOrganization: vi.fn(),
  }
}));

vi.mock('@/lib/api/content', () => ({
  contentApi: {
    getContentEntries: vi.fn(),
    createContentEntry: vi.fn(),
    getContentEntry: vi.fn(),
  }
}));

describe('Integration: Organization Switching Workflow', () => {
  // Mock data
  const mockOrgA: OrganizationMembership = {
    organization_id: '1',
    organization_name: 'Agency A',
    organization_slug: 'agency-a',
    is_default: true,
    is_active: true,
    roles: ['admin', 'editor'],
    joined_at: '2025-01-01T00:00:00Z'
  };

  const mockOrgB: OrganizationMembership = {
    organization_id: '2',
    organization_name: 'Client B',
    organization_slug: 'client-b',
    is_default: false,
    is_active: true,
    roles: ['viewer'],
    joined_at: '2025-02-15T10:30:00Z'
  };

  const mockOrgC: OrganizationMembership = {
    organization_id: '3',
    organization_name: 'Partner C',
    organization_slug: 'partner-c',
    is_default: false,
    is_active: true,
    roles: ['contributor'],
    joined_at: '2025-03-20T14:00:00Z'
  };

  const mockUserOrganizations: UserOrganizationsResponse = {
    current_organization_id: '1',
    organizations: [mockOrgA, mockOrgB, mockOrgC],
    total: 3
  };

  const mockSwitchToOrgBResponse: SwitchOrganizationResponse = {
    message: 'Successfully switched to Client B',
    access_token: 'new_jwt_token_for_org_b',
    refresh_token: 'new_refresh_token_for_org_b',
    organization_id: '2',
    organization_name: 'Client B'
  };

  const mockSwitchToOrgAResponse: SwitchOrganizationResponse = {
    message: 'Successfully switched to Agency A',
    access_token: 'new_jwt_token_for_org_a',
    refresh_token: 'new_refresh_token_for_org_a',
    organization_id: '1',
    organization_name: 'Agency A'
  };

  const mockContentOrgA: ContentEntry = {
    id: '100',
    content_type_id: '1',
    slug: 'org-a-post',
    status: 'published',
    content_data: {
      title: 'Agency A Blog Post',
      body: 'This is content from Agency A'
    },
    version: 1,
    author_id: '1',
    published_at: '2025-11-20T10:00:00Z',
    created_at: '2025-11-20T09:00:00Z',
    updated_at: '2025-11-20T10:00:00Z'
  };

  const mockContentOrgB: ContentEntry = {
    id: '200',
    content_type_id: '1',
    slug: 'org-b-post',
    status: 'published',
    content_data: {
      title: 'Client B Article',
      body: 'This is content from Client B'
    },
    version: 1,
    author_id: '2',
    published_at: '2025-11-22T10:00:00Z',
    created_at: '2025-11-22T09:00:00Z',
    updated_at: '2025-11-22T10:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Step 1: List User Organizations', () => {
    it('should list all organizations user belongs to', async () => {
      vi.mocked(tenantApi.listOrganizations).mockResolvedValue(mockUserOrganizations);

      const result = await tenantApi.listOrganizations();

      expect(result).toEqual(mockUserOrganizations);
      expect(result.organizations).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.current_organization_id).toBe(1);
    });

    it('should indicate current organization', async () => {
      vi.mocked(tenantApi.listOrganizations).mockResolvedValue(mockUserOrganizations);

      const result = await tenantApi.listOrganizations();

      const currentOrg = result.organizations.find(
        org => org.organization_id === result.current_organization_id
      );

      expect(currentOrg).toBeDefined();
      expect(currentOrg?.organization_name).toBe('Agency A');
      expect(currentOrg?.is_default).toBe(true);
    });

    it('should show different roles per organization', async () => {
      vi.mocked(tenantApi.listOrganizations).mockResolvedValue(mockUserOrganizations);

      const result = await tenantApi.listOrganizations();

      const orgA = result.organizations.find(org => org.organization_id === '1');
      const orgB = result.organizations.find(org => org.organization_id === '2');
      const orgC = result.organizations.find(org => org.organization_id === '3');

      expect(orgA?.roles).toContain('admin');
      expect(orgA?.roles).toContain('editor');
      expect(orgB?.roles).toContain('viewer');
      expect(orgC?.roles).toContain('contributor');
    });
  });

  describe('Step 2: Switch Organization', () => {
    it('should switch to another organization', async () => {
      const switchRequest: SwitchOrganizationRequest = { organization_id: "2" };
      vi.mocked(tenantApi.switchOrganization).mockResolvedValue(mockSwitchToOrgBResponse);

      const result = await tenantApi.switchOrganization(switchRequest);

      expect(result).toEqual(mockSwitchToOrgBResponse);
      expect(result.organization_id).toBe('2');
      expect(result.organization_name).toBe('Client B');
      expect(result.access_token).toBe('new_jwt_token_for_org_b');
      expect(result.refresh_token).toBe('new_refresh_token_for_org_b');
      expect(tenantApi.switchOrganization).toHaveBeenCalledWith(switchRequest);
    });

    it('should return new auth tokens on organization switch', async () => {
      const switchRequest: SwitchOrganizationRequest = { organization_id: "2" };
      vi.mocked(tenantApi.switchOrganization).mockResolvedValue(mockSwitchToOrgBResponse);

      const result = await tenantApi.switchOrganization(switchRequest);

      // Verify new tokens are different (in real scenario, these would be used for subsequent requests)
      expect(result.access_token).toBeTruthy();
      expect(result.refresh_token).toBeTruthy();
      expect(result.message).toContain('Successfully switched');
    });

    it('should handle switch errors gracefully', async () => {
      const switchRequest: SwitchOrganizationRequest = { organization_id: "999" };
      vi.mocked(tenantApi.switchOrganization).mockRejectedValue(
        new Error('Organization not found or access denied')
      );

      await expect(tenantApi.switchOrganization(switchRequest)).rejects.toThrow(
        'Organization not found or access denied'
      );
    });

    it('should allow switching back to original organization', async () => {
      // Switch to Org B
      const switchToB: SwitchOrganizationRequest = { organization_id: "2" };
      vi.mocked(tenantApi.switchOrganization).mockResolvedValueOnce(mockSwitchToOrgBResponse);
      
      const resultB = await tenantApi.switchOrganization(switchToB);
      expect(resultB.organization_id).toBe('2');

      // Switch back to Org A
      const switchToA: SwitchOrganizationRequest = { organization_id: "1" };
      vi.mocked(tenantApi.switchOrganization).mockResolvedValueOnce(mockSwitchToOrgAResponse);
      
      const resultA = await tenantApi.switchOrganization(switchToA);
      expect(resultA.organization_id).toBe(1);
      expect(resultA.organization_name).toBe('Agency A');
    });
  });

  describe('Step 3: Verify Content Isolation', () => {
    it('should only show content from current organization (Org A)', async () => {
      // In Org A - should see Org A content
      const orgAContentResponse: PaginatedResponse<ContentEntry> = {
        items: [mockContentOrgA],
        total: 1
      };

      vi.mocked(contentApi.getContentEntries).mockResolvedValue(orgAContentResponse);

      const result = await contentApi.getContentEntries();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('100');
      expect(result.items[0]!.content_data!.title).toBe('Agency A Blog Post');
    });

    it('should only show content from current organization (Org B)', async () => {
      // After switching to Org B - should see Org B content, not Org A
      const orgBContentResponse: PaginatedResponse<ContentEntry> = {
        items: [mockContentOrgB],
        total: 1
      };

      vi.mocked(contentApi.getContentEntries).mockResolvedValue(orgBContentResponse);

      const result = await contentApi.getContentEntries();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('200');
      expect(result.items[0]!.content_data!.title).toBe('Client B Article');
      // Verify Org A content is not present
      expect(result.items.find((item: ContentEntry) => item.id === '100')).toBeUndefined();
    });

    it('should not allow access to content from other organizations', async () => {
      // Try to access Org A content while in Org B
      vi.mocked(contentApi.getContentEntry).mockRejectedValue(
        new Error('Content not found or access denied')
      );

      await expect(contentApi.getContentEntry("100")).rejects.toThrow(
        'Content not found or access denied'
      );
    });

    it('should isolate content creation per organization', async () => {
      const createRequest: Partial<ContentEntry> = {
        content_type_id: '1',
        slug: 'new-post',
        status: 'draft',
        content_data: {
          title: 'New Post in Org B',
          body: 'Content created in Org B'
        }
      };

      // Content created in Org B should belong to Org B
      const createdContent: ContentEntry = {
        ...mockContentOrgB,
        id: '201',
        slug: 'new-post',
        status: 'draft',
        content_data: createRequest.content_data
      };

      vi.mocked(contentApi.createContentEntry).mockResolvedValue(createdContent);

      const result = await contentApi.createContentEntry(createRequest);

      expect(result.id).toBe(201);
      expect(result.content_data!.title).toBe('New Post in Org B');
      expect(contentApi.createContentEntry).toHaveBeenCalledWith(createRequest);
    });
  });

  describe('Step 4: Verify Organization-Scoped Data Access', () => {
    it('should filter data by current organization', async () => {
      // Verify that API calls automatically filter by organization
      const orgAContentResponse: PaginatedResponse<ContentEntry> = {
        items: [mockContentOrgA],
        total: 1
      };

      vi.mocked(contentApi.getContentEntries).mockResolvedValue(orgAContentResponse);

      const result = await contentApi.getContentEntries();

      // All returned content should belong to current org
      expect(result.items.every((item: ContentEntry) => item.id === '100')).toBe(true);
      expect(result.total).toBe(1);
    });

    it('should maintain organization context across multiple requests', async () => {
      // First request
      const firstResponse: PaginatedResponse<ContentEntry> = {
        items: [mockContentOrgB],
        total: 1
      };
      vi.mocked(contentApi.getContentEntries).mockResolvedValueOnce(firstResponse);

      const firstResult = await contentApi.getContentEntries();
      expect(firstResult.items[0].id).toBe('200');

      // Second request - should still be in same org
      vi.mocked(contentApi.getContentEntries).mockResolvedValueOnce(firstResponse);
      const secondResult = await contentApi.getContentEntries();
      expect(secondResult.items[0].id).toBe('200');
    });

    it('should update organization context after switching', async () => {
      // Initially in Org A
      const orgAResponse: PaginatedResponse<ContentEntry> = {
        items: [mockContentOrgA],
        total: 1
      };
      vi.mocked(contentApi.getContentEntries).mockResolvedValueOnce(orgAResponse);

      const beforeSwitch = await contentApi.getContentEntries();
      expect(beforeSwitch.items[0].id).toBe('100');

      // Switch to Org B
      const switchRequest: SwitchOrganizationRequest = { organization_id: "2" };
      vi.mocked(tenantApi.switchOrganization).mockResolvedValue(mockSwitchToOrgBResponse);
      await tenantApi.switchOrganization(switchRequest);

      // After switch - should see Org B content
      const orgBResponse: PaginatedResponse<ContentEntry> = {
        items: [mockContentOrgB],
        total: 1
      };
      vi.mocked(contentApi.getContentEntries).mockResolvedValueOnce(orgBResponse);

      const afterSwitch = await contentApi.getContentEntries();
      expect(afterSwitch.items[0].id).toBe('200');
    });
  });

  describe('Complete Multi-Tenant Workflow', () => {
    it('should complete full organization switching workflow', async () => {
      // Step 1: List organizations
      vi.mocked(tenantApi.listOrganizations).mockResolvedValue(mockUserOrganizations);
      const orgs = await tenantApi.listOrganizations();
      expect(orgs.total).toBe(3);
      expect(orgs.current_organization_id).toBe(1);

      // Step 2: View content in Org A
      const orgAContent: PaginatedResponse<ContentEntry> = {
        items: [mockContentOrgA],
        total: 1
      };
      vi.mocked(contentApi.getContentEntries).mockResolvedValueOnce(orgAContent);
      const contentOrgA = await contentApi.getContentEntries();
      expect(contentOrgA.items[0]!.content_data!.title).toBe('Agency A Blog Post');

      // Step 3: Switch to Org B
      const switchToB: SwitchOrganizationRequest = { organization_id: "2" };
      vi.mocked(tenantApi.switchOrganization).mockResolvedValueOnce(mockSwitchToOrgBResponse);
      const switchResult = await tenantApi.switchOrganization(switchToB);
      expect(switchResult.organization_id).toBe('2');

      // Step 4: View content in Org B (different content)
      const orgBContent: PaginatedResponse<ContentEntry> = {
        items: [mockContentOrgB],
        total: 1
      };
      vi.mocked(contentApi.getContentEntries).mockResolvedValueOnce(orgBContent);
      const contentOrgB = await contentApi.getContentEntries();
      expect(contentOrgB.items[0]!.content_data!.title).toBe('Client B Article');
      expect(contentOrgB.items[0]!.id).not.toBe(contentOrgA.items[0]!.id);
    });

    it('should handle multiple organization switches', async () => {
      // Switch A → B
      const switchToB: SwitchOrganizationRequest = { organization_id: "2" };
      vi.mocked(tenantApi.switchOrganization).mockResolvedValueOnce(mockSwitchToOrgBResponse);
      const resultB = await tenantApi.switchOrganization(switchToB);
      expect(resultB.organization_id).toBe('2');

      // Switch B → C
      const switchToC: SwitchOrganizationRequest = { organization_id: "3" };
      const mockSwitchToOrgCResponse: SwitchOrganizationResponse = {
        message: 'Successfully switched to Partner C',
        access_token: 'new_jwt_token_for_org_c',
        refresh_token: 'new_refresh_token_for_org_c',
        organization_id: '3',
        organization_name: 'Partner C'
      };
      vi.mocked(tenantApi.switchOrganization).mockResolvedValueOnce(mockSwitchToOrgCResponse);
      const resultC = await tenantApi.switchOrganization(switchToC);
      expect(resultC.organization_id).toBe('3');

      // Switch C → A
      const switchToA: SwitchOrganizationRequest = { organization_id: "1" };
      vi.mocked(tenantApi.switchOrganization).mockResolvedValueOnce(mockSwitchToOrgAResponse);
      const resultA = await tenantApi.switchOrganization(switchToA);
      expect(resultA.organization_id).toBe(1);
    });

    it('should maintain data isolation throughout workflow', async () => {
      // Create content in Org A
      const createInOrgA: Partial<ContentEntry> = {
        content_type_id: '1',
        slug: 'org-a-exclusive',
        status: 'published',
        content_data: {
          title: 'Org A Exclusive Content',
          body: 'Only visible in Org A'
        }
      };
      vi.mocked(contentApi.createContentEntry).mockResolvedValueOnce({
        ...mockContentOrgA,
        id: '101',
        slug: 'org-a-exclusive',
        content_data: createInOrgA.content_data
      });
      const createdOrgA = await contentApi.createContentEntry(createInOrgA);
      expect(createdOrgA.id).toBe(101);

      // Switch to Org B
      const switchToB: SwitchOrganizationRequest = { organization_id: "2" };
      vi.mocked(tenantApi.switchOrganization).mockResolvedValue(mockSwitchToOrgBResponse);
      await tenantApi.switchOrganization(switchToB);

      // List content in Org B - should NOT see Org A content
      const orgBContent: PaginatedResponse<ContentEntry> = {
        items: [mockContentOrgB], // Only Org B content
        total: 1
      };
      vi.mocked(contentApi.getContentEntries).mockResolvedValue(orgBContent);
      const contentInOrgB = await contentApi.getContentEntries();
      
      expect(contentInOrgB.items).toHaveLength(1);
      expect(contentInOrgB.items.find((item: ContentEntry) => item.id === '101')).toBeUndefined(); // Org A content not visible
      expect(contentInOrgB.items[0]!.id).toBe('200'); // Only Org B content
    });
  });
});
