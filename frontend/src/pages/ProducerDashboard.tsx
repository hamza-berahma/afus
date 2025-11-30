import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  AlertCircle, 
  ArrowRight,
  BarChart3,
  Award
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { ProtectedRoute } from '../components/shared/ProtectedRoute';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Product } from '../types';

export const ProducerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCreditScoreModal, setShowCreditScoreModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Fetch cooperative
  const { data: cooperativeData } = useQuery({
    queryKey: ['cooperative', user?.id],
    queryFn: async () => {
      const response = await apiService.getCooperatives({ userId: user?.id });
      const cooperatives = response.data.data?.cooperatives || [];
      return cooperatives[0] || null;
    },
    enabled: !!user,
  });

  // Fetch products
  const {
    data: productsData,
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['products', cooperativeData?.id],
    queryFn: async () => {
      const response = await apiService.getProducts({ cooperativeId: cooperativeData?.id });
      return response.data.data?.products || [];
    },
    enabled: !!cooperativeData?.id,
  });

  // Fetch dashboard stats
  const {
    data: dashboardStats,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiService.getDashboardStats();
      return response.data.data;
    },
    enabled: !!user,
  });

  // Fetch credit score
  const { data: creditScoreData, isLoading: creditScoreLoading } = useQuery({
    queryKey: ['credit-score'],
    queryFn: async () => {
      const response = await apiService.getCreditScore();
      return response.data.data;
    },
    enabled: !!user,
  });

  // Fetch transactions (as seller)
  const { data: transactionsData } = useQuery({
    queryKey: ['producer-transactions'],
    queryFn: async () => {
      const response = await apiService.getWalletTransactions({ limit: 20 });
      return response.data.data?.transactions || [];
    },
  });

  // Create/Update product mutation
  const productMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingProduct) {
        return apiService.updateProduct(editingProduct.id, data);
      }
      return apiService.createProduct(data);
    },
    onSuccess: () => {
      toast.success(editingProduct ? 'Product updated!' : 'Product created!');
      setShowProductModal(false);
      setEditingProduct(null);
      refetchProducts();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save product');
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteProduct(id),
    onSuccess: () => {
      toast.success('Product deleted!');
      refetchProducts();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    },
  });

  const products = productsData || [];
  const transactions = transactionsData || [];

  // Use dashboard stats if available, otherwise calculate from transactions
  const stats = dashboardStats || {
    totalProducts: products.length,
    totalRevenue: transactions
      .filter((t: any) => t.status === 'SETTLED' && user?.id === t.seller?.id)
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
    totalEarnings: transactions
      .filter((t: any) => t.status === 'SETTLED' && user?.id === t.seller?.id)
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
    pendingOrders: transactions.filter(
      (t: any) => ['ESCROWED', 'SHIPPED', 'DELIVERED'].includes(t.status) && user?.id === t.seller?.id
    ).length,
    completedOrders: transactions.filter(
      (t: any) => t.status === 'SETTLED' && user?.id === t.seller?.id
    ).length,
    activeProducts: products.filter((p: any) => p.stockQuantity > 0).length,
    lowStockProducts: products.filter((p: any) => p.stockQuantity < 10 && p.stockQuantity > 0).length,
  };

  const creditScore = creditScoreData || null;

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmitProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      unit: formData.get('unit') as string,
      stock_quantity: parseInt(formData.get('stock_quantity') as string) || 0,
      image_url: formData.get('image_url') as string,
    };
    productMutation.mutate(data);
  };

  const getCreditScoreTierColor = (tier: string) => {
    if (tier === 'Gold Partner') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (tier === 'Silver Producer') return 'bg-gray-100 text-gray-800 border-gray-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  if (!cooperativeData) {
    return (
      <ProtectedRoute requiredRole="PRODUCER">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <AlertCircle size={48} className="text-warning-500 mx-auto mb-4" />
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
              No Cooperative Registered
            </h2>
            <p className="text-gray-600 mb-6">
              You need to register a cooperative before you can manage products.
            </p>
            <Button variant="primary" onClick={() => navigate('/cooperatives/register')}>
              Register Cooperative
            </Button>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="PRODUCER">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">Producer Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Manage your products and track orders for {cooperativeData.name}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate('/producer/analytics')}
            icon={<BarChart3 size={20} />}
            className="w-full sm:w-auto"
          >
            View Analytics
          </Button>
        </div>

        {/* Stats Buttons - 3 rows x 2 columns (always 2 per row) - EXACT same format and height */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {/* Row 1: Total Revenue */}
          <button
            type="button"
            className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow text-left w-full h-full min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(stats.totalEarnings || stats.totalRevenue || 0).toFixed(2)} MAD
                </p>
                {stats.completedOrders !== undefined ? (
                  <p className="text-xs text-gray-500 mt-2">
                    {stats.completedOrders} completed orders
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">From settled transactions</p>
                )}
              </div>
              <DollarSign size={32} className="text-success-500 flex-shrink-0 ml-4" />
            </div>
          </button>

          {/* Row 1: Ma3qoul Score */}
          <button
            type="button"
            onClick={() => setShowCreditScoreModal(true)}
            className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow text-left w-full h-full min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Ma3qoul Score</p>
                {creditScoreLoading ? (
                  <Skeleton height="32px" className="mb-1" />
                ) : (
                  <>
                    <p className="text-3xl font-bold text-gray-900">
                      {creditScore?.score || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {creditScore?.tier || 'Building Trust'}
                    </p>
                  </>
                )}
              </div>
              <Award size={32} className="text-success-500 flex-shrink-0 ml-4" />
            </div>
          </button>

          {/* Row 2: Add Product */}
          <button
            type="button"
            onClick={handleCreateProduct}
            className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow text-left w-full h-full min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Add Product</p>
                <p className="text-3xl font-bold text-gray-900">New</p>
                <p className="text-xs text-gray-500 mt-2">Create new listing</p>
              </div>
              <Plus size={32} className="text-success-500 flex-shrink-0 ml-4" />
            </div>
          </button>

          {/* Row 2: Total Products */}
          <button
            type="button"
            className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow text-left w-full h-full min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProducts || 0}</p>
                {stats.lowStockProducts > 0 ? (
                  <p className="text-xs text-gray-500 mt-2">
                    {stats.lowStockProducts} low stock
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">Active products</p>
                )}
              </div>
              <Package size={32} className="text-success-500 flex-shrink-0 ml-4" />
            </div>
          </button>

          {/* Row 3: Transactions */}
          <button
            type="button"
            onClick={() => navigate('/transactions')}
            className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow text-left w-full h-full min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Transactions</p>
                <p className="text-3xl font-bold text-gray-900">{(stats.completedOrders || 0) + (stats.pendingOrders || 0)}</p>
                <p className="text-xs text-gray-500 mt-2">View all transactions</p>
              </div>
              <ArrowRight size={32} className="text-success-500 flex-shrink-0 ml-4" />
            </div>
          </button>

          {/* Row 3: Pending Orders */}
          <button
            type="button"
            className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow text-left w-full h-full min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Pending Orders</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingOrders || 0}</p>
                {stats.completedOrders !== undefined ? (
                  <p className="text-xs text-gray-500 mt-2">
                    {stats.completedOrders} completed
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">Awaiting completion</p>
                )}
              </div>
              <Package size={32} className="text-success-500 flex-shrink-0 ml-4" />
            </div>
          </button>
        </div>

        {/* Products Section - Same card view as Products.tsx */}
        <Card className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-heading font-bold text-gray-900">My Products</h2>
          </div>

          {productsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} height="300px" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="No products yet"
              description="Start by adding your first product to sell."
              action={{
                label: 'Add Product',
                onClick: handleCreateProduct,
              }}
              icon={Package}
            />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product: Product) => {
                // Get first image: prefer imageUrls array, fallback to imageUrl
                const images = (product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > 0)
                  ? product.imageUrls 
                  : (product.imageUrl ? [product.imageUrl] : []);
                const firstImage = images[0];

                return (
                  <Card key={product.id} hoverable className="h-full overflow-hidden flex flex-col">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden relative group">
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={product.name}
                          className="w-full h-full object-cover"
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
                      {/* Edit/Delete overlay on hover */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleEditProduct(product);
                          }}
                          className="px-3 py-1.5 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleDeleteProduct(product.id);
                          }}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      {product.cooperative && (
                        <p className="text-sm text-gray-600 mb-2">
                          {product.cooperative.name}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-lg font-bold text-primary-600">
                          {product.price.toFixed(2)} MAD
                        </span>
                        <Badge
                          color={product.stockQuantity > 0 ? 'success' : 'error'}
                          size="sm"
                        >
                          {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {product.unit} • Stock: {product.stockQuantity}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent Orders */}
        <Card>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-heading font-bold text-gray-900">Recent Orders</h2>
            {transactions.filter((t: any) => user?.id === t.seller?.id).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/transactions')}
                icon={<ArrowRight size={16} />}
                className="w-full sm:w-auto"
              >
                View All
              </Button>
            )}
          </div>
          {transactions.filter((t: any) => user?.id === t.seller?.id).length === 0 ? (
            <EmptyState
              title="No orders yet"
              description="Orders will appear here once buyers purchase your products."
            />
          ) : (
            <div className="space-y-4">
              {transactions
                .filter((t: any) => user?.id === t.seller?.id)
                .slice(0, 10)
                .map((transaction: any) => {
                  const txId = transaction.id || transaction._id?.toString();
                  const txProduct = transaction.product?.name || transaction.product || 'Product';
                  const txBuyer = transaction.buyer?.email || transaction.buyer || 'Unknown';
                  const txAmount = transaction.totalAmount || transaction.amount;
                  const txStatus = transaction.status;
                  const txCreatedAt = transaction.createdAt;
                  
                  return (
                    <div
                      key={txId}
                      onClick={() => txId && navigate(`/transactions/${txId}`)}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{txProduct}</p>
                          <p className="text-sm text-gray-600">
                            Buyer: {txBuyer} • {txCreatedAt && format(new Date(txCreatedAt), 'PPp')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary-600">{txAmount?.toFixed(2)} MAD</p>
                          <Badge color={statusColors[txStatus] as any} size="sm">
                            {txStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      </div>

      {/* Ma3qoul Score Modal */}
      <Modal
        isOpen={showCreditScoreModal}
        onClose={() => setShowCreditScoreModal(false)}
        title="Ma3qoul Score Details"
        size="lg"
      >
        {creditScoreLoading ? (
          <div className="space-y-4">
            <Skeleton height="100px" />
            <Skeleton height="200px" />
          </div>
        ) : creditScore ? (
          <div className="space-y-6">
            <div className="text-center p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Award className="w-12 h-12 text-primary-600" />
                <div>
                  <p className="text-5xl font-bold text-gray-900">{creditScore.score}</p>
                  <Badge className={`mt-2 ${getCreditScoreTierColor(creditScore.tier)}`}>
                    {creditScore.tier}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Maximum Loan Amount: <span className="font-semibold">{creditScore.maxLoanAmount.toFixed(2)} MAD</span>
              </p>
            </div>

            {creditScore.breakdown && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Score Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Base Score</span>
                    <span className="font-semibold text-gray-900">+{creditScore.breakdown.baseScore}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Volume Points</span>
                    <span className="font-semibold text-success-600">+{creditScore.breakdown.volumePoints}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Reliability Points</span>
                    <span className="font-semibold text-success-600">+{creditScore.breakdown.reliabilityPoints}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Stability Points</span>
                    <span className="font-semibold text-success-600">+{creditScore.breakdown.stabilityPoints}</span>
                  </div>
                  {creditScore.breakdown.penaltyPoints > 0 && (
                    <div className="flex items-center justify-between p-3 bg-error-50 rounded-lg">
                      <span className="text-sm text-gray-600">Penalty Points</span>
                      <span className="font-semibold text-error-600">-{creditScore.breakdown.penaltyPoints}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {creditScore.nextMilestone && (
              <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                <p className="text-sm font-semibold text-primary-900 mb-1">Next Milestone</p>
                <p className="text-sm text-primary-700">{creditScore.nextMilestone}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Unable to load credit score information.</p>
          </div>
        )}
      </Modal>

      {/* Product Form Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <form onSubmit={handleSubmitProduct} className="space-y-4">
          <Input
            label="Product Name"
            name="name"
            defaultValue={editingProduct?.name || ''}
            required
            placeholder="e.g., Organic Argan Oil"
          />
          <Input
            label="Description"
            name="description"
            defaultValue={editingProduct?.description || ''}
            placeholder="Product description..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (MAD)"
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={editingProduct?.price || ''}
              required
            />
            <Input
              label="Unit"
              name="unit"
              defaultValue={editingProduct?.unit || ''}
              required
              placeholder="e.g., kg, liter"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Stock Quantity"
              name="stock_quantity"
              type="number"
              min="0"
              defaultValue={editingProduct?.stockQuantity || '0'}
            />
            <Input
              label="Image URL"
              name="image_url"
              type="url"
              defaultValue={editingProduct?.imageUrl || ''}
              placeholder="https://..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowProductModal(false);
                setEditingProduct(null);
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth loading={productMutation.isPending}>
              {editingProduct ? 'Update' : 'Create'} Product
            </Button>
          </div>
        </form>
      </Modal>
    </ProtectedRoute>
  );
};

const statusColors: Record<string, string> = {
  INITIATED: 'gray',
  FEE_SIMULATED: 'info',
  ESCROWED: 'warning',
  SHIPPED: 'secondary',
  DELIVERED: 'primary',
  SETTLED: 'success',
  FAILED: 'error',
};
