import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, X, SlidersHorizontal, Star, MapPin, ShoppingCart } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ZellijPattern } from '../components/shared/ZellijPattern';
import { apiService } from '../services/api';
import { Product } from '../types';
import { Package } from 'lucide-react';

export const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    region: searchParams.get('region') || '',
    cooperativeId: searchParams.get('cooperativeId') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
    inStock: searchParams.get('inStock') === 'true',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const response = await apiService.getProducts({
        search: filters.search || undefined,
        region: filters.region || undefined,
        cooperativeId: filters.cooperativeId || undefined,
      });
      return response.data.data;
    },
  });

  const products = data?.products || [];

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (value) {
        newParams.set(key, value.toString());
      } else {
        newParams.delete(key);
      }
      return newParams;
    });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      region: '',
      cooperativeId: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest',
      inStock: false,
    });
    setSearchParams({});
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== '' && v !== false && v !== 'newest'
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <ZellijPattern variant="classic" opacity={0.05} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
            Agricultural Products
          </h1>
          <p className="text-gray-600">
            Discover fresh products directly from Moroccan cooperatives
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              icon={<Search className="w-5 h-5" />}
              clearable
              onClear={() => handleFilterChange('search', '')}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowFilters(true)}
            icon={<SlidersHorizontal className="w-5 h-5" />}
          >
            Filters
            {activeFiltersCount > 0 && (
              <Badge color="primary" size="sm" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="outlined" color="primary">
                Search: {filters.search}
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-2 hover:text-error-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filters.region && (
              <Badge variant="outlined" color="primary">
                Region: {filters.region}
                <button
                  onClick={() => handleFilterChange('region', '')}
                  className="ml-2 hover:text-error-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={Package}
            title="Failed to load products"
            description="We couldn't load the products. Please check your connection and try again."
            action={{
              label: 'Retry',
              onClick: () => window.location.reload(),
            }}
          />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description="Try adjusting your filters or check back later for new products."
            action={{
              label: 'Clear Filters',
              onClick: clearFilters,
            }}
          />
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product: Product) => (
                <Link key={product.id} to={`/products/${product.id}`}>
                  <Card hoverable className="h-full">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                      {(() => {
                        // Get first image: prefer imageUrls array, fallback to imageUrl
                        const images = (product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > 0)
                          ? product.imageUrls 
                          : (product.imageUrl ? [product.imageUrl] : []);
                        const firstImage = images[0];
                        
                        return (
                          <>
                            {firstImage ? (
                              <img
                                src={firstImage}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback if image fails to load
                                  e.currentTarget.style.display = 'none';
                                  const placeholder = e.currentTarget.parentElement?.querySelector('.product-placeholder');
                                  if (placeholder) {
                                    (placeholder as HTMLElement).style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            {!firstImage && (
                              <div className="w-full h-full flex items-center justify-center product-placeholder">
                                <Package className="w-16 h-16 text-gray-400" />
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      {product.cooperative && (
                        <p className="text-sm text-gray-600 mb-2">
                          {product.cooperative.name}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary-600">
                          {product.price} MAD
                        </span>
                        <Badge
                          color={product.stockQuantity > 0 ? 'success' : 'error'}
                          size="sm"
                        >
                          {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">per {product.unit}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Filters Modal */}
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter Products"
        size="md"
      >
        <div className="space-y-6 p-6">
          <Select
            label="Region"
            options={[
              { value: 'essaouira', label: 'Essaouira' },
              { value: 'agadir', label: 'Agadir' },
              { value: 'marrakech', label: 'Marrakech' },
              { value: 'fes', label: 'Fes' },
            ]}
            value={filters.region}
            onChange={(value) => handleFilterChange('region', value)}
            placeholder="All Regions"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Price (MAD)"
              type="number"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              placeholder="0"
            />
            <Input
              label="Max Price (MAD)"
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              placeholder="1000"
            />
          </div>

          <Select
            label="Sort By"
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'price-asc', label: 'Price: Low to High' },
              { value: 'price-desc', label: 'Price: High to Low' },
              { value: 'popular', label: 'Most Popular' },
            ]}
            value={filters.sortBy}
            onChange={(value) => handleFilterChange('sortBy', value)}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="inStock"
              checked={filters.inStock}
              onChange={(e) => handleFilterChange('inStock', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="inStock" className="text-sm text-gray-700">
              Show only in-stock items
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="primary"
              fullWidth
              onClick={() => setShowFilters(false)}
            >
              Apply Filters
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                clearFilters();
                setShowFilters(false);
              }}
            >
              Clear All
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
