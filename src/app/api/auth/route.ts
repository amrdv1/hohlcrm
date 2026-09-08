import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.CRM_PASSWORD || 'admin123';
    
    if (password === correctPassword) {
      return NextResponse.json({ success: true, token: 'crm_auth_' + Date.now() });
    }
    
    return NextResponse.json({ success: false, error: 'Невірний пароль' }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: 'Помилка сервера' }, { status: 500 });
  }
}
