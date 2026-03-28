import { useAuthActions } from "@convex-dev/auth/react";

export function GoogleLoginModal({ open, onClose, title = "Sign in to continue" }) {
  const { signIn } = useAuthActions();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">
          Continue with Google to upload papers, like posts, and add comments.
        </p>

        <button
          onClick={() => signIn("google")}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-blue-700 to-blue-500 px-4 py-3 text-sm font-bold text-white"
        >
          Sign in with Google
        </button>

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
