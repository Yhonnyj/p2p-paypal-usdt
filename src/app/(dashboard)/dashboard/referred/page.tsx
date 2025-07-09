import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export default async function ReferredPage() {
  const { userId } = await auth(); // 👈 esta es la corrección

  if (!userId) {
    return <p className="text-center text-red-500">No autenticado</p>;
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      referralEarnings: {
        include: {
          user: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    return <p className="text-center text-red-500">Usuario no encontrado</p>;
  }

  const totalGanado = user.referralEarnings.reduce((sum, e) => sum + e.amount, 0);
  const link = `https://tucapi.com?r=${user.id}`;

  return (
    <div className="max-w-3xl mx-auto p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">Programa de Referidos</h1>

      <p className="mb-2">Invita a tus amigos con este link:</p>
      <div className="bg-gray-800 p-3 rounded-md mb-6 break-all">
        <span className="text-green-400">{link}</span>
      </div>

      <p className="mb-2">Has ganado un total de:</p>
      <div className="text-2xl font-bold text-green-400 mb-6">
        {totalGanado.toFixed(2)} USDT
      </div>

      <h2 className="text-xl font-semibold mb-2">Historial de Ganancias</h2>
      <div className="bg-gray-900 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-700 text-left text-gray-300">
            <tr>
              <th className="p-3">Referido</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Monto</th>
            </tr>
          </thead>
          <tbody>
            {user.referralEarnings.map((earning) => (
              <tr key={earning.id} className="border-t border-gray-800">
                <td className="p-3">{earning.referredUserId}</td>
                <td className="p-3">{format(earning.createdAt, "dd/MM/yyyy")}</td>
                <td className="p-3 text-green-400">+{earning.amount} USDT</td>
              </tr>
            ))}
            {user.referralEarnings.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  Aún no has generado ganancias por referidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
