"use client";

import { useEffect, useState, useMemo } from 'react';

interface Item {
  id: number;
  name: string;
  investor: string | null;
  size: string;
  quantity: number;
  purchasePrice: number;
  deliveryCost: number;
  salePrice: number;
  createdAt: string;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Видалити цей товар?')) return;
    try {
      await fetch(`/api/items?id=${id}`, { method: 'DELETE' });
      setItems(items.filter((i) => i.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const fmt = (val: number) =>
    new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  const fmtCur = (val: number) => `$${fmt(val)}`;

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.investor && i.investor.toLowerCase().includes(q)) ||
        i.size.toLowerCase().includes(q)
    );
  }, [items, search]);

  // KPI calculations
  const kpi = useMemo(() => {
    const totalItems = items.length;
    const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
    const totalRevenue = items.reduce((s, i) => s + i.salePrice * i.quantity, 0);
    const totalCost = items.reduce(
      (s, i) => s + (i.purchasePrice + i.deliveryCost) * i.quantity,
      0
    );
    const totalProfit = totalRevenue - totalCost;
    return { totalItems, totalQuantity, totalRevenue, totalProfit };
  }, [items]);

  return (
    <div className="crm-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">H</div>
          <span className="sidebar-logo-text">HohlCRM</span>
          <span className="sidebar-logo-badge">v1.0</span>
        </div>
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Меню</span>
          <button className="sidebar-link active">
            <span className="sidebar-link-icon">📊</span>
            Дашборд
          </button>
          <button className="sidebar-link">
            <span className="sidebar-link-icon">📦</span>
            Товари
          </button>
          <button className="sidebar-link">
            <span className="sidebar-link-icon">👥</span>
            Інвестори
          </button>
          <span className="sidebar-section-label">Інструменти</span>
          <button className="sidebar-link">
            <span className="sidebar-link-icon">🤖</span>
            Telegram Бот
          </button>
          <button className="sidebar-link">
            <span className="sidebar-link-icon">⚙️</span>
            Налаштування
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">A</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">Адмін</span>
              <span className="sidebar-user-role">Власник</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        {/* TOP BAR */}
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">Дашборд</h1>
          </div>
          <div className="topbar-right">
            <button className="topbar-btn" onClick={fetchItems}>
              <span className="topbar-btn-icon">🔄</span>
              Оновити
            </button>
          </div>
        </header>

        {/* PAGE */}
        <div className="page-content">
          {/* KPI CARDS */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Всього товарів</span>
                <div className="kpi-icon blue">📦</div>
              </div>
              <div className="kpi-value">{fmt(kpi.totalItems)}</div>
              <div className="kpi-change positive">
                {fmt(kpi.totalQuantity)} шт. загалом
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Загальна виручка</span>
                <div className="kpi-icon green">💰</div>
              </div>
              <div className="kpi-value">{fmtCur(kpi.totalRevenue)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Чистий прибуток</span>
                <div className="kpi-icon orange">📈</div>
              </div>
              <div className="kpi-value">{fmtCur(kpi.totalProfit)}</div>
              <div className={`kpi-change ${kpi.totalProfit >= 0 ? 'positive' : 'negative'}`}>
                {kpi.totalRevenue > 0
                  ? `${((kpi.totalProfit / kpi.totalRevenue) * 100).toFixed(1)}% маржа`
                  : '—'}
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-label">Частка Юлі (60%)</span>
                <div className="kpi-icon purple">👩</div>
              </div>
              <div className="kpi-value">{fmtCur(kpi.totalProfit * 0.6)}</div>
            </div>
          </div>

          {/* TABLE */}
          <div className="table-section">
            <div className="table-header">
              <div className="table-header-left">
                <span className="table-title">Список товарів</span>
                <span className="table-count">{filteredItems.length}</span>
              </div>
              <div className="table-search">
                <span className="table-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Пошук за назвою, інвестором..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="table-wrap">
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner" />
                  <span className="loading-text">Завантаження даних...</span>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <div className="empty-title">
                    {search ? 'Нічого не знайдено' : 'Немає даних'}
                  </div>
                  <div className="empty-desc">
                    {search
                      ? 'Спробуйте інший пошуковий запит'
                      : <>Додайте перший товар через Telegram-бота, відправивши команду <span className="empty-code">/add</span></>}
                  </div>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Назва</th>
                      <th>Інвестор</th>
                      <th>Розмір</th>
                      <th>Кількість</th>
                      <th>Закупка</th>
                      <th>Доставка</th>
                      <th>Продаж</th>
                      <th>Прибуток</th>
                      <th>Юля (60%)</th>
                      <th>Оренда (10%)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const netProfit =
                        (item.salePrice - item.purchasePrice - item.deliveryCost) *
                        item.quantity;
                      const profitYulia = netProfit * 0.6;
                      const profitRent = netProfit * 0.1;

                      return (
                        <tr key={item.id}>
                          <td className="cell-name">{item.name}</td>
                          <td>
                            {item.investor ? (
                              <span className="cell-investor">
                                <span className="investor-dot" />
                                {item.investor}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                            )}
                          </td>
                          <td>
                            <span className="cell-badge size">{item.size}</span>
                          </td>
                          <td className="cell-money">{item.quantity}</td>
                          <td className="cell-money">{fmtCur(item.purchasePrice)}</td>
                          <td className="cell-money">{fmtCur(item.deliveryCost)}</td>
                          <td className="cell-money">{fmtCur(item.salePrice)}</td>
                          <td
                            className={`cell-profit ${netProfit >= 0 ? 'positive' : 'negative'}`}
                          >
                            {fmtCur(netProfit)}
                          </td>
                          <td className="cell-share yulia">{fmtCur(profitYulia)}</td>
                          <td className="cell-share rent">{fmtCur(profitRent)}</td>
                          <td>
                            <button
                              className="btn-delete"
                              onClick={() => handleDelete(item.id)}
                              title="Видалити"
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
