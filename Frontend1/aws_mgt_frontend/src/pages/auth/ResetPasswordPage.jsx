import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema } from '../../utils/validators.js';
import { authService } from '../../services/auth.service.js';
import { Lock, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.resetPassword({ token, newPassword: data.newPassword, confirmPassword: data.confirmPassword });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-xl bg-primary-blue flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">A</span>
        </div>
        <h1 className="text-2xl font-bold text-primary-text">Reset Password</h1>
        <p className="text-secondary-text text-sm mt-1">Enter your new password</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input label="New Password" type="password" placeholder="Min 8 characters" leftIcon={<Lock className="w-4 h-4" />} error={errors.newPassword?.message} {...register('newPassword')} />
        <Input label="Confirm Password" type="password" placeholder="Confirm password" leftIcon={<Lock className="w-4 h-4" />} error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" className="w-full" loading={loading}>Reset Password</Button>
        <Link to="/login" className="text-sm text-primary-blue hover:underline flex items-center justify-center gap-1 mt-4">
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>
      </form>
    </div>
  );
}
