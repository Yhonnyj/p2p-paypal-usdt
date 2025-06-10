import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

    const [documentBuffer, selfieBuffer] = await Promise.all([
      documentFile.arrayBuffer(),
      selfieFile.arrayBuffer(),
    ]);

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

    return NextResponse.json(verification);
  } catch (e) {
    console.error("Error inesperado al enviar verificación", e);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
