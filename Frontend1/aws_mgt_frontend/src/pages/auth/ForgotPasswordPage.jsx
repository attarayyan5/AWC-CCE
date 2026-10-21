import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema } from '../../utils/validators.js';
import { authService } from '../../services/auth.service.js';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.forgotPassword(data);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
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
        <h1 className="text-2xl font-bold text-primary-text">Forgot Password</h1>
        <p className="text-secondary-text text-sm mt-1">Enter your email to receive a reset link</p>
      </div>

      {sent ? (
        <div className="text-center py-4">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
          <p className="text-primary-text font-medium mb-2">Check your email</p>
          <p className="text-sm text-secondary-text mb-6">If an account with that email exists, a password reset link has been sent.</p>
          <Link to="/login" className="text-sm text-primary-blue hover:underline flex items-center justify-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input label="Email" type="email" placeholder="you@college.edu" leftIcon={<Mail className="w-4 h-4" />} error={errors.email?.message} {...register('email')} />
          <Button type="submit" className="w-full" loading={loading}>Send Reset Link</Button>
          <Link to="/login" className="text-sm text-primary-blue hover:underline flex items-center justify-center gap-1 mt-4">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
        </form>
      )}
    </div>
  );
}
