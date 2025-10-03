import React, { useState, useEffect } from 'react';
import MenuPage from './MenuPage';
import CartPage from './CartPage';
import OrdersPage from './OrdersPage';
import ProfilePage from './ProfilePage';
import ChefPage from './ChefPage';
import PaymentPage from './PaymentPage';
import PaymentSuccessPage from './PaymentSuccessPage';
import OrderService from '../../services/orderService';
import './qrBilling.css';
import { ShoppingCart, ChefHat, Clock, User, UtensilsCrossed } from 'lucide-react';

// Container that mimics the original tab layout but using web components.
export default function QrBillingApp() {
  const [tab, setTab] = useState('menu');
  const [cart, setCart] = useState([]);
  const [orderData, setOrderData] = useState(null);

  const handleAdd = (item) => {
    // Default add increments by 1
    updateItemQuantity(item, (getQuantity(item.id) + 1));
  };

  const getQuantity = (id) => cart.find(i => i.id === id)?.quantity || 0;

  const updateItemQuantity = (item, newQty) => {
    setCart(prev => {
      if (newQty <= 0) {
        return prev.filter(i => i.id !== item.id);
      }
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, image: item.image, quantity: newQty, customizations: item.customizations }];
    });
  };

  const cartQuantities = cart.reduce((acc, i) => { acc[i.id] = i.quantity; return acc; }, {});

  const handleConfirmOrder = (data) => {
    // Prepare order data for payment
    const paymentData = {
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    };
    setOrderData(paymentData);
    setTab('payment');
  };

  const handlePaymentComplete = () => {
    // Clear cart and order data after successful payment
    setCart([]);
    setOrderData(null);
    setTab('orders');
  };

  const handlePaymentSuccess = async (paymentData) => {
    console.log('🎉 Payment successful, creating order...', paymentData);
    
    try {
      // Prepare order data from cart and payment info
      const orderData = {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          customizations: item.customizations || []
        })),
        customerInfo: {
          name: paymentData.customerName || 'QR Customer',
          phone: paymentData.phone || null
        },
        paymentInfo: {
          method: paymentData.paymentMethod || 'online',
          amount: paymentData.totalAmount,
          transactionId: paymentData.transactionId
        },
        tableNumber: paymentData.tableNumber || `QR-${Date.now().toString().slice(-4)}`,
        specialRequests: paymentData.specialRequests || [],
        total: paymentData.totalAmount
      };

      // Create order in the system
      const orderResult = await OrderService.createOrder(orderData);
      
      if (orderResult.success) {
        console.log('✅ Order created and sent to kitchen!', orderResult);
        
        // Update payment data with order information
        const updatedPaymentData = {
          ...paymentData,
          orderId: orderResult.orderId,
          orderMessage: orderResult.message,
          estimatedTime: orderResult.data?.estimatedTime || '15-20 minutes'
        };
        
        setOrderData(updatedPaymentData);
        setTab('payment-success');
      } else {
        console.error('❌ Failed to create order:', orderResult.error);
        // Still show success page but with error message
        setOrderData({
          ...paymentData,
          orderError: 'Payment successful, but there was an issue sending your order to the kitchen. Please contact staff.',
          orderId: null
        });
        setTab('payment-success');
      }
      
    } catch (error) {
      console.error('❌ Error processing order after payment:', error);
      setOrderData({
        ...paymentData,
        orderError: 'Payment successful, but there was an issue processing your order. Please contact staff.',
        orderId: null
      });
      setTab('payment-success');
    }
  };

  useEffect(()=>{
    document.body.classList.add('qr-billing-active');
    return () => { document.body.classList.remove('qr-billing-active'); };
  }, []);

  return (
    <div className="qr-billing-theme">
      <div className="qr-shell">
      <div className="qr-tabs-content">
        <div className="qr-content">
          {tab === 'menu' && <MenuPage onSelectAdd={handleAdd} onQuantityChange={(item, qty)=>updateItemQuantity(item, qty)} quantities={cartQuantities} />}
          {tab === 'cart' && <CartPage cart={cart} setCart={setCart} onCheckout={handleConfirmOrder} />}
          {tab === 'payment' && <PaymentPage orderData={orderData} onPaymentComplete={handlePaymentComplete} onBack={() => setTab('cart')} onPaymentSuccess={handlePaymentSuccess} />}
          {tab === 'payment-success' && <PaymentSuccessPage orderData={orderData} onComplete={handlePaymentComplete} />}
          {tab === 'orders' && <OrdersPage />}
          {tab === 'kitchen' && <ChefPage />}
          {tab === 'profile' && <ProfilePage />}
        </div>
      </div>
      <div className={`qr-tabbar-outer ${tab === 'payment' || tab === 'payment-success' ? 'hidden' : ''}`}>
        <div className="qr-tabbar-inner">
          <div className="qr-tabbar">
            <button onClick={()=>setTab('menu')} className={tab==='menu'? 'active':''}><ChefHat size={18}/> <span>Menu</span></button>
            <button onClick={()=>setTab('cart')} className={tab==='cart'? 'active':''}><ShoppingCart size={18}/> <span>Cart{cart.length? ` (${cart.reduce((s,i)=>s+i.quantity,0)})`:''}</span></button>
            <button onClick={()=>setTab('orders')} className={tab==='orders'? 'active':''}><Clock size={18}/> <span>Orders</span></button>
            <button onClick={()=>setTab('kitchen')} className={tab==='kitchen'? 'active':''}><UtensilsCrossed size={18}/> <span>Kitchen</span></button>
            <button onClick={()=>setTab('profile')} className={tab==='profile'? 'active':''}><User size={18}/> <span>Profile</span></button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
