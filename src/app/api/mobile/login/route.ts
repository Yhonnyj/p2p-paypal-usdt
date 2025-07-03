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

    const res = await fetch('https://api.clerk.com/v1/client/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
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
      sessionId: data.id,
      userId: data.user_id,
      token: data.last_active_token?.jwt,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error en mobile login:', error.message);
    } else {
      console.error('Error en mobile login:', String(error));
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
