import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { memberService } from '../../services/member.service.js';
import { memberSchema } from '../../utils/validators.js';
import { queryKeys } from '../../utils/queryKeys.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Button from '../../components/ui/Button.jsx';
import toast from 'react-hot-toast';

const departments = [
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'Information Technology', label: 'Information Technology' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Mechanical', label: 'Mechanical' },
  { value: 'Civil', label: 'Civil' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Other', label: 'Other' },
];

const years = [
  { value: 'FE', label: 'First Year (FE)' },
  { value: 'SE', label: 'Second Year (SE)' },
  { value: 'TE', label: 'Third Year (TE)' },
  { value: 'BE', label: 'Fourth Year (BE)' },
];

export default function MemberNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(memberSchema),
    defaultValues: { division: '', phoneNumber: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (data) => memberService.createMember(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      toast.success(`Member registered! Student ID: ${res.data.data.member.studentId}`);
      navigate('/admin/members');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to register member'),
  });

  return (
    <div>
      <PageHeader title="Register New Member" description="Create a new club member with auto-generated Student ID" />

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
          <Input label="Full Name" placeholder="John Doe" error={errors.fullName?.message} {...register('fullName')} required />
          <Input label="Email" type="email" placeholder="student@college.edu" error={errors.email?.message} {...register('email')} required />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Department" options={departments} placeholder="Select department" error={errors.department?.message} {...register('department')} required />
            <Select label="Academic Year" options={years} placeholder="Select year" error={errors.academicYear?.message} {...register('academicYear')} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Division" placeholder="A, B, C..." error={errors.division?.message} {...register('division')} />
            <Input label="Phone Number" placeholder="+91 9876543210" error={errors.phoneNumber?.message} {...register('phoneNumber')} />
          </div>

          <Input label="Password (optional)" type="password" placeholder="Create login account" helperText="If provided, a user account will be created for login" error={errors.password?.message} {...register('password')} />

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={mutation.isPending}>Register Member</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/members')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
