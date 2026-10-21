import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Upload, Eye, Search } from 'lucide-react';

import PageHeader from '../../components/layout/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import Pagination from '../../components/tables/Pagination.jsx';
import SearchInput from '../../components/forms/SearchInput.jsx';

import { attendanceService } from '../../services/attendance.service.js';
import { queryKeys } from '../../utils/queryKeys.js';
import { formatDate } from '../../utils/formatters.js';
import { IMPORT_STATUS } from '../../utils/constants.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { usePagination } from '../../hooks/usePagination.js';

const STATUS_TAB_MAP = {
  ALL: null,
  UPLOADED: IMPORT_STATUS.UPLOADED,
  VALIDATED: IMPORT_STATUS.VALIDATED,
  COMPLETED: IMPORT_STATUS.COMPLETED,
  FAILED: IMPORT_STATUS.FAILED,
};

const statusBadgeVariant = (status) => {
  const map = {
    [IMPORT_STATUS.UPLOADED]: 'info',
    [IMPORT_STATUS.VALIDATED]: 'warning',
    [IMPORT_STATUS.COMPLETED]: 'success',
    [IMPORT_STATUS.FAILED]: 'error',
    [IMPORT_STATUS.CANCELLED]: 'neutral',
  };
  return map[status] || 'neutral';
};

export default function AttendancePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const { page, limit, nextPage, prevPage, goToPage, resetPage } = usePagination(1, 10);

  const queryParams = {
    page,
    limit,
    ...(STATUS_TAB_MAP[activeTab] && { status: STATUS_TAB_MAP[activeTab] }),
    ...(debouncedSearch && { search: debouncedSearch }),
  };

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.attendance?.imports?.(queryParams) ?? ['attendance', 'imports', queryParams],
    queryFn: () => attendanceService.getImports(queryParams),
    select: (res) => res.data ?? res,
  });

  const imports = response?.data ?? response?.imports ?? [];
  const totalPages = response?.pagination?.totalPages ?? response?.meta?.totalPages ?? 1;

  const handleTabChange = useCallback(
    (tab) => {
      setActiveTab(tab);
      resetPage();
    },
    [resetPage]
  );

  const handleSearchChange = useCallback(
    (val) => {
      setSearch(val);
      resetPage();
    },
    [resetPage]
  );

  const columns = [
    {
      header: 'Import ID',
      accessor: '_id',
      cell: (row) => (
        <span className="font-mono text-sm text-gray-600">
          {(row._id || row.id || '').slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Activity',
      accessor: 'activity',
      cell: (row) => (
        <span className="font-medium text-gray-900">
          {row.activity?.name || row.activityName || '—'}
        </span>
      ),
    },
    {
      header: 'File Name',
      accessor: 'fileName',
      cell: (row) => <span className="text-sm text-gray-600">{row.fileName || row.originalName || '—'}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <Badge variant={statusBadgeVariant(row.status)}>
          {(row.status || '').replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      header: 'Rows',
      accessor: 'totalRows',
      cell: (row) => <span className="text-sm text-gray-600">{row.totalRows ?? row.rowCount ?? '—'}</span>,
    },
    {
      header: 'Created Date',
      accessor: 'createdAt',
      cell: (row) => <span className="text-sm text-gray-500">{formatDate(row.createdAt)}</span>,
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/attendance/imports/${row._id || row.id}`);
          }}
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Attendance Management"
        description="Manage attendance imports and records"
        actions={
          <Button variant="primary" onClick={() => navigate('/admin/attendance/upload')}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Attendance
          </Button>
        }
      />

      <Card>
        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {Object.keys(STATUS_TAB_MAP).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab === 'ALL' ? 'All Imports' : tab.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by activity name..."
            />
          </div>
        </div>

        {/* Content */}
        {isError ? (
          <ErrorState
            message={error?.response?.data?.message || 'Failed to load attendance imports'}
            onRetry={refetch}
          />
        ) : imports.length === 0 && !isLoading ? (
          <EmptyState
            icon={Upload}
            title="No imports found"
            description="Upload an attendance file to get started."
            action={
              <Button variant="primary" onClick={() => navigate('/admin/attendance/upload')}>
                Upload Attendance
              </Button>
            }
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={imports}
              loading={isLoading}
            />
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
