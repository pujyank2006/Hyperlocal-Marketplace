import { useEffect, useState } from 'react';
import { paymentService } from '../services/api';
import { handleSuccess, handleError } from '../utils';
import styles from '../ComponentStyles/paymentModal.module.css';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:9000";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function PaymentModal({ listing, isOpen, onClose, onPaymentSuccess, onViewInvoice, offerMessageId = null, agreedPrice = null }) {
  const [deliveryType, setDeliveryType] = useState('local_pickup');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCompletedOrder(null);
      setDeliveryType('local_pickup');
    }
  }, [isOpen, listing?._id, offerMessageId]);

  if (!isOpen || !listing) return null;

  const price = Number(agreedPrice ?? listing.price) || 0;
  const platformFee = 0; // Hyperlocal platform zero-fee promotion
  const totalAmount = price + platformFee;

  const itemImage = listing.images && listing.images.length > 0
    ? (listing.images[0].startsWith('http') ? listing.images[0] : `${API_BASE}${listing.images[0]}`)
    : 'https://placehold.co/100x100?text=Item';

  // Process Instant Sandbox Test Payment
  const handleSandboxPayment = async () => {
    try {
      setIsProcessing(true);
      const createRes = await paymentService.createOrder(listing._id, deliveryType, offerMessageId);
      if (!createRes.success) {
        handleError(createRes.message || 'Could not initiate order');
        setIsProcessing(false);
        return;
      }

      await verifySandboxOrder(createRes.order);
    } catch (err) {
      console.error('Payment error:', err);
      handleError(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const verifySandboxOrder = async (orderData) => {
    const verifyRes = await paymentService.verifyPayment({
      orderId: orderData.orderId,
      paymentId: `sandbox_pay_${Date.now()}`,
      gatewayOrderId: orderData.gatewayOrderId,
      signature: 'sandbox_test_signature',
      isSandbox: true
    });
    if (!verifyRes.success) throw new Error(verifyRes.message || 'Payment verification failed');
    setCompletedOrder(verifyRes.order);
    handleSuccess('🎉 Payment verified! Funds are held until handover is confirmed.');
    if (onPaymentSuccess) onPaymentSuccess(verifyRes.order);
  };

  // Process Real Razorpay Payment
  const handleRazorpayPayment = async () => {
    try {
      setIsProcessing(true);
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        handleError('Failed to load Razorpay SDK. You can use Instant Sandbox Pay instead.');
        setIsProcessing(false);
        return;
      }

      const createRes = await paymentService.createOrder(listing._id, deliveryType, offerMessageId);
      if (!createRes.success) {
        handleError(createRes.message || 'Could not initiate order');
        setIsProcessing(false);
        return;
      }

      const order = createRes.order;
      const keyId = createRes.keyId;

      if (!keyId || createRes.isSandbox) {
        // Use the order already created above; avoid duplicate pending orders.
        await verifySandboxOrder(order);
        setIsProcessing(false);
        return;
      }

      const options = {
        key: keyId,
        amount: Math.round(order.amount * 100),
        currency: 'INR',
        name: 'Hyperlocal Marketplace',
        description: `${offerMessageId ? 'Accepted offer' : 'Purchase'}: ${listing.title}`,
        order_id: order.gatewayOrderId,
        handler: async function (response) {
          try {
            const verifyRes = await paymentService.verifyPayment({
              orderId: order.orderId,
              paymentId: response.razorpay_payment_id,
              gatewayOrderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              isSandbox: false
            });

            if (verifyRes.success) {
              setCompletedOrder(verifyRes.order);
              handleSuccess('🎉 Payment verified at the accepted offer price.');
              if (onPaymentSuccess) onPaymentSuccess(verifyRes.order);
            } else {
              handleError(verifyRes.message || 'Signature verification failed');
            }
          } catch (vErr) {
            console.error('Verification error:', vErr);
            handleError('Verification failed');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: order.metadata?.buyerName || '',
        },
        theme: {
          color: '#0284c7'
        },
        modal: {
          ondismiss: function () {
            paymentService.orderAction(order.orderId, { action: 'report-payment-failure', reason: 'Checkout was closed before payment completed.' }).catch(() => {});
            setIsProcessing(false);
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();

    } catch (err) {
      console.error('Razorpay initialization error:', err);
      handleError(err.message || 'Razorpay checkout error');
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerTitle}>
            <span className={styles.headerIcon}>💳</span>
            <h3>{completedOrder ? 'Payment Confirmed' : 'Checkout & Payment'}</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.modalBody}>
          {completedOrder ? (
            /* SUCCESS VIEW */
            <div className={styles.successBox}>
              <div className={styles.successIcon}>🎉</div>
              <h2 className={styles.successTitle}>Payment secured</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                Payment for <strong>{completedOrder.metadata?.listingTitle}</strong> is recorded. Confirm handover in Purchases to release the hold.
              </p>
              <div className={styles.orderIdPill}>
                Order ID: {completedOrder.orderId}
              </div>
              <div className={styles.breakdownBox} style={{ width: '100%', textAlign: 'left', marginTop: '6px' }}>
                <div className={styles.breakdownRow}>
                  <span>Amount held:</span>
                  <strong>₹{completedOrder.amount}</strong>
                </div>
                <div className={styles.breakdownRow}>
                  <span>Seller:</span>
                  <strong>{completedOrder.metadata?.sellerName} ({completedOrder.metadata?.sellerCity || 'Local'})</strong>
                </div>
                <div className={styles.breakdownRow}>
                  <span>Delivery Method:</span>
                  <strong>{completedOrder.deliveryType === 'local_pickup' ? '📍 Local Pickup' : '🤝 Direct Handover'}</strong>
                </div>
              </div>

              <div className={styles.successActions}>
                {onViewInvoice && (
                  <button
                    className={styles.viewInvoiceBtn}
                    onClick={() => {
                      onClose();
                      onViewInvoice(completedOrder);
                    }}
                  >
                    📄 View & Print Invoice
                  </button>
                )}
                <button className={styles.doneBtn} onClick={onClose}>
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* CHECKOUT VIEW */
            <>
              {/* ITEM SUMMARY */}
              <div className={styles.itemSummaryCard}>
                <img
                  src={itemImage}
                  alt={listing.title}
                  className={styles.itemThumb}
                  onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Item'; }}
                />
                <div className={styles.itemInfo}>
                  <h4 className={styles.itemTitle}>{listing.title}</h4>
                  <div className={styles.itemMeta}>
                    <span className={styles.categoryTag}>{listing.category}</span>
                    <span>📍 {listing.area || listing.city || 'Local Area'}</span>
                  </div>
                <div className={styles.itemPrice}>{offerMessageId ? 'Accepted offer: ' : ''}₹{price.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* DELIVERY METHOD */}
              <div>
                <label className={styles.sectionLabel}>Select Handover / Delivery:</label>
                <select
                  className={styles.deliverySelect}
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value)}
                >
                  <option value="local_pickup">📍 Local Pickup (Inspect & collect in person)</option>
                  <option value="direct_handover">🤝 Direct Handover (Meet at convenient public spot)</option>
                </select>
              </div>

              {/* PRICE BREAKDOWN */}
              <div className={styles.breakdownBox}>
                <div className={styles.breakdownRow}>
                  <span>Item Subtotal:</span>
                  <span>₹{price.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.breakdownRow}>
                  <span>Hyperlocal Platform Fee:</span>
                  <span style={{ color: '#16a34a', fontWeight: '700' }}>₹0 (Free)</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Total Payable:</span>
                  <span style={{ color: '#0284c7' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* PAYMENT ACTIONS */}
              <div className={styles.paymentOptionsBox}>
                <button
                  className={styles.rzpBtn}
                  onClick={handleRazorpayPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing Transaction...' : `💳 Pay ₹${totalAmount.toLocaleString('en-IN')} with Razorpay / UPI`}
                </button>

                <button
                  type="button"
                  className={styles.sandboxBtn}
                  onClick={handleSandboxPayment}
                  disabled={isProcessing}
                >
                  ⚡ Instant Sandbox Pay (Zero-Setup 1-Click Test)
                </button>
              </div>

              <div className={styles.securityNote}>
                <span>🔒</span>
                <span>Prototype protection ledger only: payment is charged immediately; this app does not hold, release, or refund real funds.</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
