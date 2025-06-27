"use client";

interface Props {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
}

export default function PaginationControls({ page, setPage, totalPages }: Props) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 text-sm sm:text-base">
      <button
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
        className="px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none transform active:scale-95"
      >
        Anterior
      </button>

      <span className="text-gray-300 font-medium">
        Página <span className="text-white font-bold">{page}</span> de {totalPages}
      </span>

      <button
        disabled={page === totalPages}
        onClick={() => setPage(page + 1)}
        className="px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none transform active:scale-95"
      >
        Siguiente
      </button>
    </div>
  );
}
