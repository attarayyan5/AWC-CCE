import { forwardRef } from 'react';

const Textarea = forwardRef(({ label, error, className = '', ...props }, ref) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-primary-text mb-1.5">{label}</label>}
    <textarea
      ref={ref}
      className={`w-full px-3 py-2 border rounded-lg text-primary-text text-sm placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue disabled:bg-gray-50 ${error ? 'border-error' : 'border-border'} ${className}`}
      rows={4}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-error">{error}</p>}
  </div>
));

Textarea.displayName = 'Textarea';
export default Textarea;
