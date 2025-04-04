// src/pages/OrderDetail.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const { user } = useAuth();

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setOrder(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch order details');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/orders/${id}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Refresh order details
      fetchOrderDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-10">Loading order details...</div>;
    }

    if (error) {
      return (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
          {error}
          <div className="mt-4">
            <button
              onClick={() => navigate('/orders')}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
            >
              Back to Orders
            </button>
          </div>
        </div>
      );
    }

    if (!order) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">Order not found</p>
          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            Back to Orders
          </button>
        </div>
      );
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Order Details</h2>
          <button
            onClick={() => navigate('/orders')}
            className="text-primary hover:underline"
          >
            Back to Orders
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium">Order #{order._id.substring(0, 8)}</h3>
                <p className="text-gray-500">
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="mt-2 md:mt-0">
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>

            {order.status === 'Processing' && (
              <div className="mt-4">
                <button
                  onClick={handleCancelOrder}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Cancel Order
                </button>
              </div>
            )}
          </div>

          <div className="p-6 border-b">
            <h3 className="text-lg font-medium mb-4">Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.orderItems.map((item) => (
                    <tr key={item._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              src={item.image || '/placeholder-product.png'}
                              alt={item.name}
                              className="h-10 w-10 object-cover rounded"
                            />
                          </div>
                          <div className="ml-4">
                            <Link
                              to={`/products/${item.product}`}
                              className="text-sm font-medium text-gray-900 hover:underline"
                            >
                              {item.name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${item.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Shipping Address</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.address}</p>
                {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Order Summary</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between py-2">
                  <span>Subtotal</span>
                  <span>${order.itemsPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Shipping</span>
                  <span>${order.shippingPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Tax</span>
                  <span>${order.taxPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold border-t mt-2 pt-2">
                  <span>Total</span>
                  <span>${order.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Payment</h3>
                <p>
                  <span className="font-medium">Method:</span> {order.paymentMethod}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  <span className={order.isPaid ? 'text-green-600' : 'text-red-600'}>
                    {order.isPaid ? 'Paid' : 'Not Paid'}
                  </span>
                </p>
                {order.isPaid && (
                  <p>
                    <span className="font-medium">Paid on:</span>{' '}
                    {new Date(order.paidAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {order.status === 'Delivered' && !order.isDelivered && (
            <div className="p-6 bg-green-50 border-t">
              <div className="flex items-center">
                <div className="mr-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <span className="text-xl">✓</span>
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-green-800">Your order has been delivered!</h3>
                  <p className="text-green-700">
                    Delivered on {new Date(order.deliveredAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {order.status === 'Delivered' && (
          <div className="text-center mt-6">
            <Link to={`/products/${order.orderItems[0].product}/review`} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
              Write a Review
            </Link>
          </div>
        )}
      </div>
    );
  };

  const menuItems = [
    { id: 'profile', label: 'Profile Information', icon: 'user', link: '/profile' },
    { id: 'orders', label: 'Order History', icon: 'shopping-bag', link: '/orders' },
    { id: 'addresses', label: 'My Addresses', icon: 'map-pin', link: '/profile?tab=addresses' },
    { id: 'wishlist', label: 'Wishlist', icon: 'heart', link: '/profile?tab=wishlist' },
    { id: 'reviews', label: 'My Reviews', icon: 'star', link: '/profile?tab=reviews' },
  ];

  return (
    <DashboardLayout
      title="Order Details"
      menuItems={menuItems}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default OrderDetail;