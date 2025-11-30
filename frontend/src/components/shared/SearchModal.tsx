import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Package } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { apiService } from '../../services/api';
import { format } from 'date-fns';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { products: [] };
      const response = await apiService.getProducts({ search: searchQuery, limit: 10 });
      return response.data.data;
    },
    enabled: searchQuery.trim().length > 2,
  });

  const products = data?.products || [];

  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`);
    onClose();
    setSearchQuery('');
  };

  useEffect(() => {
    if (isOpen) {
      // Focus search input when modal opens
      setTimeout(() => {
        const input = document.getElementById('search-input');
        input?.focus();
      }, 100);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search Products" size="lg">
      <div className="space-y-4">
        <Input
          id="search-input"
          placeholder="Search for products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="w-5 h-5" />}
          clearable
          onClear={() => setSearchQuery('')}
          autoFocus
        />

        {searchQuery.trim().length > 0 && searchQuery.trim().length <= 2 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Type at least 3 characters to search
          </p>
        )}

        {isLoading && searchQuery.trim().length > 2 && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Searching...</p>
          </div>
        )}

        {!isLoading && searchQuery.trim().length > 2 && products.length === 0 && (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No products found</p>
          </div>
        )}

        {!isLoading && products.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {products.map((product: any) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                    {product.cooperative && (
                      <p className="text-sm text-gray-600 truncate">{product.cooperative.name}</p>
                    )}
                    <p className="text-lg font-bold text-primary-600 mt-1">
                      {product.price} MAD / {product.unit}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {searchQuery.trim().length > 2 && products.length > 0 && (
          <button
            onClick={() => {
              navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
              onClose();
              setSearchQuery('');
            }}
            className="w-full text-center py-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            View all results for "{searchQuery}"
          </button>
        )}
      </div>
    </Modal>
  );
};

