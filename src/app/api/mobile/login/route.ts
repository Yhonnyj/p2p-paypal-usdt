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

    // Paso 1: Intentar iniciar sesión (sign_in_attempt)
    const signInAttemptRes = await fetch('https://api.clerk.com/v1/sign_in_attempts', {
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

    const signInData = await signInAttemptRes.json();

    if (!signInAttemptRes.ok) {
      const message = signInData?.errors?.[0]?.message || 'Credenciales inválidas';
      return NextResponse.json({ error: message }, { status: signInAttemptRes.status });
    }

    const { created_session_id, user_id } = signInData;

    // Paso 2: Crear sesión
    const sessionRes = await fetch('https://api.clerk.com/v1/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY!}`,
      },
      body: JSON.stringify({
        session_id: created_session_id,
      }),
    });

    const sessionData = await sessionRes.json();

    if (!sessionRes.ok) {
      const message = sessionData?.errors?.[0]?.message || 'Error al crear sesión';
      return NextResponse.json({ error: message }, { status: sessionRes.status });
    }

    return NextResponse.json({
      sessionId: sessionData.id,
      userId: sessionData.user_id,
      token: sessionData.last_active_token?.jwt, // puedes guardar este token si lo necesitas
    });
  } catch (error) {
    const err = error as Error;
    console.error('❌ Error en mobile login:', err.message);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
