import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Shield, QrCode, Users2, ArrowRight, TrendingUp, Users, Package, Star, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { GeometricBackground } from '../components/shared/GeometricBackground';
import { ZellijPattern } from '../components/shared/ZellijPattern';
import { AnimatedShapes } from '../components/shared/AnimatedShapes';
import { SkeletonCard } from '../components/ui/Skeleton';
import { apiService } from '../services/api';
import { Product } from '../types';
import { motion } from 'framer-motion';

export const Home: React.FC = () => {
  // Fetch featured products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const response = await apiService.getProducts({ limit: 8 });
      return response.data.data;
    },
  });

  const featuredProducts = productsData?.products || [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden min-h-[600px] lg:min-h-[700px] flex items-center">
        {/* Hero Background Image with Blurred Edges */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/hero.jpg)',
              maskImage: 'radial-gradient(ellipse 80% 100% at center, black 40%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at center, black 40%, transparent 100%)',
            }}
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white/80" />
          {/* Blurred edge effect using multiple overlays */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 100% at center, transparent 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.8) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }} />
        </div>
        
        <ZellijPattern variant="honeycomb" opacity={0.05} />
        <GeometricBackground variant="zellij" opacity={0.03} />
        <AnimatedShapes count={4} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative z-10"
            >
              <h1 className="text-4xl lg:text-6xl font-heading font-bold text-gray-900 mb-6 drop-shadow-sm">
                Connecting Moroccan Cooperatives with{' '}
                <span className="text-primary-600">Conscious Buyers</span>
              </h1>
              <p className="text-xl text-gray-700 mb-8 drop-shadow-sm">
                One hand creates, the other supports
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/products">
                  <Button size="lg" className="shadow-lg">
                    Browse Products
                    <ArrowRight className="ml-2" />
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="lg" variant="secondary" className="shadow-lg">
                    Join as Producer
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative z-10"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/50">
                <div className="bg-white rounded-lg p-6">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden relative">
                    <img
                      src="/hero.jpg"
                      alt="Fresh Moroccan Products"
                      className="w-full h-full object-cover"
                      style={{
                        maskImage: 'radial-gradient(ellipse 90% 90% at center, black 70%, transparent 100%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at center, black 70%, transparent 100%)',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const placeholder = e.currentTarget.parentElement?.querySelector('.hero-placeholder');
                        if (placeholder) {
                          (placeholder as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                    <div className="hero-placeholder hidden w-full h-full absolute inset-0 flex items-center justify-center bg-gray-100">
                      <Package className="w-24 h-24 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Fresh Moroccan Products</h3>
                  <p className="text-gray-600 text-sm">Direct from local cooperatives</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-heading font-bold text-center mb-12 text-primary-700">Why Choose Afus ⴰⴼⵓⵙ?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Secure Escrow Payments',
                description: 'Your money is safe until delivery confirmation',
              },
              {
                icon: QrCode,
                title: 'QR Code Verification',
                description: 'Cryptographic proof of delivery',
              },
              {
                icon: Users2,
                title: 'Direct from Cooperatives',
                description: 'Support local producers, eliminate middlemen',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hoverable className="text-center h-full">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                      <item.icon className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 gradient-center-fade text-white relative overflow-hidden">
        <ZellijPattern variant="star" opacity={0.2} />
        <GeometricBackground variant="zellij" opacity={0.12} />
        <AnimatedShapes count={5} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Users, value: '50+', label: 'Cooperatives' },
              { icon: Package, value: '500+', label: 'Products' },
              { icon: TrendingUp, value: '10,000+', label: 'Transactions' },
              { icon: Star, value: '4.8/5', label: 'Rating' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <stat.icon className="w-12 h-12 mx-auto mb-4" />
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-primary-100">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover our handpicked selection of premium Moroccan products directly from local cooperatives.
            </p>
          </div>
          
          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 8).map((product: Product) => {
                const images = (product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > 0)
                  ? product.imageUrls 
                  : (product.imageUrl ? [product.imageUrl] : []);
                const firstImage = images[0];
                
                return (
                  <Link key={product.id} to={`/products/${product.id}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card hoverable className="h-full overflow-hidden flex flex-col">
                        <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden relative group">
                          {firstImage ? (
                            <img
                              src={firstImage}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const placeholder = e.currentTarget.parentElement?.querySelector('.product-placeholder');
                                if (placeholder) {
                                  (placeholder as HTMLElement).style.display = 'flex';
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center product-placeholder">
                              <Package className="w-16 h-16 text-gray-400" />
                            </div>
                          )}
                          {product.stockQuantity === 0 && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <span className="bg-error-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                Out of Stock
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col">
                          {product.cooperative && (
                            <p className="text-xs text-gray-500 mb-1 truncate">
                              {product.cooperative.name}
                            </p>
                          )}
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                            {product.name}
                          </h3>
                          <div className="mt-auto">
                            <div className="flex items-baseline gap-1 mb-2">
                              <span className="text-2xl font-bold text-primary-600">
                                {product.price.toFixed(2)}
                              </span>
                              <span className="text-sm text-gray-600">MAD</span>
                              <span className="text-sm text-gray-500">/ {product.unit}</span>
                            </div>
                            {product.stockQuantity > 0 && (
                              <p className="text-xs text-success-600 font-medium">
                                {product.stockQuantity} in stock
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No products available at the moment.</p>
            </div>
          )}
          
          {featuredProducts.length > 0 && (
            <div className="text-center mt-8">
              <Link to="/products">
                <Button size="lg" variant="secondary">
                  View All Products
                  <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A simple, secure way to connect with local producers and get fresh products delivered to your door.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Browse Products',
                description: 'Explore a wide variety of fresh products directly from Moroccan cooperatives.',
              },
              {
                step: '2',
                title: 'Secure Payment',
                description: 'Your payment is held in escrow until you confirm delivery. Safe and secure.',
              },
              {
                step: '3',
                title: 'Fast Delivery',
                description: 'Receive your order and verify with QR code. Payment is released automatically.',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full text-center">
                  <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    {feature.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-primary-600 text-white relative overflow-hidden">
        <ZellijPattern variant="classic" opacity={0.1} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-heading font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of buyers and producers connecting through Afus ⴰⴼⵓⵙ
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/products">
                <Button size="lg" variant="secondary">
                  Start Shopping
                  <ArrowRight className="ml-2" />
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary-600">
                  Become a Producer
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

