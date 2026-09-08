import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, investor, size, quantity, purchasePrice, deliveryCost, salePrice } = body;

    const newItem = await prisma.item.create({
      data: {
        name,
        investor,
        size,
        quantity: parseInt(quantity, 10),
        purchasePrice: parseFloat(purchasePrice),
        deliveryCost: parseFloat(deliveryCost),
        salePrice: parseFloat(salePrice),
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.item.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
