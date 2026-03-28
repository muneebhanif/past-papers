import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export function LoginSplash() {
  const { isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  if (isAuthenticated) return null;

  return (
    <section className="rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 p-5 text-white shadow-[0px_20px_40px_rgba(0,74,198,0.18)]">
      <h2 className="text-2xl font-extrabold tracking-tight">Welcome to the Scholarly Sanctuary</h2>
      <p className="mt-2 text-sm text-blue-100">
        Browse as guest or sign in with Google for full access.
      </p>
      <button
        onClick={() => signIn("google")}
        className="mt-4 rounded-full bg-white px-5 py-2 text-sm font-bold text-blue-700"
      >
        Continue with Google
      </button>
    </section>
  );
}
