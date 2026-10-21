const badgeVariants = {
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  error: 'bg-error-light text-error',
  info: 'bg-primary-blue-light text-primary-blue',
  neutral: 'bg-gray-100 text-secondary-text',
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeVariants[variant] || badgeVariants.neutral} ${className}`}>
      {children}
    </span>
  );
}
