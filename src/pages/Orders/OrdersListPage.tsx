import { useMemo, useState } from 'react';

type OrderStatus =
  | 'Pending'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned';

type PaymentStatus = 'Paid' | 'Pending' | 'Refunded' | 'Failed';

type Order = {
  id: number;
  orderId: string;
  customer: string;
  email: string;
  items: number;
  total: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  date: string;
  city: string;
};

type OrdersListPageProps = {
  title: string;
  subtitle: string;
  defaultStatus: 'All' | OrderStatus;
};

const orders: Order[] = [
  { id: 1, orderId: 'ORD-1001', customer: 'Aarav Sharma', email: 'aarav@gmail.com', items: 3, total: 2499, paymentStatus: 'Paid', status: 'Pending', date: '26 Mar 2026', city: 'Delhi' },
  { id: 2, orderId: 'ORD-1002', customer: 'Priya Mehta', email: 'priya@gmail.com', items: 2, total: 1599, paymentStatus: 'Paid', status: 'Processing', date: '25 Mar 2026', city: 'Mumbai' },
  { id: 3, orderId: 'ORD-1003', customer: 'Rohan Verma', email: 'rohan@gmail.com', items: 1, total: 899, paymentStatus: 'Pending', status: 'Pending', date: '25 Mar 2026', city: 'Pune' },
  { id: 4, orderId: 'ORD-1004', customer: 'Sneha Kapoor', email: 'sneha@gmail.com', items: 4, total: 4999, paymentStatus: 'Paid', status: 'Shipped', date: '24 Mar 2026', city: 'Bengaluru' },
  { id: 5, orderId: 'ORD-1005', customer: 'Kabir Singh', email: 'kabir@gmail.com', items: 2, total: 3299, paymentStatus: 'Paid', status: 'Delivered', date: '23 Mar 2026', city: 'Jaipur' },
  { id: 6, orderId: 'ORD-1006', customer: 'Ananya Rao', email: 'ananya@gmail.com', items: 1, total: 549, paymentStatus: 'Refunded', status: 'Returned', date: '22 Mar 2026', city: 'Hyderabad' },
  { id: 7, orderId: 'ORD-1007', customer: 'Vikram Das', email: 'vikram@gmail.com', items: 5, total: 7199, paymentStatus: 'Failed', status: 'Cancelled', date: '21 Mar 2026', city: 'Kolkata' },
  { id: 8, orderId: 'ORD-1008', customer: 'Isha Patel', email: 'isha@gmail.com', items: 2, total: 1899, paymentStatus: 'Paid', status: 'Shipped', date: '20 Mar 2026', city: 'Ahmedabad' },
  { id: 9, orderId: 'ORD-1009', customer: 'Neel Joshi', email: 'neel@gmail.com', items: 3, total: 2799, paymentStatus: 'Paid', status: 'Delivered', date: '19 Mar 2026', city: 'Surat' },
  { id: 10, orderId: 'ORD-1010', customer: 'Diya Nair', email: 'diya@gmail.com', items: 1, total: 1299, paymentStatus: 'Pending', status: 'Processing', date: '18 Mar 2026', city: 'Chennai' },
];

const orderStatusConfig: Record<OrderStatus, { bg: string; color: string; dot: string }> = {
  Pending: { bg: '#fff7ed', color: '#ea580c', dot: '#f97316' },
  Processing: { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6' },
  Shipped: { bg: '#ecfeff', color: '#0891b2', dot: '#06b6d4' },
  Delivered: { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
  Cancelled: { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
  Returned: { bg: '#faf5ff', color: '#9333ea', dot: '#a855f7' },
};

const paymentStatusConfig: Record<PaymentStatus, { bg: string; color: string }> = {
  Paid: { bg: '#f0fdf4', color: '#16a34a' },
  Pending: { bg: '#fffbeb', color: '#d97706' },
  Refunded: { bg: '#eff6ff', color: '#2563eb' },
  Failed: { bg: '#fef2f2', color: '#dc2626' },
};

export default function OrdersListPage({
  title,
  subtitle,
  defaultStatus,
}: OrdersListPageProps) {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | OrderStatus>(defaultStatus);
  const [selectedPayment, setSelectedPayment] = useState<'All' | PaymentStatus>('All');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const term = search.toLowerCase();

      const matchesSearch =
        order.orderId.toLowerCase().includes(term) ||
        order.customer.toLowerCase().includes(term) ||
        order.email.toLowerCase().includes(term) ||
        order.city.toLowerCase().includes(term);

      const matchesStatus = selectedStatus === 'All' || order.status === selectedStatus;
      const matchesPayment = selectedPayment === 'All' || order.paymentStatus === selectedPayment;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [search, selectedStatus, selectedPayment]);

  const stats = [
    {
      label: 'Total Orders',
      value: filteredOrders.length,
      color: '#2563eb',
      bg: '#eff6ff',
      icon: '📦',
    },
    {
      label: 'Revenue',
      value: `₹${filteredOrders.reduce((sum, order) => sum + order.total, 0).toLocaleString()}`,
      color: '#16a34a',
      bg: '#f0fdf4',
      icon: '💰',
    },
    {
      label: 'Paid Orders',
      value: filteredOrders.filter((order) => order.paymentStatus === 'Paid').length,
      color: '#0891b2',
      bg: '#ecfeff',
      icon: '✅',
    },
    {
      label: 'Returns / Cancels',
      value: filteredOrders.filter((order) => order.status === 'Returned' || order.status === 'Cancelled').length,
      color: '#dc2626',
      bg: '#fef2f2',
      icon: '↩',
    },
  ];

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const allSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((order) => selectedIds.includes(order.id));

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .orders-page {
          min-height: 100vh;
          padding: 24px;
          background: #f8fafc;
          font-family: 'DM Sans', sans-serif;
        }

        .orders-shell {
          max-width: 1400px;
          margin: 0 auto;
        }

        .orders-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .orders-heading h1 {
          margin: 0;
          font-size: 30px;
          line-height: 1.2;
          color: #0f172a;
          font-weight: 700;
        }

        .orders-heading p {
          margin: 6px 0 0;
          font-size: 15px;
          color: #64748b;
        }

        .orders-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .primary-btn,
        .secondary-btn,
        .bulk-btn,
        .small-btn,
        .small-btn-muted {
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .primary-btn {
          padding: 12px 18px;
          border-radius: 12px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 10px 20px rgba(37, 99, 235, 0.22);
        }

        .secondary-btn {
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid #dbe4f0;
          background: #fff;
          color: #334155;
          font-size: 14px;
          font-weight: 600;
        }

        .primary-btn:hover,
        .secondary-btn:hover,
        .bulk-btn:hover,
        .small-btn:hover,
        .small-btn-muted:hover {
          transform: translateY(-1px);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: #fff;
          border-radius: 18px;
          padding: 20px;
          border: 1px solid #edf2f7;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
          min-width: 0;
        }

        .stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .stat-label {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .stat-value {
          font-size: 30px;
          font-weight: 700;
          line-height: 1.1;
          word-break: break-word;
        }

        .filters-card {
          background: #fff;
          border-radius: 18px;
          padding: 16px;
          border: 1px solid #edf2f7;
          margin-bottom: 16px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
        }

        .filters-row {
          display: grid;
          grid-template-columns: minmax(0, 2fr) repeat(2, minmax(180px, 1fr));
          gap: 12px;
        }

        .input,
        .select {
          width: 100%;
          height: 46px;
          border-radius: 12px;
          border: 1.5px solid #dbe4f0;
          background: #f8fafc;
          color: #334155;
          font-size: 14px;
          padding: 0 14px;
          outline: none;
          font-family: inherit;
        }

        .bulk-bar {
          background: #1e40af;
          color: #fff;
          border-radius: 14px;
          padding: 14px 16px;
          margin-bottom: 16px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .bulk-text {
          font-size: 14px;
          font-weight: 600;
        }

        .bulk-btn {
          background: rgba(255, 255, 255, 0.16);
          color: #fff;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
        }

        .bulk-close {
          margin-left: auto;
          background: transparent;
          color: #fff;
          border: none;
          font-size: 22px;
          cursor: pointer;
        }

        .table-card {
          background: #fff;
          border-radius: 18px;
          border: 1px solid #edf2f7;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
        }

        .table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .orders-table {
          width: 100%;
          min-width: 1020px;
          border-collapse: collapse;
        }

        .orders-table thead tr {
          background: #f8fafc;
        }

        .orders-table th {
          padding: 14px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          white-space: nowrap;
        }

        .orders-table td {
          padding: 16px;
          border-top: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .selected-row {
          background: #eff6ff;
        }

        .order-id {
          font-size: 13px;
          font-weight: 700;
          color: #2563eb;
        }

        .customer-name {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }

        .customer-email {
          margin-top: 3px;
          font-size: 12px;
          color: #94a3b8;
        }

        .muted-text {
          font-size: 13px;
          color: #64748b;
        }

        .strong-text {
          font-size: 14px;
          color: #0f172a;
          font-weight: 700;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 11px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          display: inline-block;
        }

        .action-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .small-btn {
          background: #eff6ff;
          color: #2563eb;
          border-radius: 8px;
          padding: 7px 12px;
          font-size: 12px;
          font-weight: 700;
        }

        .small-btn-muted {
          background: #f8fafc;
          color: #475569;
          border-radius: 8px;
          padding: 7px 12px;
          font-size: 12px;
          font-weight: 700;
        }

        .mobile-list {
          display: none;
          padding: 16px;
          gap: 14px;
        }

        .mobile-card {
          border: 1px solid #eef2f7;
          border-radius: 16px;
          padding: 16px;
          background: #fff;
        }

        .mobile-card.selected {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .mobile-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 14px;
        }

        .mobile-title-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          min-width: 0;
        }

        .mobile-checkbox {
          margin-top: 2px;
          flex-shrink: 0;
        }

        .mobile-order-id {
          font-size: 13px;
          font-weight: 700;
          color: #2563eb;
          margin-bottom: 4px;
        }

        .mobile-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }

        .mobile-meta-item {
          min-width: 0;
        }

        .mobile-meta-label {
          font-size: 11px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
          font-weight: 700;
        }

        .mobile-meta-value {
          font-size: 13px;
          color: #0f172a;
          font-weight: 600;
          word-break: break-word;
        }

        .mobile-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 14px;
        }

        .mobile-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .empty-state {
          padding: 56px 20px;
          text-align: center;
          color: #94a3b8;
        }

        .empty-icon {
          font-size: 42px;
          margin-bottom: 10px;
        }

        .empty-title {
          font-size: 16px;
          font-weight: 700;
          color: #334155;
        }

        .empty-subtitle {
          font-size: 13px;
          margin-top: 6px;
        }

        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .orders-page {
            padding: 18px;
          }

          .filters-row {
            grid-template-columns: 1fr;
          }

          .orders-heading h1 {
            font-size: 26px;
          }
        }

        @media (max-width: 768px) {
          .orders-page {
            padding: 14px;
          }

          .orders-header {
            flex-direction: column;
            align-items: stretch;
          }

          .orders-actions {
            width: 100%;
          }

          .orders-actions button {
            flex: 1;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .table-wrap {
            display: none;
          }

          .mobile-list {
            display: grid;
          }

          .bulk-close {
            margin-left: 0;
          }
        }

        @media (max-width: 480px) {
          .orders-heading h1 {
            font-size: 22px;
          }

          .orders-heading p {
            font-size: 14px;
          }

          .mobile-meta {
            grid-template-columns: 1fr;
          }

          .primary-btn,
          .secondary-btn {
            width: 100%;
          }

          .stat-card,
          .filters-card,
          .mobile-card {
            border-radius: 14px;
          }
        }
      `}</style>

      <div className="orders-page">
        <div className="orders-shell">
          <div className="orders-header">
            <div className="orders-heading">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>

            <div className="orders-actions">
              <button className="secondary-btn">Export</button>
              {/* <button className="primary-btn">+ Create Order</button> */}
            </div>
          </div>

          <div className="stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className="stat-top">
                  <span className="stat-label">{stat.label}</span>
                  <div className="stat-icon" style={{ background: stat.bg }}>
                    {stat.icon}
                  </div>
                </div>
                <div className="stat-value" style={{ color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <div className="filters-card">
            <div className="filters-row">
              <input
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order ID, customer, email, city..."
              />

              <select
                className="select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'All' | OrderStatus)}
              >
                {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                className="select"
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value as 'All' | PaymentStatus)}
              >
                {['All', 'Paid', 'Pending', 'Refunded', 'Failed'].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="bulk-bar">
              <span className="bulk-text">{selectedIds.length} selected</span>
              <button className="bulk-btn">Mark Shipped</button>
              <button className="bulk-btn">Print Labels</button>
              <button className="bulk-close" onClick={() => setSelectedIds([])}>
                ×
              </button>
            </div>
          )}

          <div className="table-card">
            {filteredOrders.length > 0 && (
              <>
                <div className="table-wrap">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th style={{ width: '44px' }}>
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={(e) =>
                              setSelectedIds(
                                e.target.checked ? filteredOrders.map((order) => order.id) : []
                              )
                            }
                          />
                        </th>
                        {['Order ID', 'Customer', 'Date', 'Items', 'Total', 'Payment', 'Status', 'City', 'Actions'].map((head) => (
                          <th key={head}>{head}</th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {filteredOrders.map((order) => {
                        const orderBadge = orderStatusConfig[order.status];
                        const paymentBadge = paymentStatusConfig[order.paymentStatus];
                        const isSelected = selectedIds.includes(order.id);

                        return (
                          <tr key={order.id} className={isSelected ? 'selected-row' : ''}>
                            <td>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(order.id)}
                              />
                            </td>

                            <td>
                              <div className="order-id">{order.orderId}</div>
                            </td>

                            <td>
                              <div className="customer-name">{order.customer}</div>
                              <div className="customer-email">{order.email}</div>
                            </td>

                            <td className="muted-text">{order.date}</td>
                            <td className="strong-text">{order.items}</td>
                            <td className="strong-text">₹{order.total.toLocaleString()}</td>

                            <td>
                              <span
                                className="badge"
                                style={{
                                  background: paymentBadge.bg,
                                  color: paymentBadge.color,
                                }}
                              >
                                {order.paymentStatus}
                              </span>
                            </td>

                            <td>
                              <span
                                className="badge"
                                style={{
                                  background: orderBadge.bg,
                                  color: orderBadge.color,
                                }}
                              >
                                <span
                                  className="status-dot"
                                  style={{ background: orderBadge.dot }}
                                />
                                {order.status}
                              </span>
                            </td>

                            <td className="muted-text">{order.city}</td>

                            <td>
                              <div className="action-group">
                                <button className="small-btn">View</button>
                                <button className="small-btn-muted">Update</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mobile-list">
                  {filteredOrders.map((order) => {
                    const orderBadge = orderStatusConfig[order.status];
                    const paymentBadge = paymentStatusConfig[order.paymentStatus];
                    const isSelected = selectedIds.includes(order.id);

                    return (
                      <div
                        key={order.id}
                        className={`mobile-card ${isSelected ? 'selected' : ''}`}
                      >
                        <div className="mobile-top">
                          <div className="mobile-title-row">
                            <input
                              className="mobile-checkbox"
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(order.id)}
                            />
                            <div>
                              <div className="mobile-order-id">{order.orderId}</div>
                              <div className="customer-name">{order.customer}</div>
                              <div className="customer-email">{order.email}</div>
                            </div>
                          </div>
                        </div>

                        <div className="mobile-meta">
                          <div className="mobile-meta-item">
                            <div className="mobile-meta-label">Date</div>
                            <div className="mobile-meta-value">{order.date}</div>
                          </div>
                          <div className="mobile-meta-item">
                            <div className="mobile-meta-label">City</div>
                            <div className="mobile-meta-value">{order.city}</div>
                          </div>
                          <div className="mobile-meta-item">
                            <div className="mobile-meta-label">Items</div>
                            <div className="mobile-meta-value">{order.items}</div>
                          </div>
                          <div className="mobile-meta-item">
                            <div className="mobile-meta-label">Total</div>
                            <div className="mobile-meta-value">₹{order.total.toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="mobile-badges">
                          <span
                            className="badge"
                            style={{
                              background: paymentBadge.bg,
                              color: paymentBadge.color,
                            }}
                          >
                            {order.paymentStatus}
                          </span>

                          <span
                            className="badge"
                            style={{
                              background: orderBadge.bg,
                              color: orderBadge.color,
                            }}
                          >
                            <span
                              className="status-dot"
                              style={{ background: orderBadge.dot }}
                            />
                            {order.status}
                          </span>
                        </div>

                        <div className="mobile-actions">
                          <button className="small-btn">View</button>
                          <button className="small-btn-muted">Update</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {filteredOrders.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <div className="empty-title">No orders found</div>
                <div className="empty-subtitle">Try changing your search or filters</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}


// import { useMemo, useState, type CSSProperties } from 'react';

// type OrderStatus =
//   | 'Pending'
//   | 'Processing'
//   | 'Shipped'
//   | 'Delivered'
//   | 'Cancelled'
//   | 'Returned';

// type PaymentStatus = 'Paid' | 'Pending' | 'Refunded' | 'Failed';

// type Order = {
//   id: number;
//   orderId: string;
//   customer: string;
//   email: string;
//   items: number;
//   total: number;
//   paymentStatus: PaymentStatus;
//   status: OrderStatus;
//   date: string;
//   city: string;
// };

// type OrdersListPageProps = {
//   title: string;
//   subtitle: string;
//   defaultStatus: 'All' | OrderStatus;
// };

// const orders: Order[] = [
//   { id: 1, orderId: 'ORD-1001', customer: 'Aarav Sharma', email: 'aarav@gmail.com', items: 3, total: 2499, paymentStatus: 'Paid', status: 'Pending', date: '26 Mar 2026', city: 'Delhi' },
//   { id: 2, orderId: 'ORD-1002', customer: 'Priya Mehta', email: 'priya@gmail.com', items: 2, total: 1599, paymentStatus: 'Paid', status: 'Processing', date: '25 Mar 2026', city: 'Mumbai' },
//   { id: 3, orderId: 'ORD-1003', customer: 'Rohan Verma', email: 'rohan@gmail.com', items: 1, total: 899, paymentStatus: 'Pending', status: 'Pending', date: '25 Mar 2026', city: 'Pune' },
//   { id: 4, orderId: 'ORD-1004', customer: 'Sneha Kapoor', email: 'sneha@gmail.com', items: 4, total: 4999, paymentStatus: 'Paid', status: 'Shipped', date: '24 Mar 2026', city: 'Bengaluru' },
//   { id: 5, orderId: 'ORD-1005', customer: 'Kabir Singh', email: 'kabir@gmail.com', items: 2, total: 3299, paymentStatus: 'Paid', status: 'Delivered', date: '23 Mar 2026', city: 'Jaipur' },
//   { id: 6, orderId: 'ORD-1006', customer: 'Ananya Rao', email: 'ananya@gmail.com', items: 1, total: 549, paymentStatus: 'Refunded', status: 'Returned', date: '22 Mar 2026', city: 'Hyderabad' },
//   { id: 7, orderId: 'ORD-1007', customer: 'Vikram Das', email: 'vikram@gmail.com', items: 5, total: 7199, paymentStatus: 'Failed', status: 'Cancelled', date: '21 Mar 2026', city: 'Kolkata' },
//   { id: 8, orderId: 'ORD-1008', customer: 'Isha Patel', email: 'isha@gmail.com', items: 2, total: 1899, paymentStatus: 'Paid', status: 'Shipped', date: '20 Mar 2026', city: 'Ahmedabad' },
//   { id: 9, orderId: 'ORD-1009', customer: 'Neel Joshi', email: 'neel@gmail.com', items: 3, total: 2799, paymentStatus: 'Paid', status: 'Delivered', date: '19 Mar 2026', city: 'Surat' },
//   { id: 10, orderId: 'ORD-1010', customer: 'Diya Nair', email: 'diya@gmail.com', items: 1, total: 1299, paymentStatus: 'Pending', status: 'Processing', date: '18 Mar 2026', city: 'Chennai' },
// ];

// const orderStatusConfig: Record<OrderStatus, { bg: string; color: string; dot: string }> = {
//   Pending: { bg: '#fff7ed', color: '#ea580c', dot: '#f97316' },
//   Processing: { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6' },
//   Shipped: { bg: '#ecfeff', color: '#0891b2', dot: '#06b6d4' },
//   Delivered: { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
//   Cancelled: { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
//   Returned: { bg: '#faf5ff', color: '#9333ea', dot: '#a855f7' },
// };

// const paymentStatusConfig: Record<PaymentStatus, { bg: string; color: string }> = {
//   Paid: { bg: '#f0fdf4', color: '#16a34a' },
//   Pending: { bg: '#fffbeb', color: '#d97706' },
//   Refunded: { bg: '#eff6ff', color: '#2563eb' },
//   Failed: { bg: '#fef2f2', color: '#dc2626' },
// };

// export default function OrdersListPage({
//   title,
//   subtitle,
//   defaultStatus,
// }: OrdersListPageProps) {
//   const [search, setSearch] = useState('');
//   const [selectedStatus, setSelectedStatus] = useState<'All' | OrderStatus>(defaultStatus);
//   const [selectedPayment, setSelectedPayment] = useState<'All' | PaymentStatus>('All');
//   const [selectedIds, setSelectedIds] = useState<number[]>([]);

//   const filteredOrders = useMemo(() => {
//     return orders.filter((order) => {
//       const matchesSearch =
//         order.orderId.toLowerCase().includes(search.toLowerCase()) ||
//         order.customer.toLowerCase().includes(search.toLowerCase()) ||
//         order.email.toLowerCase().includes(search.toLowerCase());

//       const matchesStatus = selectedStatus === 'All' || order.status === selectedStatus;
//       const matchesPayment = selectedPayment === 'All' || order.paymentStatus === selectedPayment;

//       return matchesSearch && matchesStatus && matchesPayment;
//     });
//   }, [search, selectedStatus, selectedPayment]);

//   const stats = [
//     {
//       label: 'Total Orders',
//       value: filteredOrders.length,
//       color: '#2563eb',
//       bg: '#eff6ff',
//       icon: '📦',
//     },
//     {
//       label: 'Revenue',
//       value: `₹${filteredOrders.reduce((sum, order) => sum + order.total, 0).toLocaleString()}`,
//       color: '#16a34a',
//       bg: '#f0fdf4',
//       icon: '💰',
//     },
//     {
//       label: 'Paid Orders',
//       value: filteredOrders.filter((order) => order.paymentStatus === 'Paid').length,
//       color: '#0891b2',
//       bg: '#ecfeff',
//       icon: '✅',
//     },
//     {
//       label: 'Returns / Cancels',
//       value: filteredOrders.filter((order) => order.status === 'Returned' || order.status === 'Cancelled').length,
//       color: '#dc2626',
//       bg: '#fef2f2',
//       icon: '↩',
//     },
//   ];

//   const toggleSelect = (id: number) => {
//     setSelectedIds((prev) =>
//       prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
//     );
//   };

//   return (
//     <div style={{ padding: '28px', background: '#f8fafc', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
//         <div>
//           <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h1>
//           <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>{subtitle}</p>
//         </div>

//         <div style={{ display: 'flex', gap: '10px' }}>
//           <button style={secondaryButtonStyle}>Export</button>
//           <button style={primaryButtonStyle}>+ Create Order</button>
//         </div>
//       </div>

//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
//         {stats.map((stat) => (
//           <div
//             key={stat.label}
//             style={{
//               background: '#fff',
//               borderRadius: '14px',
//               padding: '20px',
//               border: '1px solid #f1f5f9',
//               boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
//             }}
//           >
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
//               <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{stat.label}</span>
//               <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                 {stat.icon}
//               </div>
//             </div>
//             <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
//           </div>
//         ))}
//       </div>

//       <div
//         style={{
//           background: '#fff',
//           borderRadius: '14px',
//           padding: '16px 20px',
//           border: '1px solid #f1f5f9',
//           marginBottom: '20px',
//           display: 'flex',
//           gap: '12px',
//           flexWrap: 'wrap',
//           alignItems: 'center',
//         }}
//       >
//         <input
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           placeholder="Search order ID, customer, email..."
//           style={inputStyle}
//         />

//         <select
//           value={selectedStatus}
//           onChange={(e) => setSelectedStatus(e.target.value as 'All' | OrderStatus)}
//           style={selectStyle}
//         >
//           {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'].map((status) => (
//             <option key={status} value={status}>
//               {status}
//             </option>
//           ))}
//         </select>

//         <select
//           value={selectedPayment}
//           onChange={(e) => setSelectedPayment(e.target.value as 'All' | PaymentStatus)}
//           style={selectStyle}
//         >
//           {['All', 'Paid', 'Pending', 'Refunded', 'Failed'].map((status) => (
//             <option key={status} value={status}>
//               {status}
//             </option>
//           ))}
//         </select>
//       </div>

//       {selectedIds.length > 0 && (
//         <div
//           style={{
//             background: '#1e40af',
//             color: '#fff',
//             borderRadius: '10px',
//             padding: '12px 20px',
//             marginBottom: '12px',
//             display: 'flex',
//             alignItems: 'center',
//             gap: '16px',
//           }}
//         >
//           <span style={{ fontSize: '14px', fontWeight: 500 }}>{selectedIds.length} selected</span>
//           <button style={bulkButtonStyle}>Mark Shipped</button>
//           <button style={bulkButtonStyle}>Print Labels</button>
//           <button
//             onClick={() => setSelectedIds([])}
//             style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}
//           >
//             ×
//           </button>
//         </div>
//       )}

//       <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
//         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//           <thead>
//             <tr style={{ background: '#f8fafc' }}>
//               <th style={{ padding: '14px 16px', width: '40px' }}>
//                 <input
//                   type="checkbox"
//                   checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length}
//                   onChange={(e) => setSelectedIds(e.target.checked ? filteredOrders.map((order) => order.id) : [])}
//                 />
//               </th>
//               {['Order ID', 'Customer', 'Date', 'Items', 'Total', 'Payment', 'Status', 'City', 'Actions'].map((head) => (
//                 <th
//                   key={head}
//                   style={{
//                     padding: '14px 16px',
//                     textAlign: 'left',
//                     fontSize: '11px',
//                     fontWeight: 700,
//                     color: '#94a3b8',
//                     textTransform: 'uppercase',
//                     letterSpacing: '0.06em',
//                     whiteSpace: 'nowrap',
//                   }}
//                 >
//                   {head}
//                 </th>
//               ))}
//             </tr>
//           </thead>

//           <tbody>
//             {filteredOrders.map((order) => {
//               const orderBadge = orderStatusConfig[order.status];
//               const paymentBadge = paymentStatusConfig[order.paymentStatus];

//               return (
//                 <tr key={order.id} style={{ borderTop: '1px solid #f8fafc', background: selectedIds.includes(order.id) ? '#eff6ff' : 'transparent' }}>
//                   <td style={{ padding: '14px 16px' }}>
//                     <input
//                       type="checkbox"
//                       checked={selectedIds.includes(order.id)}
//                       onChange={() => toggleSelect(order.id)}
//                     />
//                   </td>

//                   <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#2563eb' }}>
//                     {order.orderId}
//                   </td>

//                   <td style={{ padding: '14px 16px' }}>
//                     <div>
//                       <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{order.customer}</div>
//                       <div style={{ fontSize: '12px', color: '#94a3b8' }}>{order.email}</div>
//                     </div>
//                   </td>

//                   <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>{order.date}</td>
//                   <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0f172a', fontWeight: 600 }}>{order.items}</td>
//                   <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0f172a', fontWeight: 700 }}>₹{order.total.toLocaleString()}</td>

//                   <td style={{ padding: '14px 16px' }}>
//                     <span style={{ background: paymentBadge.bg, color: paymentBadge.color, padding: '5px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>
//                       {order.paymentStatus}
//                     </span>
//                   </td>

//                   <td style={{ padding: '14px 16px' }}>
//                     <span style={{ background: orderBadge.bg, color: orderBadge.color, padding: '5px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
//                       <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: orderBadge.dot, display: 'inline-block' }} />
//                       {order.status}
//                     </span>
//                   </td>

//                   <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>{order.city}</td>

//                   <td style={{ padding: '14px 16px' }}>
//                     <div style={{ display: 'flex', gap: '8px' }}>
//                       <button style={{ background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '7px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
//                         View
//                       </button>
//                       <button style={{ background: '#f8fafc', color: '#475569', border: 'none', borderRadius: '7px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
//                         Update
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>

//         {filteredOrders.length === 0 && (
//           <div style={{ padding: '56px', textAlign: 'center', color: '#94a3b8' }}>
//             <div style={{ fontSize: '42px', marginBottom: '10px' }}>📭</div>
//             <div style={{ fontSize: '16px', fontWeight: 700 }}>No orders found</div>
//             <div style={{ fontSize: '13px', marginTop: '6px' }}>Try changing your search or filters</div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// const primaryButtonStyle: CSSProperties = {
//   padding: '10px 18px',
//   borderRadius: '10px',
//   border: 'none',
//   background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
//   color: '#fff',
//   fontSize: '14px',
//   fontWeight: 600,
//   cursor: 'pointer',
//   boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
// };

// const secondaryButtonStyle: CSSProperties = {
//   padding: '10px 16px',
//   borderRadius: '10px',
//   border: '1.5px solid #e2e8f0',
//   background: '#fff',
//   color: '#374151',
//   fontSize: '14px',
//   fontWeight: 500,
//   cursor: 'pointer',
// };

// const inputStyle: CSSProperties = {
//   flex: 1,
//   minWidth: '240px',
//   padding: '10px 14px',
//   borderRadius: '9px',
//   border: '1.5px solid #e2e8f0',
//   fontSize: '13px',
//   color: '#374151',
//   outline: 'none',
//   background: '#f8fafc',
// };

// const selectStyle: CSSProperties = {
//   padding: '10px 14px',
//   borderRadius: '9px',
//   border: '1.5px solid #e2e8f0',
//   fontSize: '13px',
//   color: '#374151',
//   background: '#f8fafc',
//   cursor: 'pointer',
// };

// const bulkButtonStyle: CSSProperties = {
//   background: 'rgba(255,255,255,0.18)',
//   border: 'none',
//   color: '#fff',
//   padding: '6px 14px',
//   borderRadius: '6px',
//   cursor: 'pointer',
//   fontSize: '13px',
// };
