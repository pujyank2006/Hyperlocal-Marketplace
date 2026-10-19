import { useEffect, useState } from 'react';
import { paymentService } from '../services/api';
import styles from '../ComponentStyles/invoiceModal.module.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function InvoiceModal({ order, orderId, isOpen, onClose }) {
  const [orderData, setOrderData] = useState(order || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setOrderData(order);
    } else if (orderId && isOpen) {
      setLoading(true);
      paymentService.getOrderInvoice(orderId)
        .then(res => {
          if (res.success) {
            setOrderData(res.order);
          }
        })
        .catch(err => console.error('Invoice fetch error:', err))
        .finally(() => setLoading(false));
    }
  }, [order, orderId, isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const meta = orderData?.metadata || {};
  const amount = Number(orderData?.amount) || 0;

  return (
    <div className={styles.invoiceOverlay} onClick={onClose}>
      <div className={styles.invoiceContainer} onClick={(e) => e.stopPropagation()}>
        {/* ACTION BAR */}
        <div className={styles.invoiceActionsBar}>
          <div className={styles.invoiceTitle}>
            <span>📄</span> Transaction Invoice & Receipt
          </div>
          <div className={styles.barButtons}>
            <button className={styles.printBtn} onClick={handlePrint}>
              <span>🖨️</span> Print / Save PDF
            </button>
            <button className={styles.closeBtn} onClick={onClose}>&times;</button>
          </div>
        </div>

        {/* SCROLLABLE INVOICE PAPER */}
        <div className={styles.invoiceScrollable}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading invoice details...
            </div>
          ) : !orderData ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#e11d48' }}>
              Invoice details could not be loaded.
            </div>
          ) : (
            <div className={styles.invoicePaper}>
              {/* HEADER */}
              <div className={styles.headerSection}>
                <div className={styles.brandInfo}>
                  <h2>🛍️ Hyperlocal Marketplace</h2>
                  <div className={styles.brandSub}>Peer-to-Peer Verified Local Trade Receipt</div>
                  <div className={styles.brandSub}>Invoice Ref: {orderData.orderId}</div>
                </div>
                <div className={styles.invoiceMeta}>
                  <div className={styles.metaBadge}>✓ PAID & VERIFIED</div>
                  <div className={styles.orderIdText}>{orderData.orderId}</div>
                  <div className={styles.dateText}>{formatDate(orderData.createdAt)}</div>
                </div>
              </div>

              {/* BUYER & SELLER DETAILS */}
              <div className={styles.partiesGrid}>
                <div className={styles.partyBox}>
                  <h4>Billed To (Buyer)</h4>
                  <div className={styles.partyName}>{meta.buyerName || 'Buyer'}</div>
                  <div className={styles.partyDetail}>
                    📍 {meta.buyerArea ? `${meta.buyerArea}, ` : ''}{meta.buyerCity || 'Local Area'}
                    {meta.buyerPincode ? ` - ${meta.buyerPincode}` : ''}
                  </div>
                  {meta.buyerPhone && <div className={styles.partyDetail}>📞 {meta.buyerPhone}</div>}
                </div>

                <div className={styles.partyBox}>
                  <h4>Sold By (Seller)</h4>
                  <div className={styles.partyName}>{meta.sellerName || 'Seller'}</div>
                  <div className={styles.partyDetail}>
                    📍 {meta.sellerArea ? `${meta.sellerArea}, ` : ''}{meta.sellerCity || 'Local Area'}
                    {meta.sellerPincode ? ` - ${meta.sellerPincode}` : ''}
                  </div>
                  {meta.sellerPhone && <div className={styles.partyDetail}>📞 {meta.sellerPhone}</div>}
                </div>
              </div>

              {/* LINE ITEMS TABLE */}
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Category</th>
                    <th>Handover Mode</th>
                    <th>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>{meta.listingTitle || 'Marketplace Item'}</strong>
                    </td>
                    <td>{meta.listingCategory || 'General'}</td>
                    <td>
                      {orderData.deliveryType === 'local_pickup' ? '📍 Local Pickup' : '🤝 Direct Handover'}
                    </td>
                    <td>₹{amount.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              {/* TOTALS */}
              <div className={styles.totalsSection}>
                <div className={styles.totalsCard}>
                  <div className={styles.totRow}>
                    <span>Item Subtotal:</span>
                    <span>₹{amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={styles.totRow}>
                    <span>Platform Service Fee:</span>
                    <span style={{ color: '#16a34a', fontWeight: '700' }}>₹0.00 (Free)</span>
                  </div>
                  <div className={styles.grandTotalRow}>
                    <span>Total Paid:</span>
                    <span>₹{amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* PAYMENT METADATA FOOTER */}
              <div className={styles.paymentMetaFooter}>
                <div>
                  <strong>Gateway:</strong> {orderData.paymentGateway || 'Sandbox'}
                </div>
                <div>
                  <strong>Transaction ID:</strong> {orderData.paymentId || 'N/A'}
                </div>
                <div>
                  <strong>Status:</strong> {orderData.paymentStatus?.toUpperCase()}
                </div>
              </div>

              <div className={styles.disclaimer}>
                This is an official computer-generated receipt issued through Hyperlocal Marketplace.
                The buyer and seller agree to inspect and hand over goods in accordance with local safety and trade guidelines.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InvoiceModal;
