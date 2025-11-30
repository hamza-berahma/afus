import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Package, MapPin, ArrowLeft, Heart, Share2, Star, Award, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ZellijPattern } from '../components/shared/ZellijPattern';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
// Using regular img for now - can add lazy loading later if needed

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fetch product details
  const { data: productData, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await apiService.getProduct(id!);
      return response.data.data;
    },
    enabled: !!id,
  });

  // Check favorite status
  const { data: favoriteData } = useQuery({
    queryKey: ['favorite', id],
    queryFn: async () => {
      if (!isAuthenticated || !id) return { isFavorite: false };
      const response = await apiService.checkFavorite(id);
      return response.data.data;
    },
    enabled: !!id && isAuthenticated,
  });

  // Update favorite state when data changes
  useEffect(() => {
    if (favoriteData) {
      setIsFavorite(favoriteData.isFavorite);
    }
  }, [favoriteData]);


  // Favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (isFavorite) {
        return apiService.removeFavorite(productId);
      } else {
        return apiService.addFavorite(productId);
      }
    },
    onSuccess: () => {
      setIsFavorite(!isFavorite);
      queryClient.invalidateQueries({ queryKey: ['favorite', id] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update favorite');
    },
  });


  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (!productData?.product) return;

    const product = productData.product;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      imageUrl: product.imageUrl,
      imageUrls: product.imageUrls,
      stockQuantity: product.stockQuantity,
      cooperative: productData.cooperative || undefined,
    }, quantity);

    toast.success(`Added ${quantity} ${product.unit} to cart`);
    setQuantity(1);
  };

  const handleFavorite = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add favorites');
      navigate('/login');
      return;
    }

    if (!id) return;

    favoriteMutation.mutate(id);
  };

  const handleShare = async () => {
    if (!id || !productData?.product) return;
    
    const productUrl = `${window.location.origin}/products/${id}`;
    const product = productData.product;
    const shareData = {
      title: product?.name || 'Product',
      text: product?.description || `Check out this product: ${product?.name || 'Product'}`,
      url: productUrl,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(productUrl);
        toast.success('Product link copied to clipboard!');
      }
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        // Fallback: Copy to clipboard
        try {
          await navigator.clipboard.writeText(productUrl);
          toast.success('Product link copied to clipboard!');
        } catch (clipboardError) {
          toast.error('Failed to share product');
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <Skeleton height="500px" className="rounded-lg" />
          <div className="space-y-4">
            <Skeleton height="40px" />
            <Skeleton height="24px" width="60%" />
            <Skeleton height="32px" width="40%" />
            <Skeleton height="200px" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !productData?.product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EmptyState
          title="Product not found"
          description="The product you're looking for doesn't exist or has been removed."
          action={{
            label: 'Back to Products',
            onClick: () => navigate('/products'),
          }}
          icon={Package}
        />
      </div>
    );
  }

  const { product, cooperative } = productData;
  const isInStock = product?.stockQuantity > 0;
  const productId = product?.id || '';
  
  // Get images: prefer imageUrls array, fallback to imageUrl, then placeholder
  const images = (product?.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > 0)
    ? product.imageUrls 
    : (product?.imageUrl ? [product.imageUrl] : []);
  
  // Ensure selectedImageIndex is within bounds
  const safeImageIndex = images.length > 0 
    ? Math.min(selectedImageIndex, images.length - 1) 
    : 0;
  
  // Reset selectedImageIndex if it's out of bounds
  useEffect(() => {
    if (images.length > 0 && selectedImageIndex >= images.length) {
      setSelectedImageIndex(0);
    } else if (images.length === 0) {
      setSelectedImageIndex(0);
    }
  }, [images.length, selectedImageIndex]);
  
  const mainImage = images.length > 0 && images[safeImageIndex] 
    ? images[safeImageIndex] 
    : null;

  return (
    <div className="min-h-screen bg-warm-50 relative">
      <ZellijPattern variant="honeycomb" opacity={0.06} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-secondary-500 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Products
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-xl shadow-lg p-8">
        {/* Product Images - Amazon Style */}
        <div>
          {/* Main Image */}
          <div className="relative rounded-lg overflow-hidden aspect-square mb-4 bg-gray-100">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product?.name || 'Product'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = 'none';
                  const placeholder = e.currentTarget.parentElement?.querySelector('.image-placeholder');
                  if (placeholder) {
                    (placeholder as HTMLElement).style.display = 'flex';
                  }
                }}
              />
            ) : null}
            {!mainImage && (
              <div className="w-full h-full flex items-center justify-center image-placeholder">
                <Package className="w-24 h-24 text-gray-400" />
              </div>
            )}
            
            {/* Image Navigation (if multiple images) */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <button
                  onClick={() => setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
                  {safeImageIndex + 1} / {images.length}
                </div>
              </>
            )}
            
            <div className="absolute top-4 left-4 bg-accent-500 text-black px-4 py-2 rounded-full font-medium">
              Handmade by Artisan
            </div>
            {!isInStock && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <Badge color="error" size="lg" className="text-lg px-6 py-2">
                  Out of Stock
                </Badge>
              </div>
            )}
          </div>
          
                {/* Thumbnail Gallery (if multiple images) */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          safeImageIndex === index
                            ? 'border-primary-600 ring-2 ring-primary-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product?.name || 'Product'} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Hide broken thumbnail
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
        </div>

        {/* Product Details */}
        <div>
          {cooperative?.region && (
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <MapPin className="w-4 h-4" />
              <span>Handcrafted in {cooperative.region}</span>
            </div>
          )}
          
          <h1 className="text-4xl mb-4 text-primary-700 font-bold">
            {product?.name || 'Product'}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < 4
                      ? 'fill-accent-500 text-accent-500'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-600">
              4.8 (24 reviews)
            </span>
          </div>

          <div className="text-4xl text-primary-600 mb-6 font-bold">
            {product?.price?.toFixed(2) || '0.00'} MAD
          </div>

          {product?.description && (
            <p className="text-gray-700 mb-8 leading-relaxed">{product.description}</p>
          )}

          {/* Quantity Selector */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('products.quantity')}
            </label>
            <div className="flex items-center gap-4">
              <Button
                variant="secondary"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQuantity(Math.max(1, val));
                }}
                className="w-20 text-center"
                min={1}
              />
              <Button
                variant="secondary"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-8">
            <Button
              size="lg"
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white"
              onClick={handleAddToCart}
              disabled={!isAuthenticated || !isInStock}
              icon={<ShoppingCart size={20} />}
            >
              {!isAuthenticated
                ? t('products.loginToBuy')
                : !isInStock
                ? t('products.outOfStock')
                : `Add to Cart${getItemQuantity(productId) > 0 ? ` (${getItemQuantity(productId)} in cart)` : ''}`}
            </Button>
            <Button 
              size="lg" 
              variant="secondary" 
              className={`border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white ${
                isFavorite ? 'bg-primary-50 border-primary-700' : ''
              }`}
              onClick={handleFavorite}
              disabled={favoriteMutation.isPending}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart 
                className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} 
              />
            </Button>
            <Button 
              size="lg" 
              variant="secondary" 
              className="border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white"
              onClick={handleShare}
              title="Share product"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t">
            <div className="flex items-start gap-3">
              <Award className="w-6 h-6 text-accent-500 flex-shrink-0" />
              <div>
                <h4 className="text-sm mb-1 font-semibold">Authentic</h4>
                <p className="text-xs text-gray-600">100% handmade</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Package className="w-6 h-6 text-accent-500 flex-shrink-0" />
              <div>
                <h4 className="text-sm mb-1 font-semibold">Free Shipping</h4>
                <p className="text-xs text-gray-600">On orders 150+ MAD</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-accent-500 flex-shrink-0" />
              <div>
                <h4 className="text-sm mb-1 font-semibold">Secure</h4>
                <p className="text-xs text-gray-600">Safe payment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
