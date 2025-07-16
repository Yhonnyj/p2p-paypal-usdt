// 👇 Forzar redeploy Vercel


import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { resend } from "@/lib/resend"; // Asegúrate que esto esté al inicio
import { sendPushNotification } from "@/lib/sendPushNotification";


export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    // Obtener usuario desde la base de datos
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

// Extraer archivos del form
const formData = await req.formData();
const documentFile = formData.get("document") as File | null;
const selfieFile = formData.get("selfie") as File | null;

if (!documentFile || !selfieFile) {
  return NextResponse.json({ error: "Faltan archivos" }, { status: 400 });
}

// Convertir archivos a ArrayBuffer para medir tamaño real
const [documentBuffer, selfieBuffer] = await Promise.all([
  documentFile.arrayBuffer(),
  selfieFile.arrayBuffer(),
]);

// Validar tamaño máximo de 5MB por archivo (5 * 1024 * 1024 bytes)
const maxSize = 5 * 1024 * 1024;

if (documentBuffer.byteLength > maxSize || selfieBuffer.byteLength > maxSize) {
  return NextResponse.json(
    { error: "Uno de los archivos es demasiado grande (máx. 5MB)" },
    { status: 400 }
  );
}

    const documentBase64 = Buffer.from(documentBuffer).toString("base64");
    const selfieBase64 = Buffer.from(selfieBuffer).toString("base64");

    const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
    const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET!;

    // Subida documento
    const docForm = new FormData();
    docForm.append("file", `data:${documentFile.type};base64,${documentBase64}`);
    docForm.append("upload_preset", UPLOAD_PRESET);
    docForm.append("folder", "verifications/documents");

    const documentUpload = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: docForm,
      }
    );

    if (!documentUpload.ok) {
      const errorText = await documentUpload.text();
      console.error("Error al subir documento:", errorText);
      return NextResponse.json({ error: "Error al subir documento" }, { status: 500 });
    }

    // Subida selfie
    const selfieForm = new FormData();
    selfieForm.append("file", `data:${selfieFile.type};base64,${selfieBase64}`);
    selfieForm.append("upload_preset", UPLOAD_PRESET);
    selfieForm.append("folder", "verifications/selfies");

    const selfieUpload = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: selfieForm,
      }
    );

    if (!selfieUpload.ok) {
      const errorText = await selfieUpload.text();
      console.error("Error al subir selfie:", errorText);
      return NextResponse.json({ error: "Error al subir selfie" }, { status: 500 });
    }

    const docData = await documentUpload.json();
    const selfieData = await selfieUpload.json();

    // Crear o actualizar la verificación
    const verification = await prisma.verification.upsert({
      where: { userId: user.id },
      update: {
        documentUrl: docData.secure_url,
        selfieUrl: selfieData.secure_url,
        status: "PENDING",
      },
      create: {
        userId: user.id,
        documentUrl: docData.secure_url,
        selfieUrl: selfieData.secure_url,
        status: "PENDING",
      },
    });

    // ✅ Notificar por email
await resend.emails.send({
  from: "Nueva verificacion por aprobar <notificaciones@tucapi.app>",
  to: "info@caibo.ca",
  subject: `🔐 Nueva verificación de ${user.fullName || user.email}`,
  html: `
    <h2>Tienes una nueva verificacion pendiente</h2>
    <p><strong>Cliente:</strong> ${user.fullName || user.email}</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
  `,
});


// ✅ Notificar al admin por Push si tiene token
const adminUser = await prisma.user.findUnique({
  where: { clerkId: process.env.ADMIN_CLERK_ID },
  select: { expoPushToken: true },
});

if (adminUser?.expoPushToken) {
  await sendPushNotification(
    adminUser.expoPushToken,
    "🔐 Nueva verificación recibida",
    `${user.fullName || user.email} envió documentos para revisión.`
  );
}


    return NextResponse.json(verification);
} catch (e) {
  console.error("Error inesperado al enviar verificación:", {
    message: (e as Error).message,
    stack: (e as Error).stack,
  });
  return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
}
}

// 👇 Configuración necesaria para que FormData funcione correctamente
export const config = {
  api: {
    bodyParser: false,
  },
};
