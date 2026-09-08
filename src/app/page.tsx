"use client";

import { useEffect, useState } from 'react';
import './globals.css';

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
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;
    try {
      await fetch(`/api/items?id=${id}`, { method: 'DELETE' });
      setItems(items.filter((i) => i.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">CRM | Учет товаров</h1>
        <button className="button button-primary" onClick={fetchItems}>Обновить</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Загрузка данных...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <h3>Нет данных</h3>
            <p>Добавьте первый товар через Telegram-бота (команда /add)</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Инвестор</th>
                <th>Размер</th>
                <th>Кол-во</th>
                <th>Закупка</th>
                <th>Доставка</th>
                <th>Продажа</th>
                <th>Ч. Прибыль</th>
                <th className="profit-yulia">Юля (-40%)</th>
                <th className="profit-rent">Аренда (-10%)</th>
                <th className="profit-site">Сайт (0%)</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const netProfit = item.salePrice - item.purchasePrice - item.deliveryCost;
                const profitYulia = netProfit * 0.6;
                const profitRent = netProfit * 0.9;
                const profitSite = netProfit * 1.0;

                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.investor || '-'}</td>
                    <td>{item.size}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.purchasePrice)}</td>
                    <td>{formatCurrency(item.deliveryCost)}</td>
                    <td>{formatCurrency(item.salePrice)}</td>
                    <td className="profit-col profit-base">{formatCurrency(netProfit)}</td>
                    <td className="profit-col profit-yulia">{formatCurrency(profitYulia)}</td>
                    <td className="profit-col profit-rent">{formatCurrency(profitRent)}</td>
                    <td className="profit-col profit-site">{formatCurrency(profitSite)}</td>
                    <td>
                      <button 
                        className="button button-danger"
                        onClick={() => handleDelete(item.id)}
                      >
                        Удалить
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
  );
}
