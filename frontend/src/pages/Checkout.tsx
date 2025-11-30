import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { ProtectedRoute } from '../components/shared/ProtectedRoute';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { Product } from '../types';

interface CheckoutState {
  product: Product;
  quantity: number;
  simulation: {
    productCost: number;
    fee: number;
    totalCost: number;
  };
}

export const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const checkoutData = location.state as CheckoutState;

  // Redirect if no checkout data
  useEffect(() => {
    if (!checkoutData) {
      toast.error('No product selected for checkout');
      navigate('/products');
    }
  }, [checkoutData, navigate]);

  // Get wallet balance
  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      const response = await apiService.getWalletBalance();
      return response.data.data;
    },
    retry: false,
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: (data: { productId: string; quantity: number; simulatedFee: number }) =>
      apiService.createTransaction(data),
    onSuccess: (response) => {
      toast.success('Transaction created successfully!');
      navigate(`/transactions/${response.data.data.transaction.id}`, {
        state: { transaction: response.data.data.transaction },
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create transaction');
    },
  });

  const handleCreateTransaction = () => {
    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    if (!checkoutData) return;

    createTransactionMutation.mutate({
      productId: checkoutData.product.id,
      quantity: checkoutData.quantity,
      simulatedFee: checkoutData.simulation.fee,
    });
  };

  if (!checkoutData) {
    return null;
  }

  const { product, quantity, simulation } = checkoutData;
  const hasInsufficientBalance =
    walletData && walletData.balance < simulation.totalCost;

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            icon={<ArrowLeft size={20} />}
            className="mb-4"
          >
            Back
          </Button>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Review your order and complete the purchase</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Details */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0">
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Quantity: {quantity} {product.unit}
                  </p>
                  <p className="text-lg font-semibold text-primary-600 mt-2">
                    {product.price * quantity} MAD
                  </p>
                </div>
              </div>
            </Card>

            {/* Payment Method */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
              <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <CreditCard size={24} className="text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">CIH Bank Wallet</p>
                  <p className="text-sm text-gray-600">
                    Balance: {walletLoading ? 'Loading...' : `${walletData?.balance || 0} MAD`}
                  </p>
                </div>
              </div>
            </Card>

            {/* Terms and Conditions */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Terms & Conditions</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <Shield size={18} className="text-primary-600 mt-0.5 flex-shrink-0" />
                  <p>
                    Your payment will be held in escrow until delivery is confirmed via QR code
                    verification.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={18} className="text-success-500 mt-0.5 flex-shrink-0" />
                  <p>
                    The producer will ship your order and provide a unique QR code for delivery
                    confirmation.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="text-warning-500 mt-0.5 flex-shrink-0" />
                  <p>
                    Once you scan and confirm delivery, payment will be released to the producer.
                  </p>
                </div>
              </div>
              <label className="flex items-start gap-3 mt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">
                  I agree to the terms and conditions and understand the escrow payment process.
                </span>
              </label>
            </Card>
          </div>

          {/* Order Total */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Total</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{simulation.productCost} MAD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Transaction Fee:</span>
                  <span className="font-medium">{simulation.fee} MAD</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {simulation.totalCost} MAD
                    </span>
                  </div>
                </div>
              </div>

              {hasInsufficientBalance && (
                <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg">
                  <p className="text-sm text-error-600">
                    Insufficient balance. Please add funds to your wallet.
                  </p>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleCreateTransaction}
                loading={createTransactionMutation.isPending}
                disabled={!agreedToTerms || hasInsufficientBalance || walletLoading}
                icon={<CreditCard size={20} />}
              >
                Complete Purchase
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By completing this purchase, you agree to our terms and conditions.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

