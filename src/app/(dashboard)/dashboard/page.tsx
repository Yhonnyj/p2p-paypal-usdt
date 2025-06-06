import { auth } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import Script from "next/script";

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return <div className="text-red-500">No autorizado</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">
        Bienvenido, {user.firstName} 👋
      </h1>
      <p className="text-sm text-gray-400">
        Tu ID de usuario es: <code>{userId}</code>
      </p>

      {/* Contenedor donde se carga Didit */}
      <div id="didit-verification" className="mt-8" />

      {/* Script Didit con integración de backend */}
      <Script id="didit-init" strategy="afterInteractive">
        {`
          window.DiditVerify?.init({
            publicKey: "zvlZemIiVktXAhGNvNFc8k7c5vhB5RLyyH78AEzQF8E",
            referenceId: "${userId}",
            containerId: "didit-verification",
            onSuccess: async function(result) {
              console.log("Verificación exitosa", result);

              try {
                const res = await fetch("/api/user-profile", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    status: result.status || "approved",
                    country: result.data?.country || "Desconocido"
                  }),
                });

                if (!res.ok) {
                  console.error("Error al guardar perfil:", await res.text());
                } else {
                  console.log("Perfil guardado correctamente");
                }
              } catch (error) {
                console.error("Error al enviar datos a backend:", error);
              }
            },
            onError: function(error) {
              console.error("Error de verificación", error);
            }
          });
        `}
      </Script>
    </div>
  );
}
