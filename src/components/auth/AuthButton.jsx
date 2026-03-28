import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export function AuthButton() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();

  if (isLoading) {
    return <span className="text-sm text-slate-500">Checking session...</span>;
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => signIn("google")}
        className="rounded-full bg-gradient-to-br from-blue-700 to-blue-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
      >
        Sign in with Google
      </button>
    );
  }

  return (
    <button
      onClick={() => signOut()}
      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      Logout
    </button>
  );
}
