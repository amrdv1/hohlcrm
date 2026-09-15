import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://holydripbackend-production.up.railway.app';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/order`, {
      cache: 'no-store'
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch orders from backend' }, { status: res.status });
    }
    const orders = await res.json();
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders in CRM:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/order/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.message || 'Failed to update order status' }, { status: res.status });
    }

    const updated = await res.json();
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating order status in CRM:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
