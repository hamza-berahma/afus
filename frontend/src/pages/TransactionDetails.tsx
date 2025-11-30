import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { QRScanner } from '../components/QRScanner';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  INITIATED: { color: 'gray', label: 'Initiated', icon: <Clock size={16} /> },
  FEE_SIMULATED: { color: 'info', label: 'Fee Simulated', icon: <Clock size={16} /> },
  ESCROWED: { color: 'warning', label: 'Escrowed', icon: <Package size={16} /> },
  SHIPPED: { color: 'secondary', label: 'Shipped', icon: <Truck size={16} /> },
  DELIVERED: { color: 'primary', label: 'Delivered', icon: <CheckCircle size={16} /> },
  SETTLED: { color: 'success', label: 'Settled', icon: <CheckCircle size={16} /> },
  FAILED: { color: 'error', label: 'Failed', icon: <XCircle size={16} /> },
};

const statusOrder = ['INITIATED', 'ESCROWED', 'SHIPPED', 'DELIVERED', 'SETTLED'];

export const TransactionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Fetch transaction
  const { data: transactionData, isLoading, isError, refetch } = useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const response = await apiService.getTransaction(id!);
      return response.data.data;
    },
    enabled: !!id,
  });

  // Ship transaction mutation
  const shipMutation = useMutation({
    mutationFn: () => apiService.shipTransaction(id!),
    onSuccess: () => {
      toast.success('Transaction marked as shipped!');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to ship transaction');
    },
  });

  // Confirm delivery mutation
  const confirmDeliveryMutation = useMutation({
    mutationFn: (qrSignature: string) =>
      apiService.confirmDelivery(id!, { qrSignature }),
    onSuccess: () => {
      toast.success('Delivery confirmed! Payment released.');
      refetch();
      setShowQRScanner(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to confirm delivery');
    },
  });

  const handleQRScanSuccess = (qrData: string) => {
    try {
      const parsed = JSON.parse(qrData);
      if (parsed.signature && parsed.transaction_id === id) {
        confirmDeliveryMutation.mutate(parsed.signature);
      } else {
        toast.error('Invalid QR code for this transaction');
      }
    } catch (error) {
      toast.error('Invalid QR code format');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton height="40px" className="mb-6" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton height="200px" />
            <Skeleton height="300px" />
          </div>
          <Skeleton height="400px" />
        </div>
      </div>
    );
  }

  if (isError || !transactionData?.transaction) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EmptyState
          title="Transaction not found"
          description="The transaction you're looking for doesn't exist or you don't have permission to view it."
          action={{
            label: 'Back to Home',
            onClick: () => navigate('/'),
          }}
        />
      </div>
    );
  }

  const transaction = transactionData.transaction;
  const product = transactionData.product;
  const buyer = transactionData.buyer;
  const seller = transactionData.seller;
  const logs = transactionData.logs || [];

  const isBuyer = user?.id === buyer?.id;
  const isSeller = user?.id === seller?.id;
  const statusInfo = statusConfig[transaction.status] || statusConfig.INITIATED;
  const currentStatusIndex = statusOrder.indexOf(transaction.status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          icon={<ArrowLeft size={20} />}
          className="mb-4"
        >
          Back
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">Transaction Details</h1>
            <p className="text-gray-600 mt-1">ID: {transaction.id.substring(0, 8)}...</p>
          </div>
          <Badge color={statusInfo.color as any} size="lg" className="flex items-center gap-2">
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Timeline */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Transaction Progress</h2>
            <div className="relative">
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
                <div
                  className="h-full bg-primary-500 transition-all duration-500"
                  style={{
                    width: `${(currentStatusIndex / (statusOrder.length - 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="relative flex justify-between">
                {statusOrder.map((status, index) => {
                  const isActive = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
                  const config = statusConfig[status] || statusConfig.INITIATED;

                  return (
                    <div key={status} className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          isActive
                            ? 'bg-primary-500 border-primary-500 text-white'
                            : 'bg-white border-gray-300 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-primary-200' : ''}`}
                      >
                        {isActive ? <CheckCircle size={20} /> : <span className="text-xs">{index + 1}</span>}
                      </div>
                      <p
                        className={`text-xs mt-2 text-center max-w-[80px] ${
                          isActive ? 'text-gray-800 font-medium' : 'text-gray-400'
                        }`}
                      >
                        {config.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Product Details */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Details</h2>
            <div className="flex gap-4">
              {product?.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-grow">
                <h3 className="font-semibold text-gray-900">{product?.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Quantity: {transaction.quantity || 'N/A'} {product?.unit || ''}
                </p>
                <p className="text-lg font-semibold text-primary-600 mt-2">
                  {product?.price} MAD per {product?.unit}
                </p>
              </div>
            </div>
          </Card>

          {/* Payment Breakdown */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Product Cost:</span>
                <span className="font-medium">{transaction.amount} MAD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction Fee:</span>
                <span className="font-medium">{transaction.fee} MAD</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total Amount:</span>
                <span className="text-2xl font-bold text-primary-600">
                  {transaction.totalAmount} MAD
                </span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-4">
              {/* Seller: Mark as Shipped */}
              {isSeller && transaction.status === 'ESCROWED' && (
                <Button
                  variant="primary"
                  onClick={() => shipMutation.mutate()}
                  loading={shipMutation.isPending}
                  icon={<Truck size={20} />}
                  fullWidth
                >
                  Mark as Shipped
                </Button>
              )}

              {/* Buyer: Confirm Delivery */}
              {isBuyer && transaction.status === 'SHIPPED' && (
                <Button
                  variant="primary"
                  onClick={() => setShowQRScanner(true)}
                  icon={<CheckCircle size={20} />}
                  fullWidth
                >
                  Scan QR to Confirm Delivery
                </Button>
              )}

              {/* Status Messages */}
              {transaction.status === 'SETTLED' && (
                <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
                  <p className="text-success-700 font-medium">
                    ✓ Transaction completed successfully!
                  </p>
                </div>
              )}

              {transaction.status === 'FAILED' && (
                <div className="p-4 bg-error-50 border border-error-200 rounded-lg">
                  <p className="text-error-700 font-medium">
                    ✗ Transaction failed. Please contact support.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Transaction Logs */}
          <Card>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                Transaction Logs ({logs.length})
              </h2>
              <span className={`transform transition-transform ${showLogs ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            {showLogs && (
              <div className="mt-4 space-y-3">
                {logs.length > 0 ? (
                  logs.map((log: any) => (
                    <div
                      key={log.id}
                      className="border-l-4 border-primary-500 pl-4 py-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-800">{log.status}</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(log.createdAt), 'PPp')}
                        </span>
                      </div>
                      {log.message && <p className="text-sm text-gray-600">{log.message}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No logs available</p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Parties */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Parties</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Buyer</p>
                <p className="font-medium text-gray-900">{buyer?.email}</p>
                <p className="text-sm text-gray-500">{buyer?.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Seller</p>
                <p className="font-medium text-gray-900">{seller?.email}</p>
                <p className="text-sm text-gray-500">{seller?.phone}</p>
              </div>
            </div>
          </Card>

          {/* Transaction Info */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Created</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(transaction.createdAt), 'PPp')}
                </p>
              </div>
              {transaction.updatedAt && (
                <div>
                  <p className="text-gray-600">Last Updated</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(transaction.updatedAt), 'PPp')}
                  </p>
                </div>
              )}
              {transaction.escrowTransactionId && (
                <div>
                  <p className="text-gray-600">Escrow ID</p>
                  <p className="font-medium text-gray-900 text-xs break-all">
                    {transaction.escrowTransactionId.substring(0, 20)}...
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <Modal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        title="Scan QR Code"
        size="lg"
      >
        <QRScanner onSuccess={handleQRScanSuccess} onClose={() => setShowQRScanner(false)} />
      </Modal>
    </div>
  );
};

