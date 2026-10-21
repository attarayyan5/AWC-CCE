import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, helperText, leftIcon, rightIcon, className = '', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-primary-text mb-1.5">
          {label}
          {props.required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-secondary-text">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 border rounded-lg text-primary-text text-sm
            placeholder:text-secondary-text
            focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue
            disabled:bg-gray-50 disabled:text-secondary-text disabled:cursor-not-allowed
            ${error ? 'border-error focus:ring-error' : 'border-border'}
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-secondary-text">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
