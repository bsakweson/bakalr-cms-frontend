import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmployeesPage from './page';
import * as platformApi from '@/lib/api/platform';

// Mock hooks
const mockToken = 'test-access-token';
vi.mock('@/hooks/use-access-token', () => ({
  useAccessToken: () => mockToken,
}));

// Mock platform API
vi.mock('@/lib/api/platform', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/platform')>();
  return {
    ...actual,
    getEmployees: vi.fn(),
    getEmployeeStats: vi.fn(),
    createEmployee: vi.fn(),
    updateEmployee: vi.fn(),
    deleteEmployee: vi.fn(),
    getEmployeesByDepartment: vi.fn(),
    getEmployeesByRole: vi.fn(),
    getEmployeesByStatus: vi.fn(),
    getActiveEmployees: vi.fn(),
    searchEmployees: vi.fn(),
  };
});

// Sample test data with all required fields
const mockEmployees: platformApi.Employee[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 555-0101',
    department: 'SALES',
    role: 'MANAGER',
    status: 'active',
    hireDate: '2023-01-15T00:00:00Z',
    employeeCode: 'EMP001',
    managerId: undefined,
    storeLocationId: 'store-1',
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1 555-0102',
    department: 'INVENTORY',
    role: 'STOCK_HANDLER',
    status: 'active',
    hireDate: '2023-03-20T00:00:00Z',
    employeeCode: 'EMP002',
    managerId: '1',
    storeLocationId: 'store-1',
    createdAt: '2023-03-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@example.com',
    phone: '+1 555-0103',
    department: 'CUSTOMER_SERVICE',
    role: 'CUSTOMER_SERVICE',
    status: 'on_leave',
    hireDate: '2022-11-01T00:00:00Z',
    employeeCode: 'EMP003',
    managerId: '1',
    storeLocationId: 'store-1',
    createdAt: '2022-11-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    firstName: 'Sarah',
    lastName: 'Williams',
    email: 'sarah.williams@example.com',
    department: 'SALES',
    role: 'SALES_ASSOCIATE',
    status: 'active',
    hireDate: '2024-01-10T00:00:00Z',
    employeeCode: 'EMP004',
    managerId: '1',
    storeLocationId: 'store-1',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '5',
    firstName: 'Tom',
    lastName: 'Brown',
    email: 'tom.brown@example.com',
    department: 'KITCHEN',
    role: 'KITCHEN_STAFF',
    status: 'inactive',
    hireDate: '2022-06-15T00:00:00Z',
    employeeCode: 'EMP005',
    managerId: undefined,
    storeLocationId: 'store-2',
    createdAt: '2022-06-15T00:00:00Z',
    updatedAt: '2023-12-01T00:00:00Z',
  },
];

const mockStats: platformApi.EmployeeStats = {
  totalEmployees: 5,
  total: 5,
  active: 3,
  inactive: 1,
  onLeave: 1,
  byDepartment: {
    SALES: 2,
    INVENTORY: 1,
    CUSTOMER_SERVICE: 1,
    KITCHEN: 1,
  },
  byRole: {
    MANAGER: 1,
    STOCK_HANDLER: 1,
    CUSTOMER_SERVICE: 1,
    SALES_ASSOCIATE: 1,
    KITCHEN_STAFF: 1,
  },
  byStatus: {
    ACTIVE: 3,
    INACTIVE: 1,
    ON_LEAVE: 1,
  },
};

describe('EmployeesPage', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(platformApi.getEmployees).mockResolvedValue({
      content: mockEmployees,
      totalElements: mockEmployees.length,
      totalPages: 1,
    });
    
    vi.mocked(platformApi.getEmployeeStats).mockResolvedValue(mockStats);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render the page header with title and add button', async () => {
      render(<EmployeesPage />);
      
      // CMS labels: title is 'Employee Management'
      expect(screen.getByRole('heading', { name: /employee management/i, level: 1 })).toBeInTheDocument();
      // CMS label for description
      expect(screen.getByText('Manage your team members, schedules, and performance')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add employee/i })).toBeInTheDocument();
    });

    it('should render all stat cards', async () => {
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Employees')).toBeInTheDocument();
        // Check for stat card value instead of just 'Active' (which appears in tab too)
        const activeCard = screen.getByText('Active').closest('div[class*="bg-card"]');
        expect(activeCard).toBeInTheDocument();
        expect(screen.getByText('On Leave')).toBeInTheDocument();
        // Use getAllByText since 'Departments' appears as both stat card and tab
        expect(screen.getAllByText('Departments').length).toBeGreaterThan(0);
      });
    });

    it('should render all tabs', async () => {
      render(<EmployeesPage />);
      
      expect(screen.getByRole('tab', { name: /employees/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /departments/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /roles/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /schedule/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /performance/i })).toBeInTheDocument();
    });

    it('should call API on mount', async () => {
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(platformApi.getEmployees).toHaveBeenCalledWith(mockToken, { size: 100 });
        expect(platformApi.getEmployeeStats).toHaveBeenCalledWith(mockToken);
      });
    });
  });

  describe('Employees Tab', () => {
    it('should display employee list in table', async () => {
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
        expect(screen.getByText('EMP001')).toBeInTheDocument();
      });
    });

    it('should filter employees by search query', async () => {
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search employees...');
      await user.type(searchInput, 'jane');
      
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    it('should open view modal when clicking on employee row', async () => {
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Click View button
      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      await user.click(viewButtons[0]);
      
      // Modal should open with employee details
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        // Use getAllByText since email appears in both table and modal
        const emails = screen.getAllByText('john.doe@example.com');
        expect(emails.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Departments Tab', () => {
    it('should show department cards when switching to departments tab', async () => {
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Switch to departments tab
      const departmentsTab = screen.getByRole('tab', { name: /departments/i });
      await user.click(departmentsTab);
      
      await waitFor(() => {
        // Check for department headings using getAllByText since they may appear multiple times
        expect(screen.getAllByText('Sales').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Inventory').length).toBeGreaterThan(0);
        // Customer Service appears multiple places, just check it exists
        expect(screen.getAllByText(/customer service/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Roles Tab', () => {
    it('should show role cards when switching to roles tab', async () => {
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Switch to roles tab
      const rolesTab = screen.getByRole('tab', { name: /roles/i });
      await user.click(rolesTab);
      
      await waitFor(() => {
        // Use getAllByText since roles appear multiple places
        expect(screen.getAllByText(/manager/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/sales associate/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/stock handler/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Schedule Tab', () => {
    it('should show schedule table when switching to schedule tab', async () => {
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Switch to schedule tab
      const scheduleTab = screen.getByRole('tab', { name: /schedule/i });
      await user.click(scheduleTab);
      
      await waitFor(() => {
        expect(screen.getByText('Weekly Schedule')).toBeInTheDocument();
        expect(screen.getByText('Mon')).toBeInTheDocument();
        expect(screen.getByText('Fri')).toBeInTheDocument();
      });
    });

    it('should show schedule legend', async () => {
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const scheduleTab = screen.getByRole('tab', { name: /schedule/i });
      await user.click(scheduleTab);
      
      await waitFor(() => {
        // Legend items - use getAllByText for 'Off' since it appears in schedule cells too
        expect(screen.getByText('Full Shift')).toBeInTheDocument();
        expect(screen.getByText('Part Shift')).toBeInTheDocument();
        expect(screen.getAllByText(/off/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Tab', () => {
    it('should show performance sections when switching to performance tab', async () => {
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Switch to performance tab
      const performanceTab = screen.getByRole('tab', { name: /performance/i });
      await user.click(performanceTab);
      
      await waitFor(() => {
        expect(screen.getByText('Top Performers')).toBeInTheDocument();
        expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
        expect(screen.getByText('Upcoming Performance Reviews')).toBeInTheDocument();
      });
    });

    it('should show performance metrics', async () => {
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const performanceTab = screen.getByRole('tab', { name: /performance/i });
      await user.click(performanceTab);
      
      await waitFor(() => {
        expect(screen.getByText('Average Attendance')).toBeInTheDocument();
        expect(screen.getByText('Task Completion Rate')).toBeInTheDocument();
        expect(screen.getByText('Customer Satisfaction')).toBeInTheDocument();
        expect(screen.getByText('Sales Target Achievement')).toBeInTheDocument();
      });
    });
  });

  describe('Employee Modal', () => {
    it('should show view mode with employee details', async () => {
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      await user.click(viewButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        
        // Should show view mode buttons
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /view schedule/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /performance/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      });
    });

    it('should switch to edit mode when clicking Edit button', async () => {
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      await user.click(viewButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Click Edit button
      const editButton = within(screen.getByRole('dialog')).getByRole('button', { name: /edit/i });
      await user.click(editButton);
      
      // Should show edit form
      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      });
    });

    it('should switch to schedule mode when clicking View Schedule', async () => {
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      await user.click(viewButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Click View Schedule
      const scheduleButton = within(screen.getByRole('dialog')).getByRole('button', { name: /view schedule/i });
      await user.click(scheduleButton);
      
      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
        expect(screen.getByText('Friday')).toBeInTheDocument();
        expect(screen.getByText('Weekly Hours:')).toBeInTheDocument();
      });
    });

    it('should switch to performance mode when clicking Performance', async () => {
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      await user.click(viewButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Click Performance
      const performanceButtons = within(screen.getByRole('dialog')).getAllByRole('button', { name: /performance/i });
      await user.click(performanceButtons[0]);
      
      await waitFor(() => {
        // CMS label uses 'Score' instead of 'Overall Score'
        expect(screen.getByText('Score')).toBeInTheDocument();
        expect(screen.getByText('Attendance')).toBeInTheDocument();
        expect(screen.getByText('Task Completion')).toBeInTheDocument();
      });
    });

    it('should show delete confirmation when clicking Delete', async () => {
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      await user.click(viewButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Click Delete to enter delete mode
      const deleteButtons = within(screen.getByRole('dialog')).getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      await waitFor(() => {
        // Check for confirmation text (CMS message)
        expect(screen.getByText(/This will permanently remove/i)).toBeInTheDocument();
        // The confirmation dialog has multiple delete buttons - one is the destructive confirm button
        const confirmDeleteButtons = within(screen.getByRole('dialog')).getAllByRole('button', { name: /^delete$/i });
        expect(confirmDeleteButtons.length).toBeGreaterThan(0);
      });
    });

    it('should delete employee when confirming deletion', async () => {
      vi.mocked(platformApi.deleteEmployee).mockResolvedValue(true);
      
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      await user.click(viewButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Click Delete to enter delete mode
      const deleteButtons = within(screen.getByRole('dialog')).getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      // Wait for delete confirmation mode
      await waitFor(() => {
        expect(screen.getByText(/This will permanently remove/i)).toBeInTheDocument();
      });
      
      // Confirm deletion - find the destructive button in the dialog footer
      const confirmDeleteButtons = within(screen.getByRole('dialog')).getAllByRole('button', { name: /^delete$/i });
      // The last one is the confirm button in the footer
      await user.click(confirmDeleteButtons[confirmDeleteButtons.length - 1]);
      
      await waitFor(() => {
        expect(platformApi.deleteEmployee).toHaveBeenCalledWith('1', mockToken);
      });
    });
  });

  describe('Create Employee', () => {
    it('should open create modal when clicking Add Employee', async () => {
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const addButton = screen.getByRole('button', { name: /add employee/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Add New Employee')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add employee/i })).toBeInTheDocument();
      });
    });

    it('should create employee when submitting form', async () => {
      vi.mocked(platformApi.createEmployee).mockResolvedValue({
        id: '6',
        firstName: 'New',
        lastName: 'Employee',
        email: 'new.employee@example.com',
        department: 'SALES',
        role: 'SALES_ASSOCIATE',
        status: 'active',
        hireDate: '2024-11-25T00:00:00Z',
        createdAt: '2024-11-25T00:00:00Z',
        updatedAt: '2024-11-25T00:00:00Z',
      });
      
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const addButton = screen.getByRole('button', { name: /add employee/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Fill form
      await user.type(screen.getByLabelText(/first name/i), 'New');
      await user.type(screen.getByLabelText(/last name/i), 'Employee');
      await user.type(screen.getByLabelText(/email/i), 'new.employee@example.com');
      
      // Submit - use getAllByRole since there are two "Add Employee" buttons in the dialog
      const buttons = screen.getAllByRole('button', { name: /add employee/i });
      const createButton = buttons[buttons.length - 1]; // The submit button is the last one
      await user.click(createButton);
      
      await waitFor(() => {
        expect(platformApi.createEmployee).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'New',
            lastName: 'Employee',
            email: 'new.employee@example.com',
          }),
          mockToken
        );
      });
    });

    it('should disable create button if required fields are empty', async () => {
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const addButton = screen.getByRole('button', { name: /add employee/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Create button should be disabled initially - use getAllByRole since multiple buttons have same name
      const buttons = screen.getAllByRole('button', { name: /add employee/i });
      const createButton = buttons[buttons.length - 1]; // The submit button is the last one
      expect(createButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should show error message when API fails', async () => {
      vi.mocked(platformApi.getEmployees).mockRejectedValue(new Error('Network error'));
      
      render(<EmployeesPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load employees. Please try again.')).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      vi.mocked(platformApi.getEmployees).mockRejectedValue(new Error('Network error'));
      
      render(<EmployeesPage />);
      
      // CMS uses 'Refresh' instead of 'Retry'
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });
    });

    it('should retry fetching data when clicking refresh', async () => {
      vi.mocked(platformApi.getEmployees)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          content: mockEmployees,
          totalElements: mockEmployees.length,
          totalPages: 1,
        });
      
      render(<EmployeesPage />);
      
      // CMS uses 'Refresh' instead of 'Retry'
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);
      
      await waitFor(() => {
        expect(platformApi.getEmployees).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator while fetching data', async () => {
      // Create a promise that doesn't resolve immediately
      let resolveEmployees: (value: unknown) => void;
      const employeesPromise = new Promise((resolve) => {
        resolveEmployees = resolve;
      });
      
      vi.mocked(platformApi.getEmployees).mockReturnValue(employeesPromise as Promise<{ content: platformApi.Employee[]; totalElements: number; totalPages: number }>);
      
      render(<EmployeesPage />);
      
      // Stats should show loading state (-)
      expect(screen.getAllByText('-').length).toBeGreaterThan(0);
      
      // Resolve the promise
      resolveEmployees!({
        content: mockEmployees,
        totalElements: mockEmployees.length,
        totalPages: 1,
      });
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });
});

describe('EmployeesPage API Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call getEmployees with correct parameters', async () => {
    vi.mocked(platformApi.getEmployees).mockResolvedValue({
      content: mockEmployees,
      totalElements: mockEmployees.length,
      totalPages: 1,
    });
    vi.mocked(platformApi.getEmployeeStats).mockResolvedValue(mockStats);
    
    render(<EmployeesPage />);
    
    await waitFor(() => {
      expect(platformApi.getEmployees).toHaveBeenCalledWith(mockToken, { size: 100 });
    });
  });

  it('should call getEmployeeStats on mount', async () => {
    vi.mocked(platformApi.getEmployees).mockResolvedValue({
      content: mockEmployees,
      totalElements: mockEmployees.length,
      totalPages: 1,
    });
    vi.mocked(platformApi.getEmployeeStats).mockResolvedValue(mockStats);
    
    render(<EmployeesPage />);
    
    await waitFor(() => {
      expect(platformApi.getEmployeeStats).toHaveBeenCalledWith(mockToken);
    });
  });

  it('should call deleteEmployee with correct employee ID', async () => {
    vi.mocked(platformApi.getEmployees).mockResolvedValue({
      content: mockEmployees,
      totalElements: mockEmployees.length,
      totalPages: 1,
    });
    vi.mocked(platformApi.getEmployeeStats).mockResolvedValue(mockStats);
    vi.mocked(platformApi.deleteEmployee).mockResolvedValue(true);
    
    render(<EmployeesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Open modal and delete
    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    await user.click(viewButtons[0]);
    
    const deleteButton = within(screen.getByRole('dialog')).getByRole('button', { name: /delete/i });
    await user.click(deleteButton);
    
    // Get the confirm delete button - it's now just "Delete" from CMS labels
    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    await user.click(confirmDeleteButton);
    
    await waitFor(() => {
      expect(platformApi.deleteEmployee).toHaveBeenCalledWith('1', mockToken);
    });
  });

  it('should call createEmployee with form data', async () => {
    vi.mocked(platformApi.getEmployees).mockResolvedValue({
      content: mockEmployees,
      totalElements: mockEmployees.length,
      totalPages: 1,
    });
    vi.mocked(platformApi.getEmployeeStats).mockResolvedValue(mockStats);
    vi.mocked(platformApi.createEmployee).mockResolvedValue({
      id: '6',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      department: 'GENERAL',
      role: 'SALES_ASSOCIATE',
      status: 'active',
      hireDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    render(<EmployeesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Open create modal
    const addButton = screen.getByRole('button', { name: /add employee/i });
    await user.click(addButton);
    
    // Fill form
    await user.type(screen.getByLabelText(/first name/i), 'Test');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    
    // Submit - use getAllByRole since there are two "Add Employee" buttons
    const buttons = screen.getAllByRole('button', { name: /add employee/i });
    const createButton = buttons[buttons.length - 1]; // The submit button is the last one
    await user.click(createButton);
    
    await waitFor(() => {
      expect(platformApi.createEmployee).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          department: 'GENERAL',
          role: 'SALES_ASSOCIATE',
          status: 'active',
        }),
        mockToken
      );
    });
  });
});
