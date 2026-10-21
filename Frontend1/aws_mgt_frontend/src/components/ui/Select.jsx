import { forwardRef } from 'react';

const Select = forwardRef(({ label, error, options = [], placeholder, className = '', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-primary-text mb-1.5">
          {label}
          {props.required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full px-3 py-2 border rounded-lg text-primary-text text-sm bg-white
          focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue
          disabled:bg-gray-50 disabled:text-secondary-text
          ${error ? 'border-error' : 'border-border'}
          ${className}
        `}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
