import React from 'react';
import { ZellijPattern } from '../components/shared/ZellijPattern';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { MapPin, Package, TrendingUp, ArrowLeft, Mail, Phone } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { apiService } from '../services/api';
import { format } from 'date-fns';

export const CooperativeDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['cooperative', id],
    queryFn: async () => {
      const response = await apiService.getCooperative(id!);
      return response.data.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton height="200px" className="mb-6" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton height="300px" />
            <Skeleton height="300px" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.cooperative) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            title={t('cooperatives.notFound')}
            description={t('cooperatives.notFoundDesc')}
            action={{
              label: t('cooperatives.backToCooperatives'),
              onClick: () => window.history.back(),
            }}
          />
        </div>
      </div>
    );
  }

  const { cooperative, producer, stats, recentProducts } = data;

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <ZellijPattern variant="interlaced" opacity={0.05} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Link
          to="/cooperatives"
          className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" /> {t('cooperatives.backToCooperatives')}
        </Link>

        {/* Header */}
        <Card className="p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-heading font-bold text-gray-900 mb-4">
                {cooperative.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                {cooperative.region && (
                  <div className="flex items-center gap-2">
                    <MapPin size={18} />
                    <span>{cooperative.region}</span>
                  </div>
                )}
                {cooperative.registrationNumber && (
                  <Badge color="success" size="sm">
                    Verified: {cooperative.registrationNumber}
                  </Badge>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary-50 rounded-lg">
                <p className="text-2xl font-bold text-primary-600">{stats.totalProducts}</p>
                <p className="text-sm text-gray-600">{t('cooperatives.products')}</p>
              </div>
              <div className="text-center p-4 bg-accent-50 rounded-lg">
                <p className="text-2xl font-bold text-accent-600">{stats.totalTransactions}</p>
                <p className="text-sm text-gray-600">{t('cooperatives.transactions')}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Producer Info */}
        {producer && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('cooperatives.producerInfo')}</h2>
            <div className="flex flex-wrap items-center gap-6">
              {producer.email && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail size={18} className="text-gray-400" />
                  <span>{producer.email}</span>
                </div>
              )}
              {producer.phone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone size={18} className="text-gray-400" />
                  <span>{producer.phone}</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Recent Products */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-heading font-bold text-gray-900">{t('cooperatives.products')}</h2>
            <Link to={`/products?cooperativeId=${cooperative.id}`}>
              <Button variant="secondary">{t('cooperatives.viewAllProducts')}</Button>
            </Link>
          </div>
          {recentProducts && recentProducts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recentProducts.map((product: any) => (
                <Link key={product.id} to={`/products/${product.id}`}>
                  <Card hoverable className="h-full">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-lg font-bold text-primary-600 mb-1">
                        {product.price} MAD
                      </p>
                      <p className="text-sm text-gray-500">per {product.unit}</p>
                      <Badge
                        color={product.stockQuantity > 0 ? 'success' : 'error'}
                        size="sm"
                        className="mt-2"
                      >
                        {product.stockQuantity > 0 ? t('products.inStock') : t('products.outOfStock')}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t('cooperatives.noProducts')}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

