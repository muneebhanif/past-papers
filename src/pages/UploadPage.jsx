import { useAction, useConvexAuth, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { DEPARTMENTS } from "../constants/departments";
import { ACADEMIC_YEARS, PAPER_TYPES, SEMESTERS } from "../constants/academicOptions";
import { api } from "../lib/api";

const sanitizeText = (value, max = 120) => value.trim().replace(/\s+/g, " ").slice(0, max);
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

const fileToImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image file."));
    };
    image.src = url;
  });

const canvasToJpegBlob = (canvas, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not process image."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });

const compressJpegToMaxSize = async (file, label) => {
  if (file.size <= MAX_UPLOAD_BYTES) {
    return file;
  }

  const sourceImage = await fileToImage(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error(`Could not process ${label}.`);
  }

  let width = sourceImage.naturalWidth;
  let height = sourceImage.naturalHeight;
  const maxDimension = 2400;
  if (Math.max(width, height) > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.max(1, Math.floor(width * scale));
    height = Math.max(1, Math.floor(height * scale));
  }

  let outputBlob = null;
  for (let resizeAttempt = 0; resizeAttempt < 7; resizeAttempt += 1) {
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(sourceImage, 0, 0, width, height);

    for (let quality = 0.9; quality >= 0.45; quality -= 0.08) {
      const blob = await canvasToJpegBlob(canvas, Number(quality.toFixed(2)));
      outputBlob = blob;
      if (blob.size <= MAX_UPLOAD_BYTES) {
        const safeName = file.name.replace(/\.[^.]+$/, "").replace(/\s+/g, "-");
        return new File([blob], `${safeName || "paper"}.jpg`, { type: "image/jpeg" });
      }
    }

    width = Math.max(1, Math.floor(width * 0.85));
    height = Math.max(1, Math.floor(height * 0.85));
  }

  if (outputBlob && outputBlob.size <= MAX_UPLOAD_BYTES) {
    const safeName = file.name.replace(/\.[^.]+$/, "").replace(/\s+/g, "-");
    return new File([outputBlob], `${safeName || "paper"}.jpg`, { type: "image/jpeg" });
  }

  throw new Error(`${label} could not be compressed below 3MB. Please crop or lower quality.`);
};

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
    semester: "1",
    department: "Computer Science",
  });
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState("");
  const [backPreview, setBackPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!frontFile) {
      setFrontPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(frontFile);
    setFrontPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [frontFile]);

  useEffect(() => {
    if (!backFile) {
      setBackPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(backFile);
    setBackPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [backFile]);

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
      semester: sanitizeText(form.semester, 4),
      department: sanitizeText(form.department, 80),
    };

    if (clean.title.length < 4) return setError("Title must be at least 4 characters.");
    if (clean.subject.length < 2) return setError("Subject must be at least 2 characters.");
    if (clean.teacher.length < 2) return setError("Teacher must be at least 2 characters.");
    if (!PAPER_TYPES.includes(clean.type)) return setError("Invalid paper type selected.");
    if (!ACADEMIC_YEARS.includes(clean.year)) return setError("Invalid year selected.");
    if (!SEMESTERS.includes(clean.semester)) return setError("Invalid semester selected.");

    const validateJpeg = (selectedFile, label, required = false) => {
      if (!selectedFile) {
        if (required) {
          throw new Error(`Please select the ${label} JPEG image.`);
        }
        return;
      }
      if (selectedFile.type !== "image/jpeg") {
        throw new Error(`${label} must be image/jpeg.`);
      }
      if (selectedFile.size > MAX_SOURCE_BYTES) {
        throw new Error(`${label} is too large. Please select a file under 20MB.`);
      }
    };

    const uploadSingleFile = async (selectedFile) => {
      const auth = await getUploadAuth({});
      const body = new FormData();
      body.append("file", selectedFile);
      body.append("fileName", `${Date.now()}-${selectedFile.name.replace(/\s+/g, "-")}`);
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

      return uploadResponse.json();
    };

    try {
      validateJpeg(frontFile, "Front image", true);
      validateJpeg(backFile, "Back image", false);
    } catch (validationError) {
      return setError(validationError.message || "Invalid image selected.");
    }

    try {
      setIsSubmitting(true);
      const compressedFront = await compressJpegToMaxSize(frontFile, "Front image");
      const compressedBack = backFile ? await compressJpegToMaxSize(backFile, "Back image") : null;

      const frontUpload = await uploadSingleFile(compressedFront);
      const backUpload = compressedBack ? await uploadSingleFile(compressedBack) : null;

      await createPaper({
        ...clean,
        imageUrl: frontUpload.url,
        ...(frontUpload.fileId ? { imageFileId: frontUpload.fileId } : {}),
        ...(backUpload?.url ? { secondImageUrl: backUpload.url } : {}),
        ...(backUpload?.fileId ? { secondImageFileId: backUpload.fileId } : {}),
      });
      setSuccess("Upload submitted for admin approval.");
      setForm({
        title: "",
        subject: "",
        teacher: "",
        year: ACADEMIC_YEARS[0],
        type: "Midterm",
        semester: "1",
        department: "Computer Science",
      });
      setFrontFile(null);
      setBackFile(null);
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
        <p className="mt-2 text-sm text-slate-500">Upload front page and optional back page (JPEG). Files are auto-compressed to max 3MB each before upload.</p>

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

          <select
            value={form.semester}
            onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))}
            className="w-full rounded-xl border-none bg-slate-100 px-3 py-3 text-sm"
            required
          >
            {SEMESTERS.map((semesterOption) => (
              <option key={semesterOption} value={semesterOption}>{`Semester ${semesterOption}`}</option>
            ))}
          </select>

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

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Front image (required)</label>
              <input
                type="file"
                accept="image/jpeg"
                onChange={(e) => setFrontFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl border-none bg-slate-100 px-3 py-3 text-sm"
                required
              />
              {frontPreview ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <img src={frontPreview} alt="Front upload preview" className="h-56 w-full object-cover" loading="lazy" />
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Back image (optional)</label>
              <input
                type="file"
                accept="image/jpeg"
                onChange={(e) => setBackFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl border-none bg-slate-100 px-3 py-3 text-sm"
              />
              {backPreview ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <img src={backPreview} alt="Back upload preview" className="h-56 w-full object-cover" loading="lazy" />
                </div>
              ) : null}
            </div>
          </div>

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
            <li>• Front image is required, back image is optional.</li>
            <li>• Only image/jpeg is accepted.</li>
            <li>• Images are auto-compressed to 3MB max per image.</li>
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
