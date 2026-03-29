import { useAction, useConvexAuth, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { DEPARTMENTS } from "../constants/departments";
import { ACADEMIC_YEARS, PAPER_TYPES } from "../constants/academicOptions";
import { api } from "../lib/api";

const sanitizeText = (value, max = 120) => value.trim().replace(/\s+/g, " ").slice(0, max);

export function UploadPage({ onRequireAuth }) {
  const { isAuthenticated } = useConvexAuth();
  const getUploadAuth = useAction(api.imagekit.getUploadAuth);
  const createPaper = useMutation(api.papers.create);

  const [form, setForm] = useState({
    title: "",
    subject: "",
    teacher: "",
    year: ACADEMIC_YEARS[0],
    type: "Midterm",
    department: "Computer Science",
  });
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!file) {
      setFilePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    const clean = {
      title: sanitizeText(form.title, 120),
      subject: sanitizeText(form.subject, 80),
      teacher: sanitizeText(form.teacher, 80),
      year: sanitizeText(form.year, 20),
      type: sanitizeText(form.type, 40),
      department: sanitizeText(form.department, 80),
    };

    if (clean.title.length < 4) return setError("Title must be at least 4 characters.");
    if (clean.subject.length < 2) return setError("Subject must be at least 2 characters.");
    if (clean.teacher.length < 2) return setError("Teacher must be at least 2 characters.");
    if (!PAPER_TYPES.includes(clean.type)) return setError("Invalid paper type selected.");
    if (!ACADEMIC_YEARS.includes(clean.year)) return setError("Invalid year selected.");

    if (!file) return setError("Please select a JPEG image.");
    if (file.type !== "image/jpeg") return setError("Only image/jpeg is allowed.");
    if (file.size > 5 * 1024 * 1024) return setError("File size must be 5MB or less.");

    try {
      setIsSubmitting(true);
      const auth = await getUploadAuth({});

      const body = new FormData();
      body.append("file", file);
      body.append("fileName", `${Date.now()}-${file.name.replace(/\s+/g, "-")}`);
      body.append("publicKey", auth.publicKey);
      body.append("signature", auth.signature);
      body.append("expire", String(auth.expire));
      body.append("token", auth.token);
      body.append("folder", auth.folder);
      body.append("useUniqueFileName", "true");

      const uploadResponse = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body,
      });
      if (!uploadResponse.ok) {
        let detail = "Image upload failed.";
        try {
          const failure = await uploadResponse.json();
          detail = failure?.message || detail;
        } catch {
          // ignore non-JSON response
        }
        throw new Error(detail);
      }
      const uploadResult = await uploadResponse.json();

      await createPaper({ ...clean, imageUrl: uploadResult.url });
      setSuccess("Upload submitted for admin approval.");
      setForm({
        title: "",
        subject: "",
        teacher: "",
        year: ACADEMIC_YEARS[0],
        type: "Midterm",
        department: "Computer Science",
      });
      setFile(null);
    } catch (uploadError) {
      setError(uploadError.message || "Upload failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 pb-16 lg:grid-cols-12 xl:pb-0">
      <section className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Contribute to the Archive</h2>
        <p className="mt-2 text-sm text-slate-500">JPEG preview only, max 5MB, all uploads start as pending.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <select
              value={form.department}
              onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
              className="rounded-xl border-none bg-slate-100 px-3 py-3 text-sm"
            >
              {DEPARTMENTS.filter((d) => d !== "All").map((department) => (
                <option key={department}>{department}</option>
              ))}
            </select>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="rounded-xl border-none bg-slate-100 px-3 py-3 text-sm"
              required
            >
              {PAPER_TYPES.map((paperType) => (
                <option key={paperType} value={paperType}>{paperType}</option>
              ))}
            </select>
          </div>

          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Paper title"
            className="w-full rounded-xl border-none bg-slate-100 px-3 py-3 text-sm"
            required
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Subject"
              className="rounded-xl border-none bg-slate-100 px-3 py-3 text-sm"
              required
            />
            <input
              value={form.teacher}
              onChange={(e) => setForm((p) => ({ ...p, teacher: e.target.value }))}
              placeholder="Teacher"
              className="rounded-xl border-none bg-slate-100 px-3 py-3 text-sm"
              required
            />
          </div>

          <select
            value={form.year}
            onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
            className="w-full rounded-xl border-none bg-slate-100 px-3 py-3 text-sm"
            required
          >
            {ACADEMIC_YEARS.map((yearOption) => (
              <option key={yearOption} value={yearOption}>{yearOption}</option>
            ))}
          </select>

          <input
            type="file"
            accept="image/jpeg"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-xl border-none bg-slate-100 px-3 py-3 text-sm"
            required
          />

          {filePreview ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Image preview</div>
              <img src={filePreview} alt="Selected upload preview" className="h-56 w-full object-cover" loading="lazy" />
            </div>
          ) : null}

          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
          {success ? <p className="text-sm font-semibold text-emerald-700">{success}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-gradient-to-br from-blue-700 to-blue-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Uploading..." : "Upload Paper"}
          </button>
        </form>
      </section>

      <aside className="space-y-4 lg:col-span-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-base font-bold text-slate-900">Upload Guidelines</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Only image/jpeg is accepted.</li>
            <li>• Maximum file size is 5MB.</li>
            <li>• Add correct subject/teacher/year metadata.</li>
            <li>• Admin review is required before publishing.</li>
          </ul>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-600 p-5 text-white">
          <p className="text-lg font-bold">Your uploads power better study outcomes.</p>
        </div>
      </aside>
    </div>
  );
}
