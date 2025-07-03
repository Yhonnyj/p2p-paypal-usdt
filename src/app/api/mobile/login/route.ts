import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña requeridos' },
        { status: 400 }
      );
    }

    const res = await fetch('https://api.clerk.com/v1/sign_in_attempts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY!}`,
      },
      body: JSON.stringify({
        identifier: email,
        password: password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const message = data?.errors?.[0]?.message || 'Error al iniciar sesión';
      return NextResponse.json({ error: message }, { status: res.status });
    }

    return NextResponse.json({
      sessionId: data.created_session_id,
      userId: data.user_id,
      status: data.status,
    });
  } catch (error: any) {
    console.error('❌ Error en mobile login:', error?.message || error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
