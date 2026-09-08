import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Item = { id: number; name: string; investor: string | null; size: string; quantity: number; purchasePrice: number; deliveryCost: number; salePrice: number; createdAt: Date; updatedAt: Date };

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// ─── Helpers ───────────────────────────────────────────
async function sendMessage(chatId: number, text: string, extra?: object) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra }),
  });
}

// Wizard steps
const STEPS = ['name', 'investor', 'size', 'quantity', 'purchasePrice', 'deliveryCost', 'salePrice'] as const;

const STEP_PROMPTS: Record<string, string> = {
  name:          '📝 Введіть <b>назву товару</b>:',
  investor:      '👤 Введіть <b>ім\'я інвестора</b> (або «-» якщо немає):',
  size:          '📏 Введіть <b>розміри</b>:',
  quantity:      '🔢 Введіть <b>кількість</b> (число):',
  purchasePrice: '💵 Введіть <b>ціну закупки</b> (число):',
  deliveryCost:  '🚚 Введіть <b>вартість доставки</b> (число):',
  salePrice:     '🏷 Введіть <b>ціну продажу</b> (число):',
};

// We store wizard state in a simple DB table.
// To avoid creating a new table, we use a global Map as a short-lived cache.
// On serverless, each invocation shares the same process for a few minutes,
// but we also persist to a dedicated table for reliability.

// Since we want to avoid schema changes, let's use a pragmatic approach:
// Store wizard state as JSON in a separate lightweight model.
// But we don't have that table yet — let's use the simplest possible approach:
// a global in-memory map that works because Vercel reuses the same
// Lambda container for rapid sequential messages from the same user.
// For extra reliability, we persist state via Vercel KV or just accept
// that if the container dies mid-wizard, user restarts with /add.

const wizardState = new Map<number, { step: number; data: Record<string, string> }>();

async function handleMessage(chatId: number, text: string) {
  // /cancel
  if (text === '/cancel') {
    wizardState.delete(chatId);
    await sendMessage(chatId, '❌ Додавання скасовано.');
    return;
  }

  // /start
  if (text === '/start') {
    wizardState.delete(chatId);
    await sendMessage(
      chatId,
      '👋 Привіт! Я бот для додавання товарів у CRM.\n\n' +
      'Доступні команди:\n' +
      '/add — додати новий товар\n' +
      '/list — останні 5 товарів\n' +
      '/stats — загальна статистика\n' +
      '/cancel — скасувати додавання'
    );
    return;
  }

  // /add — start wizard
  if (text === '/add') {
    wizardState.set(chatId, { step: 0, data: {} });
    await sendMessage(chatId, `📦 <b>Додавання нового товару</b>\n\n${STEP_PROMPTS[STEPS[0]]}`);
    return;
  }

  // /list
  if (text === '/list') {
    try {
      const items = await prisma.item.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      if (items.length === 0) {
        await sendMessage(chatId, '📋 Список товарів порожній. Додайте перший через /add');
        return;
      }
      let msg = '📋 <b>Останні товари:</b>\n\n';
      items.forEach((item: Item, i: number) => {
        const profit = item.salePrice - item.purchasePrice - item.deliveryCost;
        msg += `${i + 1}. <b>${item.name}</b>\n`;
        msg += `   💰 Закупка: $${item.purchasePrice} | Продаж: $${item.salePrice}\n`;
        msg += `   📈 Прибуток: $${profit.toFixed(0)}\n\n`;
      });
      await sendMessage(chatId, msg);
    } catch (err) {
      console.error(err);
      await sendMessage(chatId, '❌ Помилка при завантаженні даних.');
    }
    return;
  }

  // /stats
  if (text === '/stats') {
    try {
      const items = await prisma.item.findMany();
      const totalItems = items.length;
      const totalQty = items.reduce((s: number, i: Item) => s + i.quantity, 0);
      const totalRevenue = items.reduce((s: number, i: Item) => s + i.salePrice * i.quantity, 0);
      const totalCost = items.reduce((s: number, i: Item) => s + (i.purchasePrice + i.deliveryCost) * i.quantity, 0);
      const totalProfit = totalRevenue - totalCost;

      await sendMessage(
        chatId,
        `📊 <b>Статистика CRM:</b>\n\n` +
        `📦 Товарів: <b>${totalItems}</b> (${totalQty} шт.)\n` +
        `💰 Виручка: <b>$${totalRevenue.toFixed(0)}</b>\n` +
        `📈 Прибуток: <b>$${totalProfit.toFixed(0)}</b>\n` +
        `👩 Частка Юлі (60%): <b>$${(totalProfit * 0.6).toFixed(0)}</b>\n` +
        `🏠 Оренда (10%): <b>$${(totalProfit * 0.1).toFixed(0)}</b>`
      );
    } catch (err) {
      console.error(err);
      await sendMessage(chatId, '❌ Помилка при завантаженні статистики.');
    }
    return;
  }

  // Wizard flow
  const state = wizardState.get(chatId);
  if (!state) {
    await sendMessage(
      chatId,
      'Напишіть /add щоб додати товар, або /start щоб побачити всі команди.'
    );
    return;
  }

  const currentStep = STEPS[state.step];

  // Validate numeric fields
  if (['quantity', 'purchasePrice', 'deliveryCost', 'salePrice'].includes(currentStep)) {
    const num = parseFloat(text.replace(',', '.'));
    if (isNaN(num) || num < 0) {
      await sendMessage(chatId, '⚠️ Будь ласка, введіть коректне число.');
      return;
    }
    state.data[currentStep] = String(num);
  } else {
    state.data[currentStep] = text;
  }

  state.step++;

  // If there are more steps, ask the next question
  if (state.step < STEPS.length) {
    const nextStep = STEPS[state.step];
    await sendMessage(chatId, STEP_PROMPTS[nextStep]);
    wizardState.set(chatId, state);
    return;
  }

  // All steps done — save to DB
  try {
    const d = state.data;
    const item = await prisma.item.create({
      data: {
        name: d.name,
        investor: d.investor === '-' ? null : d.investor,
        size: d.size,
        quantity: parseInt(d.quantity, 10),
        purchasePrice: parseFloat(d.purchasePrice),
        deliveryCost: parseFloat(d.deliveryCost),
        salePrice: parseFloat(d.salePrice),
      },
    });

    const profit = item.salePrice - item.purchasePrice - item.deliveryCost;

    await sendMessage(
      chatId,
      `✅ <b>Товар успішно додано!</b>\n\n` +
      `📦 ${item.name}\n` +
      `👤 Інвестор: ${item.investor || '—'}\n` +
      `📏 Розмір: ${item.size}\n` +
      `🔢 Кількість: ${item.quantity}\n` +
      `💵 Закупка: $${item.purchasePrice}\n` +
      `🚚 Доставка: $${item.deliveryCost}\n` +
      `🏷 Продаж: $${item.salePrice}\n` +
      `📈 Прибуток: <b>$${(profit * item.quantity).toFixed(0)}</b>\n\n` +
      `Додати ще один: /add`
    );
  } catch (err) {
    console.error('DB Error:', err);
    await sendMessage(chatId, '❌ Помилка при збереженні. Спробуйте /add ще раз.');
  }

  wizardState.delete(chatId);
}

// ─── Webhook Handler ───────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message = body.message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    await handleMessage(chatId, text);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Bot is running' });
}
