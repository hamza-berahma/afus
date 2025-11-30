import { useState, useCallback } from 'react';

type ValidationSchema = {
  [key: string]: (value: any) => string | null;
};

interface UseFormValidationReturn {
  errors: Record<string, string>;
  validateField: (fieldName: string, value: any) => string | null;
  validateAll: (values: Record<string, any>) => boolean;
  clearErrors: () => void;
  clearFieldError: (fieldName: string) => void;
  handleFieldChange: (fieldName: string) => void;
}

/**
 * Custom hook for form validation
 */
export const useFormValidation = (
  validationSchema: ValidationSchema = {},
  initialValues: Record<string, any> = {}
): UseFormValidationReturn => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback(
    (fieldName: string, value: any): string | null => {
      const validator = validationSchema[fieldName];
      
      if (!validator) {
        return null;
      }
      
      const error = validator(value);
      
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[fieldName] = error;
        } else {
          delete newErrors[fieldName];
        }
        return newErrors;
      });
      
      return error;
    },
    [validationSchema]
  );

  const validateAll = useCallback(
    (values: Record<string, any>): boolean => {
      const newErrors: Record<string, string> = {};
      let isValid = true;

      Object.keys(validationSchema).forEach((fieldName) => {
        const value = values[fieldName];
        const error = validateField(fieldName, value);
        
        if (error) {
          newErrors[fieldName] = error;
          isValid = false;
        }
      });

      setErrors(newErrors);
      return isValid;
    },
    [validationSchema, validateField]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const handleFieldChange = useCallback(
    (fieldName: string) => {
      if (errors[fieldName]) {
        clearFieldError(fieldName);
      }
    },
    [errors, clearFieldError]
  );

  return {
    errors,
    validateField,
    validateAll,
    clearErrors,
    clearFieldError,
    handleFieldChange,
  };
};

