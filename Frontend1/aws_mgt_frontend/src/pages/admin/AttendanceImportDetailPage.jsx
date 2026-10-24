import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Calendar,
  Clock,
  Play,
  Check,
  Ban
} from 'lucide-react';

import PageHeader from '../../components/layout/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import DataTable from '../../components/tables/DataTable.jsx';

import { attendanceService } from '../../services/attendance.service.js';
import { formatDate } from '../../utils/formatters.js';

export default function AttendanceImportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['attendance', 'import', id],
    queryFn: () => attendanceService.getImport(id),
    select: (res) => res.data?.data?.import || res.data?.import || res.data,
    staleTime: 30 * 1000,
  });

  const importRecord = response;
  const rows = importRecord?.rows || [];

  const handleValidate = async () => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      await attendanceService.validateImport(id, {
        columnMapping: importRecord.columnMapping || {
          studentId: 'studentId',
          email: 'email',
          fullName: 'fullName',
        },
      });
      refetch();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to validate batch',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!window.confirm('Confirm and commit attendance records to members database?')) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await attendanceService.confirmImport(id);
      refetch();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to confirm attendance import',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this attendance import?')) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await attendanceService.cancelImport(id);
      refetch();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to cancel import',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner />
      </div>
    );
  }

  if (isError || !importRecord) {
    return (
      <ErrorState
        message={error?.response?.data?.message || 'Failed to load import detail'}
        onRetry={refetch}
      />
    );
  }

  const rowColumns = [
    {
      header: 'Row',
      accessor: 'rowNumber',
      cell: (row) => <span className="font-mono text-sm text-gray-500">#{row.rowNumber}</span>,
    },
    {
      header: 'Raw Data',
      accessor: 'rawRow',
      cell: (row) => (
        <span className="text-xs font-mono text-gray-700 max-w-xs truncate block">
          {JSON.stringify(row.rawRow || {})}
        </span>
      ),
    },
    {
      header: 'Matched Member',
      accessor: 'resolvedMemberId',
      cell: (row) => (
        <div>
          {row.resolvedMemberId ? (
            <>
              <div className="font-medium text-gray-900">{row.resolvedMemberId.fullName}</div>
              <div className="text-xs font-mono text-gray-500">
                {row.resolvedMemberId.studentId} • {row.resolvedMemberId.email}
              </div>
            </>
          ) : (
            <span className="text-sm text-red-500 italic">Unresolved</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => {
        const variant =
          row.status === 'VALID'
            ? 'success'
            : row.status === 'COMMITTED'
            ? 'success'
            : row.status === 'DUPLICATE'
            ? 'warning'
            : 'error';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      header: 'Remarks',
      accessor: 'validationError',
      cell: (row) => (
        <span className="text-xs text-gray-500">{row.validationError || '—'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Import #${(importRecord._id || id).slice(-8).toUpperCase()}`}
        description={`File: ${importRecord.originalFilename || 'Uploaded sheet'}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/admin/attendance')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {importRecord.status === 'UPLOADED' && (
              <Button
                variant="primary"
                onClick={handleValidate}
                disabled={actionLoading}
              >
                <Play className="w-4 h-4 mr-2" />
                Validate Batch
              </Button>
            )}
            {importRecord.status === 'VALIDATED' && (
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={actionLoading}
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm & Commit
              </Button>
            )}
            {['UPLOADED', 'VALIDATED'].includes(importRecord.status) && (
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={actionLoading}
              >
                <Ban className="w-4 h-4 mr-2" />
                Cancel Import
              </Button>
            )}
          </div>
        }
      />

      {actionMessage && (
        <div
          className={`p-4 rounded-lg text-sm border ${
            actionMessage.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-green-50 text-green-700 border-green-200'
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-gray-800">{importRecord.totalRows || 0}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Total Rows</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-green-600">{importRecord.validRows || 0}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Valid Rows</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-amber-500">{importRecord.duplicateRows || 0}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Duplicate Rows</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-red-500">{importRecord.invalidRows || importRecord.unknownMemberRows || 0}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Unmatched / Invalid</div>
        </Card>
      </div>

      {/* Activity Details Card */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">Target Activity</h3>
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
          <div>
            <span className="text-gray-400 block text-xs">Title:</span>
            <span className="font-medium text-gray-900">
              {importRecord.activityId?.title || '—'}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs">Code:</span>
            <span className="font-mono">{importRecord.activityId?.activityCode || '—'}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs">CCA Hours:</span>
            <span className="font-semibold text-blue-600">
              {importRecord.activityId?.ccaHours || 0} hrs
            </span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs">Status:</span>
            <Badge variant={importRecord.status === 'COMPLETED' ? 'success' : 'info'}>
              {importRecord.status}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Row breakdown Table */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4 text-sm">
          Row Processing Breakdown ({rows.length} rows)
        </h3>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500 italic py-6 text-center">
            Row breakdown will appear once validation begins.
          </p>
        ) : (
          <DataTable columns={rowColumns} data={rows} />
        )}
      </Card>
    </div>
  );
}
