"use client";

import { useEffect, useState, useMemo } from "react";

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

/* ═══ SVG Icons ═══ */
const Icon = {
  grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  box: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  bot: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  empty: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12h4"/><path d="M10 16h4"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem("crm_token");
    if (token) setAuthed(true);
    setAuthChecked(true);
  }, []);

  // Fetch items when authed
  useEffect(() => {
    if (authed) fetchItems();
  }, [authed]);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/items");
      if (res.ok) setItems(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("crm_token", data.token);
        setAuthed(true);
      } else {
        setLoginError(data.error || "Невірний пароль");
      }
    } catch {
      setLoginError("Помилка з'єднання");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("crm_token");
    setAuthed(false);
    setPassword("");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Видалити цей товар?")) return;
    try {
      await fetch(`/api/items?id=${id}`, { method: "DELETE" });
      setItems(items.filter((i) => i.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const fmt = (v: number) => new Intl.NumberFormat("uk-UA").format(Math.round(v));
  const $ = (v: number) => `$${fmt(v)}`;

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.investor && i.investor.toLowerCase().includes(q)) ||
        i.size.toLowerCase().includes(q)
    );
  }, [items, search]);

  const kpi = useMemo(() => {
    const cnt = items.length;
    const qty = items.reduce((s, i) => s + i.quantity, 0);
    const rev = items.reduce((s, i) => s + i.salePrice * i.quantity, 0);
    const cost = items.reduce((s, i) => s + (i.purchasePrice + i.deliveryCost) * i.quantity, 0);
    const profit = rev - cost;
    const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : "0";
    return { cnt, qty, rev, profit, margin };
  }, [items]);

  // ── Don't render until auth check is done ──
  if (!authChecked) return null;

  // ══════════════════════════════════════════
  // LOGIN PAGE
  // ══════════════════════════════════════════
  if (!authed) {
    return (
      <div className="login-page">
        <div className="login-box">
          <form className="login-card" onSubmit={handleLogin}>
            <div className="login-logo">
              <div className="login-logo-icon">H</div>
              <span className="login-logo-text">HohlCRM</span>
            </div>
            <p className="login-subtitle">Введіть пароль для входу в систему</p>
            {loginError && <div className="login-error">{loginError}</div>}
            <div className="login-field">
              <label className="login-label">Пароль</label>
              <input
                className="login-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <button className="login-btn" type="submit" disabled={loginLoading || !password}>
              {loginLoading ? "Вхід..." : "Увійти"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════
  return (
    <div className="crm-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sb-logo">
          <div className="sb-logo-icon">H</div>
          <span className="sb-logo-text">HohlCRM</span>
        </div>
        <nav className="sb-nav">
          <span className="sb-section">Меню</span>
          <button className="sb-item active">{Icon.grid} Дашборд</button>
          <button className="sb-item">{Icon.box} Товари</button>
          <button className="sb-item">{Icon.users} Інвестори</button>
          <span className="sb-section">Інструменти</span>
          <button className="sb-item">{Icon.bot} Telegram Бот</button>
          <button className="sb-item">{Icon.settings} Налаштування</button>
        </nav>
        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-avatar">A</div>
            <div>
              <div className="sb-user-name">Адмін</div>
              <div className="sb-user-role">Власник</div>
            </div>
          </div>
          <button className="sb-logout" onClick={handleLogout}>
            {Icon.logout} Вийти
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <header className="topbar">
          <h1>Дашборд</h1>
          <button className="btn" onClick={fetchItems}>
            {Icon.refresh} Оновити
          </button>
        </header>

        <div className="page">
          {/* KPI */}
          <div className="kpi-row">
            <div className="kpi">
              <div className="kpi-top">
                <span className="kpi-label">Товарів</span>
                <span className="kpi-dot blue" />
              </div>
              <div className="kpi-val">{fmt(kpi.cnt)}</div>
              <div className="kpi-sub">{fmt(kpi.qty)} шт. загалом</div>
            </div>
            <div className="kpi">
              <div className="kpi-top">
                <span className="kpi-label">Виручка</span>
                <span className="kpi-dot green" />
              </div>
              <div className="kpi-val">{$(kpi.rev)}</div>
              <div className="kpi-sub">загальна сума продажів</div>
            </div>
            <div className="kpi">
              <div className="kpi-top">
                <span className="kpi-label">Прибуток</span>
                <span className="kpi-dot amber" />
              </div>
              <div className="kpi-val">{$(kpi.profit)}</div>
              <div className={`kpi-sub ${Number(kpi.margin) >= 0 ? "green" : "red"}`}>
                {kpi.margin}% маржа
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-top">
                <span className="kpi-label">Частка Юлі</span>
                <span className="kpi-dot purple" />
              </div>
              <div className="kpi-val">{$(kpi.profit * 0.6)}</div>
              <div className="kpi-sub">60% від прибутку</div>
            </div>
          </div>

          {/* TABLE */}
          <div className="tbl-card">
            <div className="tbl-top">
              <div className="tbl-top-left">
                <span className="tbl-title">Товари</span>
                <span className="tbl-badge">{filtered.length}</span>
              </div>
              <div className="tbl-search">
                {Icon.search}
                <input
                  placeholder="Пошук..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="tbl-wrap">
              {loading ? (
                <div className="state-wrap">
                  <div className="spinner" />
                  <span className="state-text">Завантаження...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="state-wrap">
                  <div className="empty-icon">{Icon.empty}</div>
                  <div className="empty-title">
                    {search ? "Нічого не знайдено" : "Немає товарів"}
                  </div>
                  <div className="empty-desc">
                    {search ? (
                      "Спробуйте інший запит"
                    ) : (
                      <>
                        Додайте перший товар через бота:{" "}
                        <span className="empty-code">/add</span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <table className="dtbl">
                  <thead>
                    <tr>
                      <th>Назва</th>
                      <th>Інвестор</th>
                      <th>Розмір</th>
                      <th>К-сть</th>
                      <th>Закупка</th>
                      <th>Доставка</th>
                      <th>Продаж</th>
                      <th>Прибуток</th>
                      <th>Юля 60%</th>
                      <th>Оренда 10%</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const profit =
                        (item.salePrice - item.purchasePrice - item.deliveryCost) *
                        item.quantity;
                      return (
                        <tr key={item.id}>
                          <td className="c-name">{item.name}</td>
                          <td>
                            {item.investor ? (
                              <span className="c-investor">
                                <span className="c-investor-dot" />
                                {item.investor}
                              </span>
                            ) : (
                              <span style={{ color: "var(--t3)" }}>—</span>
                            )}
                          </td>
                          <td><span className="c-size">{item.size}</span></td>
                          <td className="c-money">{item.quantity}</td>
                          <td className="c-money">{$(item.purchasePrice)}</td>
                          <td className="c-money">{$(item.deliveryCost)}</td>
                          <td className="c-money">{$(item.salePrice)}</td>
                          <td className={`c-profit ${profit >= 0 ? "pos" : "neg"}`}>
                            {$(profit)}
                          </td>
                          <td className="c-share pink">{$(profit * 0.6)}</td>
                          <td className="c-share amber">{$(profit * 0.1)}</td>
                          <td>
                            <button className="btn-del" onClick={() => handleDelete(item.id)} title="Видалити">
                              {Icon.trash}
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
