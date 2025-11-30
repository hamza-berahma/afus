import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, Package } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ProtectedRoute } from '../components/shared/ProtectedRoute';
import { useCart } from '../context/CartContext';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart();

  // Get wallet balance
  const { data: walletData } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      const response = await apiService.getWalletBalance();
      return response.data.data;
    },
    enabled: isAuthenticated,
    retry: false,
  });

  // Simulate all transactions
  const { data: simulations, isLoading: simulating } = useQuery({
    queryKey: ['cart-simulations', items.map(i => `${i.productId}-${i.quantity}`).join(',')],
    queryFn: async () => {
      const simPromises = items.map(item =>
        apiService.simulateTransaction({
          productId: item.productId,
          quantity: item.quantity,
        }).then(res => ({
          productId: item.productId,
          ...res.data.data,
        })).catch(() => ({
          productId: item.productId,
          productCost: item.product.price * item.quantity,
          fee: 0,
          totalCost: item.product.price * item.quantity,
        }))
      );
      return Promise.all(simPromises);
    },
    enabled: items.length > 0 && isAuthenticated,
  });

  // Create transactions mutation
  const createTransactionsMutation = useMutation({
    mutationFn: async () => {
      if (!simulations) throw new Error('No simulations available');
      
      const transactionPromises = items.map((item, index) => {
        const sim = simulations[index];
        return apiService.createTransaction({
          productId: item.productId,
          quantity: item.quantity,
          simulatedFee: sim.fee,
        });
      });

      return Promise.all(transactionPromises);
    },
    onSuccess: () => {
      toast.success('All orders placed successfully!');
      clearCart();
      navigate('/transactions');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to place orders');
    },
  });

  const totalCost = simulations?.reduce((sum, sim) => sum + sim.totalCost, 0) || getTotalPrice();
  const totalFees = simulations?.reduce((sum, sim) => sum + sim.fee, 0) || 0;
  const hasInsufficientBalance = walletData && walletData.balance < totalCost;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to checkout');
      navigate('/login');
      return;
    }

    if (hasInsufficientBalance) {
      toast.error('Insufficient wallet balance');
      return;
    }

    createTransactionsMutation.mutate();
  };

  if (items.length === 0) {
    return (
      <ProtectedRoute>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            title="Your cart is empty"
            description="Add some products to your cart to get started."
            action={{
              label: 'Browse Products',
              onClick: () => navigate('/products'),
            }}
            icon={ShoppingCart}
          />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const sim = simulations?.find(s => s.productId === item.productId);
              const itemTotal = sim?.totalCost || (item.product.price * item.quantity);
              const images = item.product.imageUrls && item.product.imageUrls.length > 0
                ? item.product.imageUrls
                : (item.product.imageUrl ? [item.product.imageUrl] : []);

              return (
                <Card key={item.productId} className="p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {images[0] ? (
                        <img
                          src={images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{item.product.name}</h3>
                          {item.product.cooperative && (
                            <p className="text-sm text-gray-600">{item.product.cooperative.name}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-gray-400 hover:text-error-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="p-2 hover:bg-gray-100 transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={16} />
                            </button>
                            <span className="px-4 py-2 min-w-[3rem] text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="p-2 hover:bg-gray-100 transition-colors"
                              disabled={item.quantity >= item.product.stockQuantity}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <span className="text-sm text-gray-600">
                            {item.product.unit} • Stock: {item.product.stockQuantity}
                          </span>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold text-primary-600">
                            {itemTotal.toFixed(2)} MAD
                          </p>
                          {sim && sim.fee > 0 && (
                            <p className="text-xs text-gray-500">
                              Fee: {sim.fee.toFixed(2)} MAD
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.length} items)</span>
                  <span>{getTotalPrice().toFixed(2)} MAD</span>
                </div>
                {totalFees > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Transaction Fees</span>
                    <span>{totalFees.toFixed(2)} MAD</span>
                  </div>
                )}
                <div className="border-t pt-4 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{totalCost.toFixed(2)} MAD</span>
                </div>
              </div>

              {walletData && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Wallet Balance</span>
                    <span className="font-semibold">{walletData.balance.toFixed(2)} MAD</span>
                  </div>
                  {hasInsufficientBalance && (
                    <p className="text-xs text-error-600 mt-2">
                      Insufficient balance. Need {totalCost.toFixed(2)} MAD
                    </p>
                  )}
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleCheckout}
                loading={createTransactionsMutation.isPending || simulating}
                disabled={hasInsufficientBalance || !isAuthenticated}
                icon={<ShoppingCart size={20} />}
              >
                {!isAuthenticated
                  ? 'Login to Checkout'
                  : hasInsufficientBalance
                  ? 'Insufficient Balance'
                  : `Checkout ${totalCost.toFixed(2)} MAD`}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => navigate('/products')}
                className="mt-3"
              >
                Continue Shopping
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

