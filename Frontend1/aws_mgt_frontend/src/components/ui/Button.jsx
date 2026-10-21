import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-primary-blue text-white hover:bg-primary-blue-hover focus:ring-primary-blue',
  secondary: 'bg-white text-primary-text border border-border hover:bg-gray-50 focus:ring-gray-300',
  danger: 'bg-error text-white hover:bg-red-700 focus:ring-error',
  ghost: 'bg-transparent text-secondary-text hover:bg-gray-100 focus:ring-gray-300',
  outline: 'bg-transparent text-primary-blue border border-primary-blue hover:bg-primary-blue-light focus:ring-primary-blue',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button = forwardRef(({ variant = 'primary', size = 'md', loading = false, disabled = false, children, className = '', ...props }, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
