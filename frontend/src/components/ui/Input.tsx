import React, { forwardRef } from 'react';
import { Eye, EyeOff, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  success?: boolean;
  icon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      success = false,
      icon,
      clearable = false,
      onClear,
      type = 'text',
      className = '',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    const hasValue = props.value !== undefined && props.value !== '';

    const baseStyles = 'w-full px-4 py-2.5 text-base border rounded-lg transition-all duration-200 focus-ring';
    const stateStyles = error
      ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
      : success
      ? 'border-success-500 focus:border-success-500 focus:ring-success-500'
      : isFocused
      ? 'border-primary-500 focus:border-primary-500 focus:ring-primary-500'
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500';
    
    const iconPadding = icon ? 'pl-11' : '';
    const clearPadding = (clearable && hasValue) || isPassword ? 'pr-11' : '';
    
    const classes = `${baseStyles} ${stateStyles} ${iconPadding} ${clearPadding} ${className}`.trim().replace(/\s+/g, ' ');

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            type={inputType}
            className={classes}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {clearable && hasValue && !isPassword && (
              <button
                type="button"
                onClick={onClear}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                tabIndex={0}
                aria-label="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                tabIndex={0}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
              </button>
            )}
            
            {success && !error && (
              <CheckCircle2 className="w-5 h-5 text-success-500" aria-hidden="true" />
            )}
            
            {error && (
              <AlertCircle className="w-5 h-5 text-error-500" aria-hidden="true" />
            )}
          </div>
        </div>
        
        {(error || helperText) && (
          <p 
            className={`mt-1.5 text-sm ${error ? 'text-error-500' : 'text-gray-500'}`}
            role={error ? 'alert' : undefined}
            id={error ? `${props.id || 'input'}-error` : undefined}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

