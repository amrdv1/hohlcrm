import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

async function tg(method: string, body: object) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function send(chatId: number, text: string, keyboard?: string[][]) {
  const extra: Record<string, unknown> = { chat_id: chatId, text, parse_mode: 'HTML' };
  if (keyboard) {
    extra.reply_markup = {
      keyboard: keyboard.map(row => row.map(t => ({ text: t }))),
      resize_keyboard: true,
      one_time_keyboard: true,
    };
  }
  await tg('sendMessage', extra);
}

async function removeKb(chatId: number, text: string) {
  await tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: { remove_keyboard: true },
  });
}

// Wizard state
const wizard = new Map<number, { step: number; data: Record<string, string> }>();

const FIELDS = ['name', 'investor', 'size', 'quantity', 'purchasePrice', 'deliveryCost', 'salePrice'] as const;

const Q: Record<string, string> = {
  name:          '📝 Назва товару:',
  investor:      '👤 Інвестор (або — якщо нема):',
  size:          '📏 Розмір:',
  quantity:      '🔢 Кількість:',
  purchasePrice: '💵 Ціна закупки ($):',
  deliveryCost:  '🚚 Доставка ($):',
  salePrice:     '🏷 Ціна продажу ($):',
};

type ItemData = {
  id: number;
  name: string;
  investor: string | null;
  size: string;
  quantity: number;
  purchasePrice: number;
  deliveryCost: number;
  salePrice: number;
};

async function handle(chatId: number, text: string) {
  // --- Commands ---
  if (text === '/start' || text === '🏠 Меню') {
    wizard.delete(chatId);
    await send(chatId,
      '👋 <b>HohlCRM Бот</b>\n\nОберіть дію:',
      [['➕ Додати товар', '📋 Останні товари'], ['📊 Статистика']]
    );
    return;
  }

  if (text === '/cancel' || text === '❌ Скасувати') {
    wizard.delete(chatId);
    await send(chatId, '❌ Скасовано', [['🏠 Меню']]);
    return;
  }

  if (text === '/add' || text === '➕ Додати товар') {
    wizard.set(chatId, { step: 0, data: {} });
    await send(chatId, `➕ <b>Новий товар</b>\n\n${Q[FIELDS[0]]}`, [['❌ Скасувати']]);
    return;
  }

  if (text === '/list' || text === '📋 Останні товари') {
    wizard.delete(chatId);
    try {
      const items: ItemData[] = await prisma.item.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
      if (!items.length) {
        await send(chatId, '📋 Порожньо. Натисніть ➕ щоб додати', [['➕ Додати товар', '🏠 Меню']]);
        return;
      }
      let msg = `📋 <b>Останні ${items.length} товарів:</b>\n`;
      items.forEach((it: ItemData, idx: number) => {
        const p = it.salePrice - it.purchasePrice - it.deliveryCost;
        msg += `\n${idx + 1}. <b>${it.name}</b> — ${it.size}`;
        msg += `\n    💵 ${it.purchasePrice}→${it.salePrice}  📈 <b>$${p.toFixed(0)}</b>`;
      });
      await send(chatId, msg, [['➕ Додати товар', '🏠 Меню']]);
    } catch (e) {
      console.error(e);
      await send(chatId, '❌ Помилка', [['🏠 Меню']]);
    }
    return;
  }

  if (text === '/stats' || text === '📊 Статистика') {
    wizard.delete(chatId);
    try {
      const items: ItemData[] = await prisma.item.findMany();
      const n = items.length;
      const qty = items.reduce((s: number, i: ItemData) => s + i.quantity, 0);
      const rev = items.reduce((s: number, i: ItemData) => s + i.salePrice * i.quantity, 0);
      const cost = items.reduce((s: number, i: ItemData) => s + (i.purchasePrice + i.deliveryCost) * i.quantity, 0);
      const profit = rev - cost;

      await send(chatId,
        `📊 <b>Статистика</b>\n\n` +
        `📦 Товарів: <b>${n}</b> (${qty} шт)\n` +
        `💰 Виручка: <b>$${rev.toFixed(0)}</b>\n` +
        `📈 Прибуток: <b>$${profit.toFixed(0)}</b>\n` +
        `👩 Юля (40%): <b>$${(profit * 0.4).toFixed(0)}</b>\n` +
        `🏠 Оренда (10%): <b>$${(profit * 0.1).toFixed(0)}</b>`,
        [['➕ Додати товар', '📋 Останні товари'], ['🏠 Меню']]
      );
    } catch (e) {
      console.error(e);
      await send(chatId, '❌ Помилка', [['🏠 Меню']]);
    }
    return;
  }

  // --- Wizard ---
  const st = wizard.get(chatId);
  if (!st) {
    await send(chatId, 'Натисніть кнопку нижче 👇', [['➕ Додати товар', '📋 Останні товари'], ['📊 Статистика']]);
    return;
  }

  const field = FIELDS[st.step];

  // Validate numbers
  if (['quantity', 'purchasePrice', 'deliveryCost', 'salePrice'].includes(field)) {
    const num = parseFloat(text.replace(',', '.'));
    if (isNaN(num) || num < 0) {
      await send(chatId, '⚠️ Введіть число', [['❌ Скасувати']]);
      return;
    }
    st.data[field] = String(num);
  } else {
    st.data[field] = text;
  }

  st.step++;

  // More steps?
  if (st.step < FIELDS.length) {
    wizard.set(chatId, st);
    await send(chatId, Q[FIELDS[st.step]], [['❌ Скасувати']]);
    return;
  }

  // Done — save
  try {
    const d = st.data;
    const item = await prisma.item.create({
      data: {
        name: d.name,
        investor: d.investor === '-' || d.investor === '—' ? null : d.investor,
        size: d.size,
        quantity: parseInt(d.quantity),
        purchasePrice: parseFloat(d.purchasePrice),
        deliveryCost: parseFloat(d.deliveryCost),
        salePrice: parseFloat(d.salePrice),
      },
    });

    const p = (item.salePrice - item.purchasePrice - item.deliveryCost) * item.quantity;

    await send(chatId,
      `✅ <b>Додано!</b>\n\n` +
      `📦 ${item.name} (${item.size})\n` +
      `👤 ${item.investor || '—'}\n` +
      `🔢 ${item.quantity} шт\n` +
      `💵 Закупка $${item.purchasePrice} + Доставка $${item.deliveryCost} = Собівартість $${item.purchasePrice + item.deliveryCost}\n` +
      `🏷 Продаж: $${item.salePrice}\n` +
      `📈 Прибуток: <b>$${p.toFixed(0)}</b>`,
      [['➕ Ще один', '📋 Список'], ['📊 Статистика', '🏠 Меню']]
    );
  } catch (e) {
    console.error('DB error:', e);
    await send(chatId, '❌ Помилка збереження', [['🏠 Меню']]);
  }

  wizard.delete(chatId);
}

// --- Webhook ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const msg = body.message;
    if (msg?.text) await handle(msg.chat.id, msg.text.trim());
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Webhook error:', e);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
