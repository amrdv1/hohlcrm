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
                <th style={{ minWidth: 280 }}>Товари</th>
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
                    <td style={{ minWidth: 280, maxWidth: 360, whiteSpace: "normal" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {o.items?.map((item, idx) => {
                          const rawName = item.product?.name || "Товар";
                          // Clean leading/trailing spaces and leading bullets
                          const cleanName = rawName.trim().replace(/^[•\s-]+/, "").trim();
                          const img = item.product?.images?.[0];
                          const size = (item.size || "").trim().toUpperCase();

                          return (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                paddingBottom: (o.items && o.items.length > 1 && idx < o.items.length - 1) ? 8 : 0,
                                borderBottom: (o.items && o.items.length > 1 && idx < o.items.length - 1) ? "1px dashed #f0f0f0" : "none"
                              }}
                            >
                              {img ? (
                                <img
                                  src={img}
                                  alt={cleanName}
                                  style={{
                                    width: 40,
                                    height: 40,
                                    objectFit: "cover",
                                    borderRadius: 6,
                                    border: "1px solid #e5e5e5",
                                    flexShrink: 0
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: 40,
                                    height: 40,
                                    background: "#f3f4f6",
                                    borderRadius: 6,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 16,
                                    color: "#9ca3af",
                                    flexShrink: 0
                                  }}
                                >
                                  📦
                                </div>
                              )}
                              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#111",
                                    lineHeight: 1.35
                                  }}
                                >
                                  {cleanName}
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  {size && size !== "НЕ ВКАЗАНО" && (
                                    <span
                                      style={{
                                        background: "#f3f4f6",
                                        color: "#374151",
                                        padding: "1px 6px",
                                        borderRadius: 4,
                                        fontSize: 11,
                                        fontWeight: 600
                                      }}
                                    >
                                      {size}
                                    </span>
                                  )}
                                  <span style={{ fontSize: 11, color: "#6b7280" }}>
                                    × {item.quantity} шт.
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
