'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';

export default function ManualUploadPage() {
  const [userId, setUserId] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!userId || !documentUrl || !selfieUrl) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/manual-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, documentUrl, selfieUrl }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Documentos subidos correctamente');
        setUserId('');
        setDocumentUrl('');
        setSelfieUrl('');
      } else {
        toast.error(data.error || 'Error al subir documentos');
      }
   } catch {
  toast.error('Error inesperado');
} finally {
  setLoading(false);
}

  };

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-white">Subida manual de documentos</h1>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-white">ID del usuario</label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full p-2 bg-gray-800 text-white rounded"
            placeholder="user_abc123"
          />
        </div>

        <div>
          <label className="text-sm text-white">URL del documento</label>
          <input
            value={documentUrl}
            onChange={(e) => setDocumentUrl(e.target.value)}
            className="w-full p-2 bg-gray-800 text-white rounded"
            placeholder="https://res.cloudinary.com/..."
          />
        </div>

        <div>
          <label className="text-sm text-white">URL de la selfie</label>
          <input
            value={selfieUrl}
            onChange={(e) => setSelfieUrl(e.target.value)}
            className="w-full p-2 bg-gray-800 text-white rounded"
            placeholder="https://res.cloudinary.com/..."
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded mt-4 disabled:opacity-50"
        >
          {loading ? 'Subiendo...' : 'Subir documentos'}
        </button>
      </div>
    </main>
  );
}
