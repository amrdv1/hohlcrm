"use client";

import { useEffect, useState, useMemo } from "react";
import SiteTab from "@/components/SiteTab";

interface Item {
  id: number;
  name: string;
  investor: string | null;
  size: string;
  quantity: number;
  purchasePrice: number;
  deliveryCost: number;
  salePrice: number;
}

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState<"finance" | "site">("finance");

  useEffect(() => {
    if (localStorage.getItem("crm_token")) setAuthed(true);
    setReady(true);
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [authed]);

  const load = async () => {
    try {
      const r = await fetch("/api/items");
      if (r.ok) setItems(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const d = await r.json();
      if (d.success) {
        localStorage.setItem("crm_token", d.token);
        setAuthed(true);
      } else setErr("Невірний пароль");
    } catch { setErr("Помилка"); }
    finally { setBusy(false); }
  };

  const logout = () => {
    localStorage.removeItem("crm_token");
    setAuthed(false);
    setPw("");
  };

  const del = async (id: number) => {
    if (!confirm("Видалити?")) return;
    await fetch(`/api/items?id=${id}`, { method: "DELETE" });
    setItems(items.filter((i) => i.id !== id));
  };

  const $ = (v: number) => "$" + Math.round(v).toLocaleString("uk-UA");

  const list = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    return items.filter(i =>
      i.name.toLowerCase().includes(s) ||
      (i.investor && i.investor.toLowerCase().includes(s))
    );
  }, [items, q]);

  const k = useMemo(() => {
    const n = items.length;
    const qty = items.reduce((s, i) => s + i.quantity, 0);
    const rev = items.reduce((s, i) => s + i.salePrice * i.quantity, 0);
    const cost = items.reduce((s, i) => s + (i.purchasePrice + i.deliveryCost) * i.quantity, 0);
    const profit = rev - cost;
    return { n, qty, rev, profit };
  }, [items]);

  if (!ready) return null;

  // LOGIN
  if (!authed) return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={login}>
        <h1>HohlCRM</h1>
        <p>Введіть пароль для входу</p>
        {err && <div className="login-err">{err}</div>}
        <label>Пароль</label>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Пароль" autoFocus />
        <button type="submit" disabled={busy || !pw}>{busy ? "..." : "Увійти"}</button>
      </form>
    </div>
  );

  // DASHBOARD
  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>HohlCRM</h1>
        </div>
        <div className="header-right">
          <button className="hbtn" onClick={load}>⟳ Оновити</button>
          <button className="hbtn hbtn-logout" onClick={logout}>Вийти</button>
        </div>
      </header>

      <div className="content">
        <div className="tabs" style={{display: 'flex', gap: 20, marginBottom: 20}}>
          <button 
            className={`tab-btn ${activeTab === 'finance' ? 'active' : ''}`}
            onClick={() => setActiveTab('finance')}
            style={{padding: '10px 20px', border: 'none', background: activeTab === 'finance' ? '#fff' : 'transparent', borderRadius: 8, cursor: 'pointer', fontWeight: activeTab === 'finance' ? 600 : 400, boxShadow: activeTab === 'finance' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'}}
          >
            Фінанси / Склад
          </button>
          <button 
            className={`tab-btn ${activeTab === 'site' ? 'active' : ''}`}
            onClick={() => setActiveTab('site')}
            style={{padding: '10px 20px', border: 'none', background: activeTab === 'site' ? '#fff' : 'transparent', borderRadius: 8, cursor: 'pointer', fontWeight: activeTab === 'site' ? 600 : 400, boxShadow: activeTab === 'site' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'}}
          >
            Сайт Holy Drip
          </button>
        </div>

        {activeTab === 'finance' && (
          <>
            <div className="stats">
              <div className="stat">
                <div className="stat-label">Товарів</div>
                <div className="stat-val">{k.n}</div>
                <div className="stat-sub">{k.qty} шт.</div>
              </div>
              <div className="stat">
                <div className="stat-label">Виручка</div>
                <div className="stat-val">{$(k.rev)}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Прибуток</div>
                <div className="stat-val">{$(k.profit)}</div>
                <div className={`stat-sub ${k.profit >= 0 ? "green" : "red"}`}>
                  {k.rev > 0 ? ((k.profit / k.rev) * 100).toFixed(1) + "%" : "0%"} маржа
                </div>
              </div>
              <div className="stat">
                <div className="stat-label">Юля (40%)</div>
                <div className="stat-val">{$(k.profit * 0.4)}</div>
              </div>
            </div>

        <div className="tcard">
          <div className="tcard-top">
            <div style={{display:"flex",alignItems:"center"}}>
              <h2>Товари</h2>
              <span>{list.length}</span>
            </div>
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input placeholder="Пошук..." value={q} onChange={e => setQ(e.target.value)} />
            </div>
          </div>

          <div className="tbl-wrap">
            {loading ? (
              <div className="loading-wrap">Завантаження...</div>
            ) : list.length === 0 ? (
              <div className="empty-wrap">
                <h3>{q ? "Нічого не знайдено" : "Немає товарів"}</h3>
                <p>{q ? "Спробуйте інший запит" : <>Додайте товар через бота: <code>/add</code></>}</p>
              </div>
            ) : (
              <table>
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
                    <th>Юля 40%</th>
                    <th>Оренда 10%</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(i => {
                    const p = (i.salePrice - i.purchasePrice - i.deliveryCost) * i.quantity;
                    return (
                      <tr key={i.id}>
                        <td className="n">{i.name}</td>
                        <td>{i.investor || "—"}</td>
                        <td><span className="tag">{i.size}</span></td>
                        <td>{i.quantity}</td>
                        <td>{$(i.purchasePrice)}</td>
                        <td>{$(i.deliveryCost)}</td>
                        <td>{$(i.salePrice)}</td>
                        <td className={p >= 0 ? "green" : "red"}>{$(p)}</td>
                        <td className="pink">{$(p * 0.4)}</td>
                        <td className="amber">{$(p * 0.1)}</td>
                        <td><button className="del-btn" onClick={() => del(i.id)}>✕</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
          </>
        )}

        {activeTab === 'site' && (
          <SiteTab />
        )}
      </div>
    </div>
  );
}
