import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { memberService } from '../../services/member.service.js';
import { queryKeys } from '../../utils/queryKeys.js';
import { formatDate, formatHours, getStatusColor } from '../../utils/formatters.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

export default function MemberDetailPage() {
  const { id } = useParams();

  const { data: report, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.members.report(id),
    queryFn: () => memberService.getMemberReport(id).then(r => r.data.data),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error) return <ErrorState message="Failed to load member" onRetry={refetch} />;

  const m = report?.member;
  const history = report?.attendanceHistory || [];

  return (
    <div>
      <PageHeader title={m?.fullName || 'Member Details'} description={`Student ID: ${m?.studentId}`} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card>
          <div className="text-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary-blue-light flex items-center justify-center mx-auto mb-3">
              <span className="text-primary-blue font-bold text-xl">{m?.fullName?.charAt(0)}</span>
            </div>
            <h2 className="font-semibold text-primary-text">{m?.fullName}</h2>
            <p className="text-sm text-secondary-text">{m?.email}</p>
            <Badge variant={getStatusColor(m?.status)} className="mt-2">{m?.status}</Badge>
          </div>
          <div className="space-y-3 text-sm border-t border-border pt-4">
            <div className="flex justify-between"><span className="text-secondary-text">Student ID</span><span className="font-medium">{m?.studentId}</span></div>
            <div className="flex justify-between"><span className="text-secondary-text">Department</span><span className="font-medium">{m?.department}</span></div>
            <div className="flex justify-between"><span className="text-secondary-text">Academic Year</span><span className="font-medium">{m?.academicYear}</span></div>
            <div className="flex justify-between"><span className="text-secondary-text">Division</span><span className="font-medium">{m?.division || '-'}</span></div>
            <div className="flex justify-between"><span className="text-secondary-text">Joined</span><span className="font-medium">{formatDate(m?.joinedAt)}</span></div>
          </div>
        </Card>

        {/* Stats + Activity History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card><p className="text-sm text-secondary-text">Total CCA Hours</p><p className="text-3xl font-bold text-primary-blue mt-1">{formatHours(report?.totalHours)}</p></Card>
            <Card><p className="text-sm text-secondary-text">Activities Attended</p><p className="text-3xl font-bold text-primary-text mt-1">{report?.totalActivities || 0}</p></Card>
          </div>

          <Card padding="none">
            <div className="px-6 py-4 border-b border-border"><h3 className="font-semibold text-primary-text">Activity History</h3></div>
            {history.length === 0 ? (
              <p className="text-sm text-secondary-text text-center py-8">No attendance records yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-secondary-text font-medium">Activity</th>
                    <th className="px-4 py-3 text-left text-secondary-text font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-secondary-text font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-secondary-text font-medium">Hours</th>
                  </tr></thead>
                  <tbody>
                    {history.map((a) => (
                      <tr key={a._id} className="border-b border-border/50">
                        <td className="px-4 py-3 font-medium">{a.activityId?.title || '-'}</td>
                        <td className="px-4 py-3">{formatDate(a.activityId?.activityDate)}</td>
                        <td className="px-4 py-3"><Badge variant={getStatusColor(a.status)}>{a.status}</Badge></td>
                        <td className="px-4 py-3">{formatHours(a.hoursAwarded)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
