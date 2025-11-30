import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFormValidation } from '../hooks/useFormValidation';
import { getEmailError, getPhoneError, getPasswordError, getRequiredError } from '../utils/validation';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ZellijPattern } from '../components/shared/ZellijPattern';
import { AnimatedShapes } from '../components/shared/AnimatedShapes';
import { Mail, Phone, Lock } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'BUYER' as 'BUYER' | 'PRODUCER',
  });
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationSchema = {
    name: (value: string) => getRequiredError(value, 'Name'),
    email: (value: string) => getEmailError(value),
    phone: (value: string) => getPhoneError(value),
    password: (value: string) => getPasswordError(value),
    confirmPassword: (value: string) => {
      if (!value) return 'Please confirm your password';
      if (value !== formData.password) {
        return 'Passwords do not match';
      }
      return null;
    },
    role: (value: string) => getRequiredError(value, 'Role'),
  };

  const { errors, validateField, validateAll, handleFieldChange } = useFormValidation(validationSchema);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    if (registerError) {
      setRegisterError(null);
    }
    
    handleFieldChange(name);
    
    if (name === 'password' && formData.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (!validateAll(formData)) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
      };

      await register(userData);
      navigate('/');
    } catch (error: any) {
      setRegisterError(error.response?.data?.error?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4 py-12 relative">
      <ZellijPattern variant="honeycomb" opacity={0.08} />
      <AnimatedShapes count={4} />
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-gray-800 mb-2">Create Account</h1>
            <p className="text-gray-600">Join Afus ⴰⴼⵓⵙ to get started</p>
          </div>

          {registerError && (
            <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
              <p className="text-sm text-error-600">{registerError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => validateField('name', formData.name)}
              error={errors.name}
              required
              placeholder="John Doe"
              disabled={isSubmitting}
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => validateField('email', formData.email)}
              error={errors.email}
              required
              placeholder="email@example.com"
              disabled={isSubmitting}
              icon={<Mail className="w-5 h-5" />}
            />

            <Input
              label="Phone Number"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={() => validateField('phone', formData.phone)}
              error={errors.phone}
              required
              placeholder="+212612345678 or 0612345678"
              disabled={isSubmitting}
              icon={<Phone className="w-5 h-5" />}
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={() => validateField('password', formData.password)}
              error={errors.password}
              required
              placeholder="At least 8 chars, 1 number, 1 special"
              disabled={isSubmitting}
              icon={<Lock className="w-5 h-5" />}
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={() => validateField('confirmPassword', formData.confirmPassword)}
              error={errors.confirmPassword}
              required
              placeholder="Re-enter your password"
              disabled={isSubmitting}
              icon={<Lock className="w-5 h-5" />}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type <span className="text-error-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus-ring transition ${
                  errors.role
                    ? 'border-error-500 focus:ring-error-500 focus:border-error-500'
                    : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                }`}
                disabled={isSubmitting}
              >
                <option value="BUYER">Buyer</option>
                <option value="PRODUCER">Producer</option>
              </select>
              {errors.role && (
                <p className="mt-1.5 text-sm text-error-500">{errors.role}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isSubmitting}
              size="lg"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

