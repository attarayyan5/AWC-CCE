import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { memberService } from '../../services/member.service.js';
import { queryKeys } from '../../utils/queryKeys.js';
import { formatDate, getStatusColor } from '../../utils/formatters.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { Plus, Eye, Edit, UserX, UserCheck } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import Pagination from '../../components/tables/Pagination.jsx';
import SearchInput from '../../components/forms/SearchInput.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import toast from 'react-hot-toast';

export default function MembersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const debouncedSearch = useDebounce(search);

  const params = { page, limit: 20, search: debouncedSearch, sortBy, sortOrder, status: statusFilter, department: departmentFilter };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.members.list(params),
    queryFn: () => memberService.getMembers(params).then(r => r.data),
  });

  const { data: filters } = useQuery({
    queryKey: queryKeys.members.filters,
    queryFn: () => memberService.getFilters().then(r => r.data.data),
    staleTime: 300000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => memberService.updateMemberStatus(id, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.members.all }); toast.success('Member status updated'); setConfirmAction(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  const columns = [
    { key: 'studentId', header: 'Student ID', sortable: true },
    { key: 'fullName', header: 'Name', sortable: true, render: (_, row) => <span className="font-medium">{row.fullName}</span> },
    { key: 'email', header: 'Email' },
    { key: 'department', header: 'Department' },
    { key: 'academicYear', header: 'Year' },
    { key: 'status', header: 'Status', render: (val) => <Badge variant={getStatusColor(val)}>{val}</Badge> },
    { key: 'joinedAt', header: 'Joined', render: (val) => formatDate(val) },
    {
      key: 'actions', header: 'Actions', render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(`/admin/members/${row._id}`)} className="p-1.5 rounded-lg hover:bg-gray-100 text-secondary-text" title="View"><Eye className="w-4 h-4" /></button>
          {row.status === 'ACTIVE'
            ? <button onClick={() => setConfirmAction({ id: row._id, status: 'INACTIVE', name: row.fullName })} className="p-1.5 rounded-lg hover:bg-error-light text-secondary-text" title="Deactivate"><UserX className="w-4 h-4" /></button>
            : <button onClick={() => setConfirmAction({ id: row._id, status: 'ACTIVE', name: row.fullName })} className="p-1.5 rounded-lg hover:bg-success-light text-secondary-text" title="Activate"><UserCheck className="w-4 h-4" /></button>
          }
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="Failed to load members" onRetry={refetch} />;

  return (
    <div>
      <PageHeader title="Members" description="Manage club members">
        <Button onClick={() => navigate('/admin/members/new')}><Plus className="w-4 h-4" /> Add Member</Button>
      </PageHeader>

      <Card padding="none">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name, email, or ID..." />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-border rounded-lg text-sm bg-white">
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          {filters?.departments?.length > 0 && (
            <select value={departmentFilter} onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-border rounded-lg text-sm bg-white">
              <option value="">All Departments</option>
              {filters.departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
        </div>

        <DataTable
          columns={columns}
          data={data?.data?.members}
          loading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={(key, order) => { setSortBy(key); setSortOrder(order); }}
        />

        <Pagination pagination={data?.pagination} onPageChange={setPage} />
      </Card>

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => statusMutation.mutate({ id: confirmAction.id, status: confirmAction.status })}
        title={confirmAction?.status === 'INACTIVE' ? 'Deactivate Member' : 'Activate Member'}
        message={`Are you sure you want to ${confirmAction?.status === 'INACTIVE' ? 'deactivate' : 'activate'} ${confirmAction?.name}?`}
        confirmText={confirmAction?.status === 'INACTIVE' ? 'Deactivate' : 'Activate'}
        confirmVariant={confirmAction?.status === 'INACTIVE' ? 'danger' : 'primary'}
        loading={statusMutation.isPending}
      />
    </div>
  );
}
