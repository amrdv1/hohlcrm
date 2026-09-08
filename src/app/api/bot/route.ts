import { Telegraf, Scenes, session } from 'telegraf';
import prisma from '@/lib/prisma';

// Use a bot token from environment variable
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || 'DUMMY_TOKEN');

// Define a wizard scene for adding an item
const addItemWizard = new Scenes.WizardScene(
  'add_item_wizard',
  async (ctx: any) => {
    await ctx.reply('Введите название вещи (или /cancel для отмены):');
    ctx.wizard.state.itemData = {};
    return ctx.wizard.next();
  },
  async (ctx: any) => {
    if (ctx.message?.text) {
      if (ctx.message.text === '/cancel') {
        await ctx.reply('Добавление отменено.');
        return ctx.scene.leave();
      }
      ctx.wizard.state.itemData.name = ctx.message.text;
      await ctx.reply('Введите имя инвестора (или напишите "-" если нет):');
      return ctx.wizard.next();
    }
  },
  async (ctx: any) => {
    if (ctx.message?.text) {
      if (ctx.message.text === '/cancel') {
        await ctx.reply('Добавление отменено.');
        return ctx.scene.leave();
      }
      ctx.wizard.state.itemData.investor = ctx.message.text === '-' ? null : ctx.message.text;
      await ctx.reply('Введите размеры:');
      return ctx.wizard.next();
    }
  },
  async (ctx: any) => {
    if (ctx.message?.text) {
      if (ctx.message.text === '/cancel') {
        await ctx.reply('Добавление отменено.');
        return ctx.scene.leave();
      }
      ctx.wizard.state.itemData.size = ctx.message.text;
      await ctx.reply('Введите количество (число):');
      return ctx.wizard.next();
    }
  },
  async (ctx: any) => {
    if (ctx.message?.text) {
      if (ctx.message.text === '/cancel') {
        await ctx.reply('Добавление отменено.');
        return ctx.scene.leave();
      }
      const qty = parseInt(ctx.message.text, 10);
      if (isNaN(qty)) {
        await ctx.reply('Пожалуйста, введите корректное число.');
        return;
      }
      ctx.wizard.state.itemData.quantity = qty;
      await ctx.reply('Введите цену закупки:');
      return ctx.wizard.next();
    }
  },
  async (ctx: any) => {
    if (ctx.message?.text) {
      if (ctx.message.text === '/cancel') {
        await ctx.reply('Добавление отменено.');
        return ctx.scene.leave();
      }
      const val = parseFloat(ctx.message.text.replace(',', '.'));
      if (isNaN(val)) {
        await ctx.reply('Пожалуйста, введите корректное число.');
        return;
      }
      ctx.wizard.state.itemData.purchasePrice = val;
      await ctx.reply('Введите стоимость доставки:');
      return ctx.wizard.next();
    }
  },
  async (ctx: any) => {
    if (ctx.message?.text) {
      if (ctx.message.text === '/cancel') {
        await ctx.reply('Добавление отменено.');
        return ctx.scene.leave();
      }
      const val = parseFloat(ctx.message.text.replace(',', '.'));
      if (isNaN(val)) {
        await ctx.reply('Пожалуйста, введите корректное число.');
        return;
      }
      ctx.wizard.state.itemData.deliveryCost = val;
      await ctx.reply('Введите цену продажи:');
      return ctx.wizard.next();
    }
  },
  async (ctx: any) => {
    if (ctx.message?.text) {
      if (ctx.message.text === '/cancel') {
        await ctx.reply('Добавление отменено.');
        return ctx.scene.leave();
      }
      const val = parseFloat(ctx.message.text.replace(',', '.'));
      if (isNaN(val)) {
        await ctx.reply('Пожалуйста, введите корректное число.');
        return;
      }
      ctx.wizard.state.itemData.salePrice = val;
      
      const data = ctx.wizard.state.itemData;
      
      try {
        await prisma.item.create({ data });
        await ctx.reply(`✅ Товар "${data.name}" успешно добавлен в базу данных!`);
      } catch (err) {
        console.error(err);
        await ctx.reply('❌ Ошибка при сохранении в базу данных.');
      }
      
      return ctx.scene.leave();
    }
  }
);

const stage = new Scenes.Stage([addItemWizard]);
bot.use(session());
bot.use(stage.middleware() as any);

bot.command('add', (ctx: any) => ctx.scene.enter('add_item_wizard'));
bot.start((ctx: any) => ctx.reply('Привет! Я бот для добавления товаров в CRM. Напиши /add чтобы начать.'));

// Webhook handler
export async function POST(req: Request) {
  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error handling webhook', error);
    return new Response('Error', { status: 500 });
  }
}
