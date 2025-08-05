import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 📌 Intentar leer JSON, si falla, leer texto y parsear manualmente
    let body: any;
    try {
      body = await req.json();
    } catch {
      const raw = await req.text();
      try {
        body = JSON.parse(raw);
      } catch {
        return NextResponse.json(
          { error: "Cuerpo no es JSON válido" },
          { status: 400 }
        );
      }
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña requeridos" },
        { status: 400 }
      );
    }

    console.log("📩 Datos recibidos:", email);

    // 1️⃣ Iniciar sesión en Clerk
    const signInRes = await fetch("https://api.clerk.com/v1/sign_ins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
      body: JSON.stringify({ identifier: email, password }),
    });

    const signInData = await signInRes.json();
    console.log("🔍 Respuesta de Clerk SIGN_IN:", signInData);

    if (!signInRes.ok || !signInData.created_session_id) {
      return NextResponse.json(
        { error: signInData.errors || "Error en SIGN_IN" },
        { status: signInRes.status }
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
    console.log("🔍 Respuesta de Clerk TOKEN:", tokenData);

    if (!tokenRes.ok || !tokenData.session_token) {
      return NextResponse.json(
        { error: tokenData.errors || "Error creando token" },
        { status: tokenRes.status }
      );
    }

    // ✅ Respuesta final
    return NextResponse.json({
      token: tokenData.session_token,
      userId: signInData.user_id,
    });
  } catch (error) {
    console.error("💥 Error en mobile-login:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
