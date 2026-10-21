import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services/analytics.service.js';
import { queryKeys } from '../../utils/queryKeys.js';
import { formatNumber, formatHours } from '../../utils/formatters.js';
import { Users, Calendar, Clock, ClipboardList, TrendingUp, Activity, BarChart3, Upload } from 'lucide-react';
import StatCard from '../../components/ui/StatCard.jsx';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import BarChartWrapper from '../../components/charts/BarChartWrapper.jsx';
import LineChartWrapper from '../../components/charts/LineChartWrapper.jsx';
import PieChartWrapper from '../../components/charts/PieChartWrapper.jsx';
import PageHeader from '../../components/layout/PageHeader.jsx';

export default function DashboardPage() {
  const { data: overview, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.analytics.overview,
    queryFn: () => analyticsService.getOverview().then(r => r.data.data),
    staleTime: 60000,
  });

  const { data: topMembers } = useQuery({
    queryKey: queryKeys.analytics.topMembers({}),
    queryFn: () => analyticsService.getTopMembers().then(r => r.data.data.topMembers),
    staleTime: 60000,
  });

  const { data: trends } = useQuery({
    queryKey: queryKeys.analytics.trends({}),
    queryFn: () => analyticsService.getMonthlyTrends().then(r => r.data.data.trends),
    staleTime: 60000,
  });

  const { data: departments } = useQuery({
    queryKey: queryKeys.analytics.departments,
    queryFn: () => analyticsService.getDepartmentStats().then(r => r.data.data.departments),
    staleTime: 60000,
  });

  const { data: participation } = useQuery({
    queryKey: queryKeys.analytics.participation,
    queryFn: () => analyticsService.getActivityParticipation().then(r => r.data.data.participation),
    staleTime: 60000,
  });

  if (error) return <ErrorState message="Failed to load dashboard" onRetry={refetch} />;

  const stats = [
    { icon: Users, label: 'Total Members', value: formatNumber(overview?.totalMembers) },
    { icon: Users, label: 'Active Members', value: formatNumber(overview?.activeMembers) },
    { icon: Calendar, label: 'Total Activities', value: formatNumber(overview?.totalActivities) },
    { icon: Activity, label: 'Upcoming', value: formatNumber(overview?.upcomingActivities) },
    { icon: Clock, label: 'Total CCA Hours', value: formatHours(overview?.totalCcaHours) },
    { icon: TrendingUp, label: 'Avg Hours/Member', value: formatHours(overview?.avgHoursPerMember) },
    { icon: BarChart3, label: 'Completed', value: formatNumber(overview?.completedActivities) },
    { icon: Upload, label: 'Pending Imports', value: formatNumber(overview?.pendingImports) },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of AWS Club activities and performance" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
          : stats.map((s, i) => <StatCard key={i} {...s} />)
        }
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {topMembers && topMembers.length > 0 && (
          <BarChartWrapper
            data={topMembers.slice(0, 10)}
            dataKey="totalHours"
            xAxisKey="fullName"
            title="Top Members by CCA Hours"
            barLabel="Hours"
          />
        )}

        {trends && trends.length > 0 && (
          <LineChartWrapper
            data={trends}
            dataKey="attendanceCount"
            xAxisKey="month"
            title="Monthly Attendance Trends"
            lineLabel="Attendance"
          />
        )}

        {departments && departments.length > 0 && (
          <PieChartWrapper
            data={departments}
            dataKey="memberCount"
            nameKey="department"
            title="Department Distribution"
          />
        )}

        {participation && participation.length > 0 && (
          <BarChartWrapper
            data={participation.slice(0, 10)}
            dataKey="attendeeCount"
            xAxisKey="title"
            title="Activity Participation"
            color="#16A34A"
            barLabel="Attendees"
          />
        )}
      </div>
    </div>
  );
}
