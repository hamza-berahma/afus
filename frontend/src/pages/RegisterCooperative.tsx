import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Building2, ArrowLeft, MapPin, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ProtectedRoute } from '../components/shared/ProtectedRoute';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MOROCCAN_REGIONS = [
  'Casablanca-Settat',
  'Rabat-Salé-Kénitra',
  'Fès-Meknès',
  'Tanger-Tétouan-Al Hoceïma',
  'Marrakech-Safi',
  'Oriental',
  'Béni Mellal-Khénifra',
  'Souss-Massa',
  'Drâa-Tafilalet',
  'Laâyoune-Sakia El Hamra',
  'Dakhla-Oued Ed-Dahab',
  'Guelmim-Oued Noun',
];

export const RegisterCooperative: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    registration_number: '',
    region: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const registerMutation = useMutation({
    mutationFn: (data: any) => apiService.registerCooperative(data),
    onSuccess: () => {
      toast.success('Cooperative registered successfully!');
      navigate('/dashboard/producer');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to register cooperative';
      toast.error(errorMessage);
      
      // Set field-specific errors if available
      if (error.response?.data?.error === 'REGISTRATION_NUMBER_EXISTS') {
        setErrors({ registration_number: 'This registration number is already taken' });
      } else if (error.response?.data?.error === 'COOPERATIVE_EXISTS') {
        setErrors({ name: 'You already have a registered cooperative' });
      }
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Cooperative name is required';
    }
    
    if (!formData.registration_number.trim()) {
      newErrors.registration_number = 'Registration number is required';
    }
    
    if (!formData.region) {
      newErrors.region = 'Region is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    registerMutation.mutate(formData);
  };

  return (
    <ProtectedRoute requiredRole="PRODUCER">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2"
            icon={<ArrowLeft size={20} />}
          >
            Back
          </Button>

          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 size={32} className="text-primary-600" />
              </div>
              <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
                Register Your Cooperative
              </h1>
              <p className="text-gray-600">
                Register your cooperative to start selling products on Afus ⴰⴼⵓⵙ
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Cooperative Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
                placeholder="e.g., Cooperative Agricole d'Essaouira"
                icon={<Building2 size={18} className="text-gray-400" />}
              />

              <Input
                label="Registration Number"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                error={errors.registration_number}
                required
                placeholder="Enter your official registration number"
                icon={<FileText size={18} className="text-gray-400" />}
                helperText="This is your official cooperative registration number"
              />

              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                  Region <span className="text-error-500">*</span>
                </label>
                <Select
                  value={formData.region}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, region: value }));
                    if (errors.region) {
                      setErrors((prev) => ({ ...prev, region: '' }));
                    }
                  }}
                  options={[
                    { label: 'Select a region', value: '' },
                    ...MOROCCAN_REGIONS.map((region) => ({
                      label: region,
                      value: region,
                    })),
                  ]}
                />
                {errors.region && (
                  <p className="mt-1 text-sm text-error-600">{errors.region}</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> After registration, your cooperative will be verified and a merchant account will be created with CIH Bank. This process may take a few moments.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(-1)}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={registerMutation.isPending}
                >
                  Register Cooperative
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
};

