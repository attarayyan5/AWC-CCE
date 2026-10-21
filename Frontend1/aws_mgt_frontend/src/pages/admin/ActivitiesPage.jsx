import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityService } from '../../services/activity.service.js';
import { queryKeys } from '../../utils/queryKeys.js';
import { formatDate, formatHours, getStatusColor } from '../../utils/formatters.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { Plus, Eye, Edit } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import Pagination from '../../components/tables/Pagination.jsx';
import SearchInput from '../../components/forms/SearchInput.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { ACTIVITY_CATEGORIES } from '../../utils/constants.js';

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('activityDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const debouncedSearch = useDebounce(search);

  const params = { page, limit: 20, search: debouncedSearch, status: statusFilter, category: categoryFilter, sortBy, sortOrder };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.activities.list(params),
    queryFn: () => activityService.getActivities(params).then(r => r.data),
  });

  const columns = [
    { key: 'activityCode', header: 'Code', sortable: true },
    { key: 'title', header: 'Title', sortable: true, render: (_, row) => <span className="font-medium">{row.title}</span> },
    { key: 'category', header: 'Category', render: (val) => <Badge variant="info">{val}</Badge> },
    { key: 'activityDate', header: 'Date', sortable: true, render: (val) => formatDate(val) },
    { key: 'ccaHours', header: 'CCA Hours', sortable: true, render: (val) => <span className="font-semibold text-primary-blue">{formatHours(val)}</span> },
    { key: 'status', header: 'Status', render: (val) => <Badge variant={getStatusColor(val)}>{val}</Badge> },
    {
      key: 'actions', header: 'Actions', render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(`/admin/activities/${row._id}/edit`)} className="p-1.5 rounded-lg hover:bg-gray-100 text-secondary-text" title="Edit"><Edit className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  if (error) return <ErrorState message="Failed to load activities" onRetry={refetch} />;

  return (
    <div>
      <PageHeader title="Activities" description="Manage CCA activities">
        <Button onClick={() => navigate('/admin/activities/new')}><Plus className="w-4 h-4" /> New Activity</Button>
      </PageHeader>

      <Card padding="none">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search activities..." />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-border rounded-lg text-sm bg-white">
            <option value="ALL">All Status</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="COMPLETED">Completed</option>
            <option value="DRAFT">Draft</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-border rounded-lg text-sm bg-white">
            <option value="ALL">All Categories</option>
            {ACTIVITY_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <DataTable columns={columns} data={data?.data?.activities} loading={isLoading} sortBy={sortBy} sortOrder={sortOrder} onSort={(k, o) => { setSortBy(k); setSortOrder(o); }} />
        <Pagination pagination={data?.pagination} onPageChange={setPage} />
      </Card>
    </div>
  );
}
