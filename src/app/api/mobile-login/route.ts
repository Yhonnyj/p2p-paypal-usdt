import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña requeridos" },
        { status: 400 }
      );
    }

    // 1️⃣ Iniciar sesión en Clerk
    const signInRes = await fetch("https://api.clerk.com/v1/sign_ins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        identifier: email,
        password,
      }),
    });

    const signInData = await signInRes.json();

    if (!signInRes.ok || !signInData.created_session_id) {
      return NextResponse.json(
        { error: signInData.errors?.[0]?.message || "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // 2️⃣ Crear token de sesión
    const tokenRes = await fetch(
      `https://api.clerk.com/v1/sessions/${signInData.created_session_id}/tokens`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    );

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.session_token) {
      return NextResponse.json(
        { error: tokenData.errors?.[0]?.message || "No se pudo crear el token" },
        { status: 500 }
      );
    }

    // ✅ Respuesta final para Flutter
    return NextResponse.json({
      token: tokenData.session_token,
      userId: signInData.user_id,
    });
  } catch (error) {
    console.error("Error en mobile-login:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
