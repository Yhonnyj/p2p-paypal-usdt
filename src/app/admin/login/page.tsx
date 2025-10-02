"use client";
import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ALLOWED_EMAILS = ["info@caibo.ca", "alejandro@tucapi.app"];

export default function AdminLoginPage() {
  const { signIn, setActive } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null); // correo elegido
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      if (!signIn) {
        setError("Error interno: signIn no está disponible");
        return;
      }

      if (!email || !ALLOWED_EMAILS.includes(email)) {
        setError("Debes elegir un correo válido");
        return;
      }

      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete" && setActive) {
        await setActive({ session: result.createdSessionId });
        router.push("/admin/orders");
      }
    } catch (err) {
      setError("Credenciales inválidas");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <form
        onSubmit={handleLogin}
        className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-green-400">
          Login Admin
        </h2>

        {/* Botones para elegir correo */}
        <div className="flex flex-col gap-3">
          {ALLOWED_EMAILS.map((allowed) => (
            <button
              key={allowed}
              type="button"
              onClick={() => setEmail(allowed)}
              className={`p-3 rounded font-semibold border transition ${
                email === allowed
                  ? "bg-green-600 border-green-500"
                  : "bg-gray-800 border-gray-700 hover:bg-gray-700"
              }`}
            >
              {allowed}
            </button>
          ))}
        </div>

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded bg-gray-800 border border-gray-700"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={!email}
          className="w-full p-3 bg-green-600 hover:bg-green-700 rounded font-semibold disabled:opacity-50"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
}
