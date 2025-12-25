'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader, StatCard, DataTable, SearchInput, StatusBadge, getStatusVariant, type Column } from '@/components/boutique-admin/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getEmployees,
  getEmployeeStats,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  type Employee,
  type EmployeeStats,
} from '@/lib/api/platform';
import { useAccessToken } from '@/hooks/use-access-token';
import { useEmployeePage, DEFAULT_EMPLOYEE_PAGE_CONTENT } from '@/hooks/use-admin-page';
import { useReferenceData, getDepartmentLabel, getRoleLabel } from '@/hooks/use-reference-data';
import type { EmployeePageContent } from '@/types/admin-page';

type ModalMode = 'view' | 'edit' | 'create' | 'delete' | 'schedule' | 'performance';

export default function EmployeesPage() {
  const token = useAccessToken();
  
  // CMS-driven page content (labels, messages, etc.)
  const { content: pageContent, loading: pageLoading } = useEmployeePage({ fallbackToDefault: true });
  const labels = pageContent || DEFAULT_EMPLOYEE_PAGE_CONTENT;
  
  // Dynamic reference data from boutique platform
  const { departments, roles, loading: refLoading } = useReferenceData();
  
  const [activeTab, setActiveTab] = useState('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('view');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Edit/Create form state
  const [editForm, setEditForm] = useState<Partial<Employee>>({});

  // Fetch all data
  const fetchData = useCallback(async () => {
    // Wait for token to be available (null = loading, undefined = no token)
    if (token === null) return;
    
    setLoading(true);
    setError(null);
    try {
      const [employeeResponse, statsResponse] = await Promise.all([
        getEmployees(token || undefined, { size: 100 }),
        getEmployeeStats(token || undefined),
      ]);
      setEmployees(employeeResponse?.content || []);
      setStats(statsResponse || null);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      setError('Failed to load employees. Please try again.');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Department filter
      const matchesDepartment = departmentFilter === 'all' || emp.department === departmentFilter;
      
      // Role filter
      const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
      
      return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
    });
  }, [employees, searchQuery, departmentFilter, roleFilter, statusFilter]);

  // Group employees by department
  const employeesByDepartment = useMemo(() => {
    const grouped: Record<string, Employee[]> = {};
    employees.forEach(emp => {
      const dept = emp.department || 'Unassigned';
      if (!grouped[dept]) grouped[dept] = [];
      grouped[dept].push(emp);
    });
    return grouped;
  }, [employees]);

  // Group employees by role
  const employeesByRole = useMemo(() => {
    const grouped: Record<string, Employee[]> = {};
    employees.forEach(emp => {
      const role = emp.role || 'Unassigned';
      if (!grouped[role]) grouped[role] = [];
      grouped[role].push(emp);
    });
    return grouped;
  }, [employees]);

  // Open modal in a specific mode
  const openModal = (employee: Employee | null, mode: ModalMode) => {
    setSelectedEmployee(employee);
    setModalMode(mode);
    if (mode === 'edit' && employee) {
      setEditForm({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone || '',
        department: employee.department,
        role: employee.role,
        status: employee.status,
        managerId: employee.managerId,
      });
    } else if (mode === 'create') {
      setEditForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: 'GENERAL',
        role: 'SALES_ASSOCIATE',
        status: 'active',
        hireDate: new Date().toISOString().split('T')[0],
      });
    }
  };

  // Close modal and reset state
  const closeModal = () => {
    setSelectedEmployee(null);
    setModalMode('view');
    setEditForm({});
  };

  // Handle create employee
  const handleCreateEmployee = async () => {
    if (!token) return;
    
    setSaving(true);
    try {
      const created = await createEmployee({
        firstName: editForm.firstName || '',
        lastName: editForm.lastName || '',
        email: editForm.email || '',
        phone: editForm.phone,
        department: editForm.department || 'GENERAL',
        role: editForm.role || 'SALES_ASSOCIATE',
        status: editForm.status || 'active',
        hireDate: editForm.hireDate || new Date().toISOString(),
      }, token);
      
      if (created) {
        await fetchData();
        closeModal();
      } else {
        setError('Failed to create employee');
      }
    } catch (err) {
      console.error('Failed to create employee:', err);
      setError('Failed to create employee');
    } finally {
      setSaving(false);
    }
  };

  // Handle save employee edits
  const handleSaveEmployee = async () => {
    if (!selectedEmployee || !token) return;
    
    setSaving(true);
    try {
      const updated = await updateEmployee(selectedEmployee.id, editForm, token);
      if (updated) {
        setEmployees(prev => prev.map(emp => 
          emp.id === selectedEmployee.id ? { ...emp, ...editForm } : emp
        ));
        setSelectedEmployee({ ...selectedEmployee, ...editForm } as Employee);
        setModalMode('view');
      } else {
        setError('Failed to update employee');
      }
    } catch (err) {
      console.error('Failed to save employee:', err);
      setError('Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete employee
  const handleDeleteEmployee = async () => {
    if (!selectedEmployee || !token) return;
    
    setSaving(true);
    try {
      const success = await deleteEmployee(selectedEmployee.id, token);
      if (success) {
        setEmployees(prev => prev.filter(emp => emp.id !== selectedEmployee.id));
        closeModal();
      } else {
        setError('Failed to delete employee');
      }
    } catch (err) {
      console.error('Failed to delete employee:', err);
      setError('Failed to delete employee');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Employee',
      render: (employee) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {employee.firstName[0]}{employee.lastName[0]}
            </span>
          </div>
          <div>
            <p className="font-medium">{employee.firstName} {employee.lastName}</p>
            <p className="text-sm text-muted-foreground">{employee.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'employeeCode',
      header: 'Code',
      render: (employee) => (
        <span className="font-mono text-sm">{employee.employeeCode || '-'}</span>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (employee) => <span>{getDepartmentLabel(employee.department)}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (employee) => <span>{getRoleLabel(employee.role)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (employee) => (
        <StatusBadge 
          status={employee.status.replace('_', ' ')} 
          variant={getStatusVariant(employee.status)} 
        />
      ),
    },
    {
      key: 'hireDate',
      header: 'Hire Date',
      render: (employee) => (
        <span className="text-muted-foreground">
          {new Date(employee.hireDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (employee) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            openModal(employee, 'view');
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        icon={
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
        title={labels.title}
        description={labels.description || 'Manage your team members and departments'}
        actions={
          <Button onClick={() => openModal(null, 'create')}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {labels.buttons.add_employee}
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title={labels.stats.total_employees} 
          value={loading ? '-' : stats?.total ?? stats?.totalEmployees ?? 0} 
        />
        <StatCard 
          title={labels.stats.active_employees} 
          value={loading ? '-' : stats?.active ?? stats?.byStatus?.ACTIVE ?? 0} 
          trend={{ value: 0, label: 'from last month', isPositive: true }}
        />
        <StatCard 
          title={labels.stats.on_leave} 
          value={loading ? '-' : stats?.onLeave ?? stats?.byStatus?.ON_LEAVE ?? 0} 
        />
        <StatCard 
          title={labels.stats.total_departments} 
          value={loading ? '-' : Object.keys(stats?.byDepartment || {}).length} 
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData} className="mt-2">
            {labels.buttons.refresh}
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="employees">{labels.tabs.employees}</TabsTrigger>
          <TabsTrigger value="departments">{labels.tabs.departments}</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="schedule">{labels.tabs.schedules}</TabsTrigger>
          <TabsTrigger value="performance">{labels.tabs.performance}</TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees" className="mt-6">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={labels.form_placeholders.search}
              className="w-64"
            />
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={labels.filters.all_departments} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{labels.filters.all_departments}</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder={labels.filters.all_statuses} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{labels.filters.all_statuses}</SelectItem>
                <SelectItem value="active">{labels.filters.active}</SelectItem>
                <SelectItem value="inactive">{labels.filters.inactive}</SelectItem>
                <SelectItem value="on_leave">{labels.filters.on_leave}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={filteredEmployees}
            loading={loading}
            emptyMessage={labels.empty_states.no_employees}
            onRowClick={(employee) => openModal(employee, 'view')}
          />
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map(dept => {
              const deptEmployees = employeesByDepartment[dept.value] || employeesByDepartment[dept.label] || [];
              const activeCount = deptEmployees.filter(e => e.status === 'active').length;
              
              return (
                <Card key={dept.value} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      {dept.label}
                      <Badge variant="secondary">{deptEmployees.length}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {activeCount} active, {deptEmployees.length - activeCount} inactive/on leave
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {deptEmployees.length > 0 ? (
                      <div className="space-y-2">
                        {deptEmployees.slice(0, 5).map(emp => (
                          <div 
                            key={emp.id} 
                            className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                            onClick={() => openModal(emp, 'view')}
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                              {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {emp.firstName} {emp.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{getRoleLabel(emp.role)}</p>
                            </div>
                            <StatusBadge 
                              status={emp.status.replace('_', ' ')} 
                              variant={getStatusVariant(emp.status)} 
                            />
                          </div>
                        ))}
                        {deptEmployees.length > 5 && (
                          <p className="text-sm text-muted-foreground text-center pt-2">
                            +{deptEmployees.length - 5} more
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No employees in this department
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map(role => {
              const roleEmployees = employeesByRole[role.value] || employeesByRole[role.label] || [];
              const isManager = role.metadata?.managerLevel || false;
              
              return (
                <Card key={role.value} className={`hover:shadow-md transition-shadow ${isManager ? 'border-primary/50' : ''}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {role.label}
                        {isManager && (
                          <Badge variant="outline" className="text-xs">Manager</Badge>
                        )}
                      </span>
                      <Badge variant="secondary">{roleEmployees.length}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {isManager 
                        ? 'Can approve discounts, refunds, and overrides' 
                        : 'Standard employee access'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {roleEmployees.length > 0 ? (
                      <div className="space-y-2">
                        {roleEmployees.slice(0, 4).map(emp => (
                          <div 
                            key={emp.id} 
                            className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                            onClick={() => openModal(emp, 'view')}
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                              {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {emp.firstName} {emp.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{getDepartmentLabel(emp.department)}</p>
                            </div>
                          </div>
                        ))}
                        {roleEmployees.length > 4 && (
                          <p className="text-sm text-muted-foreground text-center pt-2">
                            +{roleEmployees.length - 4} more
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No employees with this role
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>View and manage employee work schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Employee</th>
                      <th className="text-center p-3 font-medium">Mon</th>
                      <th className="text-center p-3 font-medium">Tue</th>
                      <th className="text-center p-3 font-medium">Wed</th>
                      <th className="text-center p-3 font-medium">Thu</th>
                      <th className="text-center p-3 font-medium">Fri</th>
                      <th className="text-center p-3 font-medium">Sat</th>
                      <th className="text-center p-3 font-medium">Sun</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.filter(e => e.status === 'active').slice(0, 10).map(emp => (
                      <tr key={emp.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                              {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{emp.firstName} {emp.lastName}</p>
                              <p className="text-xs text-muted-foreground">{getRoleLabel(emp.role)}</p>
                            </div>
                          </div>
                        </td>
                        {/* Sample schedule - would come from API */}
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                          <td key={day} className="text-center p-3">
                            {i < 5 ? (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                9-5
                              </span>
                            ) : i === 5 ? (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                                10-2
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Off</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-primary/10 rounded"></span>
                  <span>Full Shift</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-amber-100 rounded"></span>
                  <span>Part Shift</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-muted rounded"></span>
                  <span>Off</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Employees with highest performance scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.filter(e => e.status === 'active').slice(0, 5).map((emp, i) => (
                    <div key={emp.id} className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        {i + 1}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                        <p className="text-sm text-muted-foreground">{getRoleLabel(emp.role)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{95 - i * 3}%</p>
                        <p className="text-xs text-muted-foreground">Performance Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators across the team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <span>Average Attendance</span>
                    <span className="font-bold text-green-600">96.5%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <span>Task Completion Rate</span>
                    <span className="font-bold text-green-600">89.2%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <span>Customer Satisfaction</span>
                    <span className="font-bold text-green-600">4.7/5.0</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <span>Sales Target Achievement</span>
                    <span className="font-bold text-amber-600">82.4%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <span>Training Completion</span>
                    <span className="font-bold text-green-600">91.0%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Due */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Upcoming Performance Reviews</CardTitle>
                <CardDescription>Employees due for performance review</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Employee</th>
                        <th className="text-left p-3 font-medium">Department</th>
                        <th className="text-left p-3 font-medium">Last Review</th>
                        <th className="text-left p-3 font-medium">Due Date</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-right p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.filter(e => e.status === 'active').slice(0, 5).map((emp, i) => {
                        const dueInDays = 7 - i * 3;
                        return (
                          <tr key={emp.id} className="border-b hover:bg-muted/50">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                                  {emp.firstName[0]}{emp.lastName[0]}
                                </div>
                                <span className="font-medium">{emp.firstName} {emp.lastName}</span>
                              </div>
                            </td>
                            <td className="p-3">{getDepartmentLabel(emp.department)}</td>
                            <td className="p-3 text-muted-foreground">
                              {new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                            </td>
                            <td className="p-3">
                              {new Date(Date.now() + dueInDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                            </td>
                            <td className="p-3">
                              <Badge variant={dueInDays < 0 ? 'destructive' : dueInDays < 7 ? 'default' : 'secondary'}>
                                {dueInDays < 0 ? 'Overdue' : dueInDays < 7 ? 'Due Soon' : 'Upcoming'}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
                              <Button size="sm" variant="outline" onClick={() => openModal(emp, 'performance')}>
                                Start Review
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Employee Modal - Multiple Modes */}
      <Dialog open={!!selectedEmployee || modalMode === 'create'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'create' ? labels.modal_titles.add_employee :
               modalMode === 'edit' ? labels.modal_titles.edit_employee : 
               modalMode === 'delete' ? labels.modal_titles.delete_employee :
               modalMode === 'schedule' ? `${selectedEmployee?.firstName} ${selectedEmployee?.lastName} - ${labels.tabs.schedules}` :
               modalMode === 'performance' ? `${selectedEmployee?.firstName} ${selectedEmployee?.lastName} - ${labels.tabs.performance}` :
               `${selectedEmployee?.firstName} ${selectedEmployee?.lastName}`}
            </DialogTitle>
            <DialogDescription>
              {modalMode === 'create' ? 'Create a new employee record' :
               modalMode === 'edit' ? 'Update employee information' :
               modalMode === 'delete' ? labels.messages.confirm_delete :
               modalMode === 'schedule' ? `${labels.schedule.this_week} schedule` :
               modalMode === 'performance' ? labels.performance.title :
               `${getRoleLabel(selectedEmployee?.role || '')} • ${getDepartmentLabel(selectedEmployee?.department || '')}`}
            </DialogDescription>
          </DialogHeader>

          {/* View Mode */}
          {selectedEmployee && modalMode === 'view' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{labels.table_headers.email}</p>
                  <p className="font-medium">{selectedEmployee.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{labels.table_headers.phone}</p>
                  <p className="font-medium">{selectedEmployee.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{labels.table_headers.employee_id}</p>
                  <p className="font-medium font-mono">{selectedEmployee.employeeCode || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{labels.table_headers.status}</p>
                  <StatusBadge 
                    status={selectedEmployee.status.replace('_', ' ')} 
                    variant={getStatusVariant(selectedEmployee.status)} 
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{labels.table_headers.start_date}</p>
                  <p className="font-medium">
                    {new Date(selectedEmployee.hireDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{labels.table_headers.department}</p>
                  <p className="font-medium">{getDepartmentLabel(selectedEmployee.department)}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setModalMode('edit')}>{labels.buttons.edit}</Button>
                <Button variant="outline" onClick={() => setModalMode('schedule')}>{labels.buttons.view_schedule}</Button>
                <Button variant="outline" onClick={() => setModalMode('performance')}>{labels.performance.title}</Button>
                <Button variant="destructive" onClick={() => setModalMode('delete')}>{labels.buttons.delete}</Button>
              </div>
            </div>
          )}

          {/* Create/Edit Mode */}
          {(modalMode === 'edit' || modalMode === 'create') && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{labels.form_labels.first_name} *</Label>
                  <Input
                    id="firstName"
                    value={editForm.firstName || ''}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    placeholder={labels.form_placeholders.first_name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{labels.form_labels.last_name} *</Label>
                  <Input
                    id="lastName"
                    value={editForm.lastName || ''}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    placeholder={labels.form_placeholders.last_name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{labels.form_labels.email} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder={labels.form_placeholders.email}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{labels.form_labels.phone}</Label>
                  <Input
                    id="phone"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder={labels.form_placeholders.phone}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">{labels.form_labels.department} *</Label>
                  <Select
                    value={editForm.department as string}
                    onValueChange={(value) => setEditForm({ ...editForm, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={labels.form_placeholders.department} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">{labels.form_labels.position} *</Label>
                  <Select
                    value={editForm.role as string}
                    onValueChange={(value) => setEditForm({ ...editForm, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={labels.form_placeholders.position} />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">{labels.table_headers.status} *</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value) => setEditForm({ ...editForm, status: value as Employee['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={labels.filters.all_statuses} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{labels.status_labels?.active || 'Active'}</SelectItem>
                      <SelectItem value="inactive">{labels.status_labels?.inactive || 'Inactive'}</SelectItem>
                      <SelectItem value="on_leave">{labels.status_labels?.on_leave || 'On Leave'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {modalMode === 'create' && (
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">{labels.form_labels.start_date} *</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={editForm.hireDate?.split('T')[0] || ''}
                      onChange={(e) => setEditForm({ ...editForm, hireDate: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4 border-t">
                <Button variant="outline" onClick={() => modalMode === 'create' ? closeModal() : setModalMode('view')}>
                  {labels.buttons.cancel}
                </Button>
                <Button 
                  onClick={modalMode === 'create' ? handleCreateEmployee : handleSaveEmployee} 
                  disabled={saving || !editForm.firstName || !editForm.lastName || !editForm.email}
                >
                  {saving ? labels.messages.saving : modalMode === 'create' ? labels.buttons.add_employee : labels.buttons.save_changes}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Delete Confirmation */}
          {selectedEmployee && modalMode === 'delete' && (
            <div className="space-y-4">
              <p>{labels.messages.confirm_delete.replace('this employee', '')} <strong>{selectedEmployee.firstName} {selectedEmployee.lastName}</strong>?</p>
              <p className="text-sm text-muted-foreground">
                This will permanently remove the employee from the system. This action cannot be undone.
              </p>
              <DialogFooter className="pt-4 border-t">
                <Button variant="outline" onClick={() => setModalMode('view')}>{labels.buttons.cancel}</Button>
                <Button variant="destructive" onClick={handleDeleteEmployee} disabled={saving}>
                  {saving ? labels.messages.deleting : labels.buttons.delete}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Schedule Mode */}
          {selectedEmployee && modalMode === 'schedule' && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left text-sm">Day</th>
                      <th className="p-2 text-center text-sm">{labels.form_labels.shift_start}</th>
                      <th className="p-2 text-center text-sm">{labels.form_labels.shift_end}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => (
                      <tr key={day} className="border-t">
                        <td className="p-2 text-sm font-medium">{day}</td>
                        <td className="p-2 text-center text-sm">
                          {i < 5 ? '09:00' : i === 5 ? '10:00' : '-'}
                        </td>
                        <td className="p-2 text-center text-sm">
                          {i < 5 ? '17:00' : i === 5 ? '14:00' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Weekly Hours: <strong>42</strong></span>
                <span>Overtime: <strong>2 hrs</strong></span>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setModalMode('view')}>{labels.buttons.close}</Button>
                <Button>{labels.buttons.edit}</Button>
              </DialogFooter>
            </div>
          )}

          {/* Performance Mode */}
          {selectedEmployee && modalMode === 'performance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-3xl font-bold text-primary">92%</p>
                  <p className="text-sm text-muted-foreground">{labels.performance.score}</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-600">98%</p>
                  <p className="text-sm text-muted-foreground">Attendance</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Task Completion</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Customer Satisfaction</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Sales Target</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setModalMode('view')}>{labels.buttons.close}</Button>
                <Button>{labels.performance.reviews}</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
