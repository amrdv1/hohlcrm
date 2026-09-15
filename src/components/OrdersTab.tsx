"use client";

import { useEffect, useState, useMemo } from "react";

interface OrderItem {
  id: string;
  productId: string;
  size: string;
  quantity: number;
  price: number;
  product?: {
    name: string;
    images?: string[];
  };
}

interface Order {
  id: string;
  name: string;
  phone: string;
  telegram?: string;
  address?: string;
  totalPrice: number;
  status: "PENDING" | "PAID" | "CONFIRMED" | "SHIPPED" | "FAILED";
  createdAt: string;
  items: OrderItem[];
}

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error("Failed to load orders:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Не вдалося оновити статус");
      }

      const updated = await res.json();
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: updated.status } : o))
      );
    } catch (err: any) {
      alert(err.message || "Помилка при зміні статусу");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
      if (!matchesStatus) return false;

      if (!q.trim()) return true;
      const query = q.toLowerCase();
      return (
        o.id.toLowerCase().includes(query) ||
        o.name.toLowerCase().includes(query) ||
        o.phone.toLowerCase().includes(query) ||
        (o.telegram && o.telegram.toLowerCase().includes(query)) ||
        (o.address && o.address.toLowerCase().includes(query))
      );
    });
  }, [orders, q, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return { label: "Оплачено", bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" };
      case "CONFIRMED":
        return { label: "Підтверджено", bg: "#f0f9ff", color: "#0284c7", border: "#bae6fd" };
      case "SHIPPED":
        return { label: "Відправлено", bg: "#eef2ff", color: "#4f46e5", border: "#c7d2fe" };
      case "FAILED":
        return { label: "Скасовано", bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
      case "PENDING":
      default:
        return { label: "Очікує оплати", bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
    }
  };

  return (
    <div className="tcard">
      <div className="tcard-top" style={{ flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2>Замовлення клієнтів</h2>
          <span>{filteredOrders.length}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Status filter tabs */}
          <div style={{ display: "flex", gap: 6, background: "#f5f5f5", padding: 3, borderRadius: 6 }}>
            {["ALL", "PENDING", "PAID", "CONFIRMED", "SHIPPED", "FAILED"].map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: statusFilter === st ? 600 : 400,
                  border: "none",
                  background: statusFilter === st ? "#fff" : "transparent",
                  color: statusFilter === st ? "#111" : "#777",
                  borderRadius: 4,
                  cursor: "pointer",
                  boxShadow: statusFilter === st ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                }}
              >
                {st === "ALL" ? "Всі" : getStatusBadge(st).label}
              </button>
            ))}
          </div>

          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              placeholder="Пошук замовлень..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>

          <button className="hbtn" onClick={fetchOrders} style={{ fontSize: 12, padding: "6px 12px" }}>
            ⟳ Оновити
          </button>
        </div>
      </div>

      <div className="tbl-wrap">
        {loading ? (
          <div className="loading-wrap" style={{ padding: 40, textAlign: "center", color: "#888" }}>
            Завантаження замовлень з сервера...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-wrap" style={{ padding: 40, textAlign: "center", color: "#888" }}>
            <h3>Немає замовлень за вашим запитом</h3>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Дата</th>
                <th>Клієнт</th>
                <th>Контакти</th>
                <th>Доставка</th>
                <th>Товари</th>
                <th>Сума</th>
                <th>Статус</th>
                <th>Змінити статус</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(o => {
                const badge = getStatusBadge(o.status);
                const isUpdating = updatingId === o.id;

                return (
                  <tr key={o.id}>
                    <td>
                      <code style={{ fontSize: 11, background: "#f5f5f5", padding: "2px 5px", borderRadius: 4 }}>
                        #{o.id.slice(0, 8)}
                      </code>
                    </td>
                    <td style={{ fontSize: 12, color: "#666" }}>
                      {new Date(o.createdAt).toLocaleString("uk-UA", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td>
                      <strong style={{ color: "#111" }}>{o.name}</strong>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <a
                          href={`tel:${o.phone}`}
                          style={{ color: "#2563eb", textDecoration: "none", fontSize: 12 }}
                        >
                          📞 {o.phone}
                        </a>
                        {o.telegram && (
                          <a
                            href={`https://t.me/${o.telegram.replace('@', '')}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#0284c7", textDecoration: "none", fontSize: 12 }}
                          >
                            💬 {o.telegram}
                          </a>
                        )}
                      </div>
                    </td>
                    <td style={{ maxWidth: 180, whiteSpace: "normal", fontSize: 12, color: "#555" }}>
                      {o.address || "—"}
                    </td>
                    <td style={{ maxWidth: 220, whiteSpace: "normal" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {o.items?.map((item, idx) => (
                          <div key={idx} style={{ fontSize: 12, color: "#333" }}>
                            • <strong>{item.product?.name || "Товар"}</strong> ({item.size}) × {item.quantity}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: 14, color: "#111" }}>{o.totalPrice} ₴</strong>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td>
                      <select
                        disabled={isUpdating}
                        value={o.status}
                        onChange={e => handleStatusChange(o.id, e.target.value)}
                        style={{
                          padding: "5px 8px",
                          fontSize: 12,
                          borderRadius: 6,
                          border: "1px solid #ddd",
                          background: isUpdating ? "#f3f4f6" : "#fff",
                          cursor: isUpdating ? "wait" : "pointer",
                          outline: "none"
                        }}
                      >
                        <option value="PENDING">⏳ Очікує оплати</option>
                        <option value="PAID">💰 Оплачено</option>
                        <option value="CONFIRMED">✅ Підтверджено</option>
                        <option value="SHIPPED">🚚 Відправлено</option>
                        <option value="FAILED">❌ Скасовано</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
