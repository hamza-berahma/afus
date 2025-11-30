import React from 'react';
import { ZellijPattern } from '../components/shared/ZellijPattern';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Users, Package } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { apiService } from '../services/api';
import { Cooperative } from '../types';

export const Cooperatives: React.FC = () => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery({
    queryKey: ['cooperatives'],
    queryFn: async () => {
      const response = await apiService.getCooperatives();
      return response.data.data;
    },
  });

  const cooperatives = data?.cooperatives || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton height="60px" className="mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height="200px" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            title={t('cooperatives.failedToLoad')}
            description={t('common.loading')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <ZellijPattern variant="star" opacity={0.05} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-2">
            {t('cooperatives.title')}
          </h1>
          <p className="text-gray-600">
            {t('cooperatives.subtitle')}
          </p>
        </div>

        {/* Cooperatives Grid */}
        {cooperatives.length === 0 ? (
          <EmptyState
            title={t('cooperatives.noCooperatives')}
            description={t('cooperatives.noCooperativesDesc')}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cooperatives.map((cooperative: Cooperative) => (
              <Link key={cooperative.id} to={`/cooperatives/${cooperative.id}`}>
                <Card hoverable className="h-full">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {cooperative.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      {cooperative.region && (
                        <div className="flex items-center gap-1">
                          <MapPin size={16} />
                          <span>{cooperative.region}</span>
                        </div>
                      )}
                    </div>
                    {cooperative.registrationNumber && (
                      <Badge color="success" size="sm" className="mt-4">
                        {t('cooperatives.verified')}
                      </Badge>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

