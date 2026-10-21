import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { activityService } from '../../services/activity.service.js';
import { activitySchema } from '../../utils/validators.js';
import { queryKeys } from '../../utils/queryKeys.js';
import { ACTIVITY_CATEGORIES } from '../../utils/constants.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import Button from '../../components/ui/Button.jsx';
import toast from 'react-hot-toast';

const statusOpts = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'COMPLETED', label: 'Completed' },
];

export default function ActivityNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(activitySchema),
    defaultValues: { status: 'UPCOMING', ccaHours: 1 },
  });

  const mutation = useMutation({
    mutationFn: (data) => activityService.createActivity(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
      toast.success(`Activity created: ${res.data.data.activity.activityCode}`);
      navigate('/admin/activities');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create activity'),
  });

  return (
    <div>
      <PageHeader title="Create Activity" description="Add a new CCA activity" />
      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
          <Input label="Title" placeholder="AWS Cloud Practitioner Workshop" error={errors.title?.message} {...register('title')} required />
          <Textarea label="Description" placeholder="Activity description..." error={errors.description?.message} {...register('description')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Category" options={ACTIVITY_CATEGORIES} placeholder="Select category" error={errors.category?.message} {...register('category')} required />
            <Select label="Status" options={statusOpts} error={errors.status?.message} {...register('status')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Date" type="date" error={errors.activityDate?.message} {...register('activityDate')} required />
            <Input label="Start Time" type="time" error={errors.startTime?.message} {...register('startTime')} />
            <Input label="End Time" type="time" error={errors.endTime?.message} {...register('endTime')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Location" placeholder="Room 301 / Zoom link" error={errors.location?.message} {...register('location')} />
            <Input label="CCA Hours" type="number" step="0.5" min="0" max="24" error={errors.ccaHours?.message} {...register('ccaHours', { valueAsNumber: true })} required />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={mutation.isPending}>Create Activity</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/activities')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
