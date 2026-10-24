import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, User, Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { attendanceService } from '../../services/attendance.service.js';
import { activityService } from '../../services/activity.service.js';
import { memberService } from '../../services/member.service.js';

export default function RecordAttendanceModal({
  isOpen,
  onClose,
  initialMember = null, // If provided, locks to this member
  onSuccess = null,
}) {
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().split('T')[0];

  const [memberId, setMemberId] = useState(initialMember?._id || '');
  const [activityId, setActivityId] = useState('');
  const [status, setStatus] = useState('PRESENT');
  const [hoursAwarded, setHoursAwarded] = useState('');
  const [recordedAt, setRecordedAt] = useState(todayStr);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch activities
  const { data: rawActivitiesResponse, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['activities', 'dropdown'],
    queryFn: () => activityService.getActivities({ limit: 100 }),
    staleTime: 60 * 1000,
    enabled: isOpen,
  });

  const activities = useMemo(() => {
    if (!rawActivitiesResponse) return [];
    const r = rawActivitiesResponse;
    if (Array.isArray(r)) return r;
    if (Array.isArray(r.data?.data?.activities)) return r.data.data.activities;
    if (Array.isArray(r.data?.activities)) return r.data.activities;
    if (Array.isArray(r.data?.data)) return r.data.data;
    if (Array.isArray(r.data)) return r.data;
    if (Array.isArray(r.activities)) return r.activities;
    return [];
  }, [rawActivitiesResponse]);

  // Fetch members if not pre-provided
  const { data: rawMembersResponse, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['members', 'dropdown'],
    queryFn: () => memberService.getMembers({ limit: 100, status: 'ACTIVE' }),
    staleTime: 60 * 1000,
    enabled: isOpen && !initialMember,
  });

  const members = useMemo(() => {
    if (!rawMembersResponse) return [];
    const r = rawMembersResponse;
    if (Array.isArray(r)) return r;
    if (Array.isArray(r.data?.data?.members)) return r.data.data.members;
    if (Array.isArray(r.data?.members)) return r.data.members;
    if (Array.isArray(r.data?.data)) return r.data.data;
    if (Array.isArray(r.data)) return r.data;
    if (Array.isArray(r.members)) return r.members;
    return [];
  }, [rawMembersResponse]);

  // Update memberId when initialMember changes
  useEffect(() => {
    if (initialMember) {
      setMemberId(initialMember._id || initialMember.id);
    }
  }, [initialMember]);

  // When activity is selected, automatically fill default CCA hours
  const handleActivityChange = (actId) => {
    setActivityId(actId);
    const chosen = activities.find((a) => (a._id || a.id) === actId);
    if (chosen && chosen.ccaHours !== undefined) {
      setHoursAwarded(String(chosen.ccaHours));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!memberId) {
      setErrorMsg('Please select a member.');
      return;
    }
    if (!activityId) {
      setErrorMsg('Please select an activity.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await attendanceService.recordManualAttendance({
        memberId,
        activityId,
        status,
        hoursAwarded: hoursAwarded !== '' ? Number(hoursAwarded) : undefined,
        recordedAt,
        notes,
      });

      setSuccessMsg('Attendance recorded successfully! CCA hours updated.');

      // Invalidate relevant react-query caches so everything reflects immediately
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setSuccessMsg('');
        onClose();
        // Reset form if modal reopens
        if (!initialMember) setMemberId('');
        setActivityId('');
        setStatus('PRESENT');
        setHoursAwarded('');
        setNotes('');
      }, 1000);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Failed to record attendance.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        initialMember
          ? `Record Attendance - ${initialMember.fullName}`
          : 'Record Member Attendance'
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Member Selector / Display */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Member *
          </label>
          {initialMember ? (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-sm">
              <div>
                <span className="font-semibold text-gray-900">
                  {initialMember.fullName}
                </span>
                <span className="text-gray-500 font-mono ml-2 text-xs">
                  ({initialMember.studentId})
                </span>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded">
                {initialMember.department || 'Member'}
              </span>
            </div>
          ) : (
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Choose Member ({members.length} available) --</option>
              {members.map((m) => (
                <option key={m._id || m.id} value={m._id || m.id}>
                  {m.fullName} ({m.studentId}) - {m.department}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Activity Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Activity / Event *
          </label>
          <select
            value={activityId}
            onChange={(e) => handleActivityChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- Choose an Activity ({activities.length} available) --</option>
            {activities.map((act) => (
              <option key={act._id || act.id} value={act._id || act.id}>
                {act.title} ({act.activityCode}) - {act.ccaHours || 0} CCA hrs
              </option>
            ))}
          </select>
        </div>

        {/* Status & Hours Awarded in a row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Attendance Status *
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                if (e.target.value === 'ABSENT') {
                  setHoursAwarded('0');
                } else if (activityId) {
                  const chosen = activities.find((a) => (a._id || a.id) === activityId);
                  if (chosen) setHoursAwarded(String(chosen.ccaHours || 0));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PRESENT">PRESENT</option>
              <option value="ABSENT">ABSENT</option>
              <option value="CORRECTED">CORRECTED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              CCA Hours Awarded
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={hoursAwarded}
              onChange={(e) => setHoursAwarded(e.target.value)}
              placeholder="e.g. 5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Date Recorded */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Date Attended
          </label>
          <input
            type="date"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Notes / Reason (Optional)
          </label>
          <textarea
            rows="2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Manual verification by event lead"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save & Record Attendance'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
