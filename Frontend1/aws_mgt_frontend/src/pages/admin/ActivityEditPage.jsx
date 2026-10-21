import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';

import PageHeader from '../../components/layout/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';

import { activityService } from '../../services/activity.service.js';
import { activitySchema } from '../../utils/validators.js';
import { ACTIVITY_CATEGORIES, ACTIVITY_STATUS } from '../../utils/constants.js';
import { queryKeys } from '../../utils/queryKeys.js';

const formatLabel = (value) =>
  String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const categoryOptions = ACTIVITY_CATEGORIES.map((category) => ({
  value: category.value,
  label: category.label,
}));

const statusOptions = ACTIVITY_STATUS.map((status) => ({
  value: status.value,
  label: status.label,
}));
export default function ActivityEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: activity,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.activities?.detail?.(id) ?? ['activities', id],
    queryFn: () => activityService.getActivity(id),
    select: (res) => res.data?.data ?? res.data ?? res,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      status: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      ccaHours: '',
      maxParticipants: '',
    },
  });

  useEffect(() => {
    if (activity) {
      reset({
        name: activity.name || '',
        description: activity.description || '',
        category: activity.category || '',
        status: activity.status || '',
        date: activity.date ? activity.date.substring(0, 10) : '',
        startTime: activity.startTime || '',
        endTime: activity.endTime || '',
        location: activity.location || '',
        ccaHours: activity.ccaHours?.toString() || '',
        maxParticipants: activity.maxParticipants?.toString() || '',
      });
    }
  }, [activity, reset]);

  const updateMutation = useMutation({
    mutationFn: (data) => activityService.updateActivity(id, data),
    onSuccess: () => {
      toast.success('Activity updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.activities?.detail?.(id) ?? ['activities', id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities?.list?.() ?? ['activities'] });
      navigate('/admin/activities');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update activity');
    },
  });

  const onSubmit = (data) => {
    const payload = {
      ...data,
      ccaHours: data.ccaHours ? Number(data.ccaHours) : undefined,
      maxParticipants: data.maxParticipants ? Number(data.maxParticipants) : undefined,
    };
    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error?.response?.data?.message || 'Failed to load activity'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Edit Activity"
        description={`Editing: ${activity?.name || 'Activity'}`}
        actions={
          <Button variant="ghost" onClick={() => navigate('/admin/activities')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Activities
          </Button>
        }
      />

      <Card className="max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Activity Name"
                placeholder="Enter activity name"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Description"
                placeholder="Enter activity description"
                error={errors.description?.message}
                {...register('description')}
              />
            </div>

            <Select
              label="Category"
              options={categoryOptions}
              placeholder="Select category"
              error={errors.category?.message}
              {...register('category')}
            />

            <Select
              label="Status"
              options={statusOptions}
              placeholder="Select status"
              error={errors.status?.message}
              {...register('status')}
            />

            <Input
              label="Date"
              type="date"
              error={errors.date?.message}
              {...register('date')}
            />

            <Input
              label="Location"
              placeholder="Enter location"
              error={errors.location?.message}
              {...register('location')}
            />

            <Input
              label="Start Time"
              type="time"
              error={errors.startTime?.message}
              {...register('startTime')}
            />

            <Input
              label="End Time"
              type="time"
              error={errors.endTime?.message}
              {...register('endTime')}
            />

            <Input
              label="CCA Hours"
              type="number"
              placeholder="e.g. 2"
              error={errors.ccaHours?.message}
              {...register('ccaHours')}
            />

            <Input
              label="Max Participants"
              type="number"
              placeholder="e.g. 50"
              error={errors.maxParticipants?.message}
              {...register('maxParticipants')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/admin/activities')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={updateMutation.isPending}
              disabled={!isDirty}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
