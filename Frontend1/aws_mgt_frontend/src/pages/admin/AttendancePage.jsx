import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Upload, Eye, FileText, CheckCircle2, Clock, Users, Calendar, UserPlus } from 'lucide-react';

import PageHeader from '../../components/layout/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import DataTable from '../../components/tables/DataTable.jsx';
import Pagination from '../../components/tables/Pagination.jsx';
import SearchInput from '../../components/forms/SearchInput.jsx';
import RecordAttendanceModal from '../../components/attendance/RecordAttendanceModal.jsx';

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
  const [viewMode, setViewMode] = useState('imports'); // 'imports' or 'records'
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const { page, limit, goToPage, resetPage } = usePagination(1, 10);

  // Query parameters for imports
  const importParams = useMemo(
    () => ({
      page,
      limit,
      ...(STATUS_TAB_MAP[activeTab] && { status: STATUS_TAB_MAP[activeTab] }),
      ...(debouncedSearch && { search: debouncedSearch }),
    }),
    [page, limit, activeTab, debouncedSearch]
  );

  // Query parameters for records
  const recordParams = useMemo(
    () => ({
      page,
      limit,
      ...(debouncedSearch && { search: debouncedSearch }),
    }),
    [page, limit, debouncedSearch]
  );

  // Imports query with aggressive caching for zero latency
  const {
    data: importResponse,
    isLoading: isImportsLoading,
    isError: isImportsError,
    error: importError,
    refetch: refetchImports,
  } = useQuery({
    queryKey: ['attendance', 'imports', importParams],
    queryFn: () => attendanceService.getImports(importParams),
    select: (res) => res.data ?? res,
    enabled: viewMode === 'imports',
    staleTime: 60 * 1000, // 1 minute fresh cache
    placeholderData: (previousData) => previousData, // instant transition
  });

  // Records query with caching for zero latency
  const {
    data: recordResponse,
    isLoading: isRecordsLoading,
    isError: isRecordsError,
    error: recordError,
    refetch: refetchRecords,
  } = useQuery({
    queryKey: ['attendance', 'records', recordParams],
    queryFn: () => attendanceService.getAttendance(recordParams),
    select: (res) => res.data ?? res,
    enabled: viewMode === 'records',
    staleTime: 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const imports = importResponse?.data?.imports ?? importResponse?.imports ?? [];
  const importTotalPages =
    importResponse?.pagination?.totalPages ?? importResponse?.meta?.totalPages ?? 1;

  const records = recordResponse?.data?.attendance ?? recordResponse?.attendance ?? [];
  const recordTotalPages =
    recordResponse?.pagination?.totalPages ?? recordResponse?.meta?.totalPages ?? 1;

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

  // Columns for Imports Table
  const importColumns = [
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
          {row.activityId?.title || row.activity?.name || row.activityName || '—'}
        </span>
      ),
    },
    {
      header: 'File Name',
      accessor: 'originalFilename',
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {row.originalFilename || row.fileName || row.originalName || '—'}
        </span>
      ),
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
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {row.totalRows ?? row.rowCount ?? '—'}
        </span>
      ),
    },
    {
      header: 'Created Date',
      accessor: 'createdAt',
      cell: (row) => (
        <span className="text-sm text-gray-500">{formatDate(row.createdAt)}</span>
      ),
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
          title="View Import Details"
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  // Columns for Records Table
  const recordColumns = [
    {
      header: 'Student ID',
      accessor: 'studentId',
      cell: (row) => (
        <span className="font-mono text-sm font-semibold text-gray-800">
          {row.memberId?.studentId || '—'}
        </span>
      ),
    },
    {
      header: 'Member Name',
      accessor: 'memberName',
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.memberId?.fullName || '—'}
          </div>
          <div className="text-xs text-gray-500">{row.memberId?.email || ''}</div>
        </div>
      ),
    },
    {
      header: 'Activity',
      accessor: 'activity',
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.activityId?.title || '—'}
          </div>
          <div className="text-xs text-gray-500 font-mono">
            {row.activityId?.activityCode || ''}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => {
        const variant =
          row.status === 'PRESENT'
            ? 'success'
            : row.status === 'CORRECTED'
            ? 'warning'
            : 'error';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      header: 'CCA Hours',
      accessor: 'hoursAwarded',
      cell: (row) => (
        <span className="font-mono text-sm font-semibold text-blue-600">
          {row.hoursAwarded ?? 0} hrs
        </span>
      ),
    },
    {
      header: 'Recorded Date',
      accessor: 'recordedAt',
      cell: (row) => (
        <span className="text-sm text-gray-500">
          {formatDate(row.recordedAt || row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Attendance Management"
        description="Monitor, record, and import member attendance data"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsRecordModalOpen(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Manual Attendance
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/admin/attendance/upload')}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Attendance
            </Button>
          </div>
        }
      />

      {/* View Mode Switcher (Imports vs Direct Records) */}
      <div className="flex border-b border-gray-200 mb-6 gap-6">
        <button
          onClick={() => {
            setViewMode('imports');
            resetPage();
          }}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            viewMode === 'imports'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Import Batches ({imports.length})
        </button>
        <button
          onClick={() => {
            setViewMode('records');
            resetPage();
          }}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            viewMode === 'records'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Member Attendance Records ({records.length})
        </button>
      </div>

      <Card>
        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {viewMode === 'imports' ? (
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
          ) : (
            <div className="text-sm font-medium text-gray-600">
              Showing verified member attendance log
            </div>
          )}

          <div className="w-full sm:w-72">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder={
                viewMode === 'imports'
                  ? 'Search by activity or file...'
                  : 'Search by student ID or name...'
              }
            />
          </div>
        </div>

        {/* Content for Imports View */}
        {viewMode === 'imports' && (
          <>
            {isImportsError ? (
              <ErrorState
                message={
                  importError?.response?.data?.message ||
                  'Failed to load attendance imports'
                }
                onRetry={refetchImports}
              />
            ) : imports.length === 0 && !isImportsLoading ? (
              <EmptyState
                icon={Upload}
                title="No imports found"
                description="Upload an attendance CSV or Excel file to get started."
                action={() => navigate('/admin/attendance/upload')}
                actionLabel="Upload Attendance"
              />
            ) : (
              <>
                <DataTable
                  columns={importColumns}
                  data={imports}
                  loading={isImportsLoading}
                />
                {importTotalPages > 1 && (
                  <div className="mt-4">
                    <Pagination
                      page={page}
                      totalPages={importTotalPages}
                      onPageChange={goToPage}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Content for Records View */}
        {viewMode === 'records' && (
          <>
            {isRecordsError ? (
              <ErrorState
                message={
                  recordError?.response?.data?.message ||
                  'Failed to load member attendance records'
                }
                onRetry={refetchRecords}
              />
            ) : records.length === 0 && !isRecordsLoading ? (
              <EmptyState
                icon={Users}
                title="No attendance records found"
                description="No individual member attendance has been recorded yet."
              />
            ) : (
              <>
                <DataTable
                  columns={recordColumns}
                  data={records}
                  loading={isRecordsLoading}
                />
                {recordTotalPages > 1 && (
                  <div className="mt-4">
                    <Pagination
                      page={page}
                      totalPages={recordTotalPages}
                      onPageChange={goToPage}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Card>

      {/* Manual Attendance Modal */}
      <RecordAttendanceModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={() => {
          refetchRecords();
          setViewMode('records');
        }}
      />
    </div>
  );
}
