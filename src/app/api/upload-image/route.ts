// app/api/upload-image/route.ts
import { NextResponse } from 'next/server';
// Ya no necesitamos 'v2 as cloudinary' ni 'Buffer' si hacemos fetch directo
// import { v2 as cloudinary } from 'cloudinary'; 
// import { Buffer } from 'buffer'; 

// --- Definición de tipo para el resultado de Cloudinary (opcional, pero recomendado) ---
// Se mantiene ya que la estructura de la respuesta de Cloudinary es la misma
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
  [key: string]: any; // Para propiedades adicionales que Cloudinary pueda retornar
}
// ----------------------------------------------------------------------------------

// Asegúrate de que las variables de entorno están cargadas.
// Esto se hace automáticamente en Next.js con .env.local
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_CHAT_UPLOAD_PRESET) {
  console.error("Missing Cloudinary environment variables. Please check your .env.local file.");
  // En producción, podrías considerar lanzar un error para detener la aplicación si estas no están definidas
  // throw new Error("Cloudinary environment variables are not set.");
}

// Eliminamos la configuración de cloudinary.config() ya que no usamos API Key/Secret para subidas "Unsigned"


export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null; // Obtiene el archivo enviado desde el frontend

    if (!file) {
      return NextResponse.json({ error: 'No se encontró ningún archivo para subir.' }, { status: 400 });
    }

    // --- Validación básica del archivo ---
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo no es una imagen válida. Solo se permiten imágenes.' }, { status: 400 });
    }
    const MAX_FILE_SIZE_MB = 5; // Límite de 5 MB
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `La imagen es demasiado grande. Máximo ${MAX_FILE_SIZE_MB}MB.` }, { status: 400 });
    }
    // --- Fin de la validación ---

    // Obtener el Cloud Name y el Upload Preset para el chat desde las variables de entorno
    // Se usa '!' al final porque sabemos que estas variables existen según tu .env.local
    const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
    const CHAT_UPLOAD_PRESET = process.env.CLOUDINARY_CHAT_UPLOAD_PRESET!;

    // Convertir el archivo a un ArrayBuffer y luego a Base64
    // Este es el método que usas en tu API de verificaciones para subir directamente a Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const base64File = Buffer.from(arrayBuffer).toString('base64'); // Buffer se usa aquí y se asume global en Node.js, o puedes importarlo si hay problemas.

    // Preparar el FormData para la petición directa a la API de Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", `data:${file.type};base64,${base64File}`);
    cloudinaryFormData.append("upload_preset", CHAT_UPLOAD_PRESET);
    // Opcional: Si quieres que las imágenes de chat vayan a una subcarpeta específica
    // (Asegúrate de que esta carpeta esté configurada en tu preset 'chat_images_preset' o se cree automáticamente)
    // cloudinaryFormData.append("folder", "chat_uploads");

    // Realizar la petición POST directamente al endpoint de subida de Cloudinary
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: cloudinaryFormData,
      }
    );

    // Verificar si la subida fue exitosa
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json(); // Intentar leer el JSON de error de Cloudinary
      console.error("Error al subir imagen de chat a Cloudinary:", errorData);
      return NextResponse.json({ error: errorData.error?.message || "Error al subir la imagen a Cloudinary." }, { status: uploadResponse.status });
    }

    const uploadResult: CloudinaryUploadResult = await uploadResponse.json(); // Castear a la interfaz

    // Verifica si Cloudinary devolvió una URL segura para la imagen.
    if (!uploadResult || !uploadResult.secure_url) {
      console.error("Cloudinary did not return a secure URL after upload:", uploadResult);
      return NextResponse.json({ error: 'Error al obtener la URL segura de la imagen de Cloudinary.' }, { status: 500 });
    }

    // Retorna la URL segura (pública) de la imagen subida al frontend.
    return NextResponse.json({ url: uploadResult.secure_url }, { status: 200 });

  } catch (error: any) {
    // Captura y maneja cualquier error inesperado.
    console.error('Error general en la API de subida de imagen de chat:', error);
    // Intentar extraer un mensaje de error más específico
    const errorMessage = error.message || 'Error desconocido del servidor.';
    return NextResponse.json({ error: `Error interno del servidor: ${errorMessage}` }, { status: 500 });
  }
}
