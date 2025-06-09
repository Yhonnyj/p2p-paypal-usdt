import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

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

    const documentUpload = await fetch("https://api.cloudinary.com/v1_1/<your-cloud-name>/image/upload", {
      method: "POST",
      body: new URLSearchParams({
        file: `data:${documentFile.type};base64,${documentBase64}`,
        upload_preset: "<your-upload-preset>",
        folder: "verifications/documents",
      }),
    });

    const selfieUpload = await fetch("https://api.cloudinary.com/v1_1/<your-cloud-name>/image/upload", {
      method: "POST",
      body: new URLSearchParams({
        file: `data:${selfieFile.type};base64,${selfieBase64}`,
        upload_preset: "<your-upload-preset>",
        folder: "verifications/selfies",
      }),
    });

    const docData = await documentUpload.json();
    const selfieData = await selfieUpload.json();

    const verification = await prisma.verification.create({
      data: {
        userId: user.id,
        documentUrl: docData.secure_url,
        selfieUrl: selfieData.secure_url,
        status: "PENDING",
      },
    });

    return NextResponse.json(verification);
  } catch (e) {
    console.error("Error al subir verificación", e);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
