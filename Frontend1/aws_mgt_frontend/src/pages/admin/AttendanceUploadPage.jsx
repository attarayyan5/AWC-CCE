import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Upload, ArrowLeft, FileText, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

import PageHeader from '../../components/layout/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { activityService } from '../../services/activity.service.js';
import { attendanceService } from '../../services/attendance.service.js';

export default function AttendanceUploadPage() {
  const navigate = useNavigate();
  const [selectedActivity, setSelectedActivity] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch activities with caching
  const {
    data: rawActivitiesResponse,
    isLoading: isLoadingActivities,
    isError: isActivitiesError,
    error: activitiesError,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: ['activities', 'dropdown'],
    queryFn: () => activityService.getActivities({ limit: 100 }),
    staleTime: 60 * 1000,
  });

  // Robust parsing of activities array from response
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

  // Auto-select if only 1 activity is available
  useEffect(() => {
    if (!selectedActivity && activities.length === 1) {
      setSelectedActivity(activities[0]._id || activities[0].id);
    }
  }, [activities, selectedActivity]);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedActivity) {
      setErrorMsg('Please select a target activity from the dropdown.');
      return;
    }
    if (!file) {
      setErrorMsg('Please select an attendance CSV or Excel file.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      // Provide both field names so multer always receives the file
      formData.append('attendanceFile', file);
      formData.append('file', file);
      formData.append('activityId', selectedActivity);
      formData.append(
        'columnMapping',
        JSON.stringify({
          studentId: 'Student ID',
          email: 'Email',
          fullName: 'Full Name',
        })
      );

      const res = await attendanceService.uploadImport(formData);
      const resData = res.data?.data || res.data;
      const importId = resData?.importId || resData?._id || resData?.id;

      if (importId) {
        navigate(`/admin/attendance/imports/${importId}`);
      } else {
        navigate('/admin/attendance');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      const backendMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to upload attendance file. Please check file format and try again.';
      setErrorMsg(backendMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Upload Attendance"
        description="Upload a CSV or Excel sheet to record attendance for an activity"
        actions={
          <Button variant="ghost" onClick={() => navigate('/admin/attendance')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Attendance
          </Button>
        }
      />

      <div className="max-w-2xl mx-auto">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Select Activity */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Target Activity *
                </label>
                <button
                  type="button"
                  onClick={() => refetchActivities()}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh Activities
                </button>
              </div>

              {isLoadingActivities ? (
                <div className="text-sm text-gray-500 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  Loading activities...
                </div>
              ) : isActivitiesError ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
                  <span>Failed to load activities: {activitiesError?.message || 'Network error'}</span>
                  <button
                    type="button"
                    onClick={() => refetchActivities()}
                    className="text-xs text-red-800 underline font-semibold ml-2"
                  >
                    Retry
                  </button>
                </div>
              ) : activities.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center justify-between">
                  <span>No activities found. Please create an activity first.</span>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/activities/new')}
                    className="text-xs text-blue-600 underline font-semibold ml-2"
                  >
                    Create Activity
                  </button>
                </div>
              ) : (
                <select
                  value={selectedActivity}
                  onChange={(e) => setSelectedActivity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                >
                  <option value="">-- Choose an Activity ({activities.length} available) --</option>
                  {activities.map((act) => (
                    <option key={act._id || act.id} value={act._id || act.id}>
                      {act.title} ({act.activityCode}) - {act.ccaHours || 0} CCA hrs [{act.status}]
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* File Upload Drop Area */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Attendance File (.csv, .xlsx, .xls) *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors bg-gray-50">
                <input
                  type="file"
                  id="attendance-file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="attendance-file"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <Upload className="w-10 h-10 text-gray-400 mb-3" />
                  {file ? (
                    <div className="flex items-center gap-2 text-blue-600 font-medium">
                      <FileText className="w-5 h-5" />
                      <span>{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-700">
                        Click to select or drag and drop attendance sheet
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        CSV, XLS, or XLSX with Student ID, Name, or Email columns
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Expected File Columns hint */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs text-blue-800 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-blue-900">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Recommended Column Formats:
              </div>
              <p>Your file should contain columns matching member identities:</p>
              <ul className="list-disc list-inside pl-2 space-y-0.5 text-blue-700">
                <li><strong>Student ID</strong> (e.g. S1234567A, 2101234)</li>
                <li><strong>Full Name</strong> (e.g. John Doe)</li>
                <li><strong>Email</strong> (e.g. student@school.edu)</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/admin/attendance')}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isUploading || !selectedActivity}>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading & Processing...
                  </>
                ) : (
                  'Upload & Process Batch'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
