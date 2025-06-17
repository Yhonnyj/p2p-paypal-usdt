// app/api/upload-image/route.ts
import { NextResponse } from 'next/server';

// --- Definición de tipo para el resultado de Cloudinary (opcional, pero recomendado) ---
interface CloudinaryUploadResult {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string; // La URL HTTPS segura de la imagen
  folder: string;
  access_mode: string;
  original_filename: string;
  [key: string]: unknown; // Para propiedades adicionales que Cloudinary pueda retornar
}

// Verificar variables de entorno necesarias
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_CHAT_UPLOAD_PRESET) {
  console.error("Missing Cloudinary environment variables. Please check your .env.local file.");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se encontró ningún archivo para subir.' },
        { status: 400 }
      );
    }

    // Validar tipo y tamaño
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El archivo no es una imagen válida. Solo se permiten imágenes.' },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE_MB = 5;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `La imagen es demasiado grande. Máximo ${MAX_FILE_SIZE_MB}MB.` },
        { status: 400 }
      );
    }

    // Obtener variables necesarias
    const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
    const CHAT_UPLOAD_PRESET = process.env.CLOUDINARY_CHAT_UPLOAD_PRESET!;

    const arrayBuffer = await file.arrayBuffer();
    const base64File = Buffer.from(arrayBuffer).toString('base64');

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", `data:${file.type};base64,${base64File}`);
    cloudinaryFormData.append("upload_preset", CHAT_UPLOAD_PRESET);
    // cloudinaryFormData.append("folder", "chat_uploads"); // opcional

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: cloudinaryFormData,
      }
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      console.error("Error al subir imagen de chat a Cloudinary:", errorData);
      return NextResponse.json(
        { error: errorData.error?.message || "Error al subir la imagen a Cloudinary." },
        { status: uploadResponse.status }
      );
    }

    const uploadResult: CloudinaryUploadResult = await uploadResponse.json();

    if (!uploadResult.secure_url) {
      console.error("Cloudinary no devolvió una URL segura:", uploadResult);
      return NextResponse.json(
        { error: 'Error al obtener la URL segura de la imagen de Cloudinary.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: uploadResult.secure_url }, { status: 200 });

  } catch (error) {
    console.error('Error general en la API de subida de imagen de chat:', error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Error desconocido del servidor.';

    return NextResponse.json(
      { error: `Error interno del servidor: ${errorMessage}` },
      { status: 500 }
    );
  }
}
