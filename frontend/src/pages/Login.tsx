import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFormValidation } from '../hooks/useFormValidation';
import { getEmailError, getPhoneError, getRequiredError } from '../utils/validation';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ZellijPattern } from '../components/shared/ZellijPattern';
import { AnimatedShapes } from '../components/shared/AnimatedShapes';
import { Mail, Phone } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationSchema = {
    emailOrPhone: (value: string) => {
      if (!value) return 'Email or phone is required';
      const isEmail = value.includes('@');
      if (isEmail) {
        return getEmailError(value);
      } else {
        return getPhoneError(value);
      }
    },
    password: (value: string) => getRequiredError(value, 'Password'),
  };

  const { errors, validateField, validateAll, handleFieldChange } = useFormValidation(validationSchema);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    if (loginError) {
      setLoginError(null);
    }
    
    handleFieldChange(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!validateAll(formData)) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      const isEmail = formData.emailOrPhone.includes('@');
      const credentials = isEmail
        ? { emailOrPhone: formData.emailOrPhone, password: formData.password }
        : { emailOrPhone: formData.emailOrPhone, password: formData.password };

      await login(credentials);

      // Redirect based on user role will be handled by AuthContext
      navigate('/');
    } catch (error: any) {
      setLoginError(error.response?.data?.error?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmail = formData.emailOrPhone.includes('@');

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4 relative">
      <ZellijPattern variant="classic" opacity={0.08} />
      <AnimatedShapes count={3} />
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-gray-800 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your Afus ⴰⴼⵓⵙ account</p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
              <p className="text-sm text-error-600">{loginError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email or Phone"
              type="text"
              name="emailOrPhone"
              value={formData.emailOrPhone}
              onChange={handleChange}
              onBlur={() => validateField('emailOrPhone', formData.emailOrPhone)}
              error={errors.emailOrPhone}
              required
              placeholder="email@example.com or +212612345678"
              disabled={isSubmitting}
              icon={isEmail ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
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
              placeholder="Enter your password"
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isSubmitting}
              size="lg"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

