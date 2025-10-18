import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/food/FoodDialog';
import FoodButton from '../ui/food/FoodButton';
import { toast } from 'sonner';
import api from '../../services/api';

const FoodOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModify, setShowModify] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modForm, setModForm] = useState({ quantity: 1, type: 'dine-in', notes: '' });
  const [modLoading, setModLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/food/orders/my-orders');
      setOrders(res.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const openModify = (order) => {
    setSelectedOrder(order);
    setModForm({
      quantity: order.items[0]?.quantity || 1,
      type: order.orderType || 'dine-in',
      notes: order.notes || ''
    });
    setShowModify(true);
  };

  const handleModify = async () => {
    setModLoading(true);
    try {
      await api.put(`/food/orders/${selectedOrder._id}/modify`, modForm);
      toast.success('Order modified successfully');
      setShowModify(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to modify order');
    } finally {
      setModLoading(false);
    }
  };

  const handleCancel = async (order) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await api.delete(`/food/orders/${order._id}/cancel`);
      toast.success('Order cancelled');
      fetchOrders();
    } catch (error) {
      console.error('Error canceling order:', error);
      toast.error('Failed to cancel order');
    }
  };

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">My Food Orders</h2>
      {orders.length === 0 ? (
        <div>No food orders found.</div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="border rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-semibold">Order #{order._id.slice(-6)}</div>
                <div className="text-sm text-gray-600">{order.items.map(i => i.name).join(', ')} | Qty: {order.items[0]?.quantity}</div>
                <div className="text-sm">Type: {order.orderType} | Status: <span className="font-medium">{order.status}</span></div>
                <div className="text-sm">Total: LKR {order.totalPrice}</div>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <FoodButton onClick={() => openModify(order)} disabled={['Delivered','Cancelled'].includes(order.status)} size="sm" variant="default">Modify</FoodButton>
                <FoodButton onClick={() => handleCancel(order)} disabled={['Delivered','Cancelled'].includes(order.status)} size="sm" variant="danger">Cancel</FoodButton>
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={showModify} onOpenChange={setShowModify}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label>Quantity
              <input type="number" min={1} value={modForm.quantity} onChange={e => setModForm(f => ({ ...f, quantity: +e.target.value }))} className="border rounded px-2 py-1 ml-2 w-20" />
            </label>
            <label>Type
              <select value={modForm.type} onChange={e => setModForm(f => ({ ...f, type: e.target.value }))} className="border rounded px-2 py-1 ml-2">
                <option value="dine-in">Dine-in</option>
                <option value="takeaway">Takeaway</option>
              </select>
            </label>
            <label>Notes
              <input type="text" value={modForm.notes} onChange={e => setModForm(f => ({ ...f, notes: e.target.value }))} className="border rounded px-2 py-1 ml-2 w-full" />
            </label>
            <FoodButton onClick={handleModify} loading={modLoading} variant="default">Save Changes</FoodButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FoodOrderHistory;
