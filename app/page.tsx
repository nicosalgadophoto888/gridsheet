"use client";

import React, { useMemo, useRef, useState } from "react";
import { toPng, toJpeg } from "html-to-image";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Upload,
  Download,
  Type,
  Image as ImageIcon,
  SlidersHorizontal,
  X,
} from "lucide-react";

type SheetImage = {
  id: string;
  name: string;
  src: string;
};

const CANVAS_SIZES = [
  { label: "Letter (2550×3300)", w: 2550, h: 3300 },
  { label: "A4 (2480×3508)", w: 2480, h: 3508 },
  { label: "8×10 (2400×3000)", w: 2400, h: 3000 },
  { label: "11×14 (3300×4200)", w: 3300, h: 4200 },
  { label: "Instagram Square (1080×1080)", w: 1080, h: 1080 },
  { label: "Custom", w: 0, h: 0 },
] as const;

function SortableThumb({
  image,
  showNames,
  ratioClass,
}: {
  image: SheetImage;
  showNames: boolean;
  ratioClass: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group cursor-grab active:cursor-grabbing ${isDragging ? "opacity-70" : ""
        }`}
    >
      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-2 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur-sm transition duration-300 hover:border-white/20 hover:bg-white/[0.06]">
        <div
          className={`relative overflow-hidden rounded-[18px] bg-neutral-900 ${ratioClass}`}
        >
          <img
            src={image.src}
            alt={image.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5" />
        </div>
        {showNames && (
          <div className="px-1 pb-1 pt-3">
            <p className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
              {image.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#dcc58b]">{icon}</span>
      <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">
        {title}
      </p>
    </div>
  );
}

export default function LuxurySheetBuilder() {
  const [images, setImages] = useState<SheetImage[]>([]);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [logoPos, setLogoPos] = useState({ x: 24, y: 24 });
  const [logoSize, setLogoSize] = useState(120);
  const [columns, setColumns] = useState(4);
  const [gap, setGap] = useState(14);
  const [padding, setPadding] = useState(24);
  const [showNames, setShowNames] = useState(true);
  const [title, setTitle] = useState("Nico Salgado — Proof Sheet");
  const [subtitle, setSubtitle] = useState("Curated image selection");
  const [aspect, setAspect] = useState("4:5");
  const [canvasSizeLabel, setCanvasSizeLabel] = useState("Letter (2550×3300)");
  const [customW, setCustomW] = useState(1920);
  const [customH, setCustomH] = useState(1080);
  const [exporting, setExporting] = useState(false);

  const canvasSize = CANVAS_SIZES.find((s) => s.label === canvasSizeLabel) ?? CANVAS_SIZES[0];
  const exportW = canvasSize.label === "Custom" ? customW : canvasSize.w;
  const exportH = canvasSize.label === "Custom" ? customH : canvasSize.h;
  const canvasAspect = exportH / exportW;
  const previewRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const resizeRef = useRef<{ sx: number; sw: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const ratioClass = useMemo(() => {
    if (aspect === "1:1") return "aspect-square";
    if (aspect === "3:4") return "aspect-[3/4]";
    if (aspect === "16:9") return "aspect-video";
    return "aspect-[4/5]";
  }, [aspect]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const next = files.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      name: file.name.replace(/\.[^/.]+$/, ""),
      src: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...next]);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoSrc(URL.createObjectURL(file));
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setLogoSrc(URL.createObjectURL(file));
  };

  const onDragEnd = (event: {
    active: { id: string | number };
    over: { id: string | number } | null;
  }) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);

    setImages((items) => arrayMove(items, oldIndex, newIndex));
  };

  const triggerDownload = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPixelRatio = () =>
    previewRef.current ? exportW / previewRef.current.offsetWidth : 2;

  const captureOpts = () => ({
    pixelRatio: getPixelRatio(),
    filter: (node: HTMLElement) => node.dataset?.exportIgnore !== "true",
  });

  const exportPNG = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(previewRef.current, captureOpts());
      triggerDownload(dataUrl, "proof-sheet.png");
    } catch (e) {
      console.error("Export PNG failed", e);
      alert("Export failed — see console.");
    } finally {
      setExporting(false);
    }
  };

  const exportJPEG = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toJpeg(previewRef.current, { ...captureOpts(), quality: 0.92 });
      triggerDownload(dataUrl, "proof-sheet.jpg");
    } catch (e) {
      console.error("Export JPEG failed", e);
      alert("Export failed — see console.");
    } finally {
      setExporting(false);
    }
  };

  const exportPDF = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toJpeg(previewRef.current, { ...captureOpts(), quality: 0.92 });
      const el = previewRef.current;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: w > h ? "landscape" : "portrait", unit: "px", format: [w, h] });
      pdf.addImage(dataUrl, "JPEG", 0, 0, w, h);
      pdf.save("proof-sheet.pdf");
    } catch (e) {
      console.error("Export PDF failed", e);
      alert("Export failed — see console.");
    } finally {
      setExporting(false);
    }
  };

  const startLogoDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: logoPos.x, py: logoPos.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      setLogoPos({ x: dragRef.current.px + ev.clientX - dragRef.current.sx, y: dragRef.current.py + ev.clientY - dragRef.current.sy });
    };
    const onUp = () => { dragRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const startLogoResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { sx: e.clientX, sw: logoSize };
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      setLogoSize(Math.max(40, resizeRef.current.sw + ev.clientX - resizeRef.current.sx));
    };
    const onUp = () => { resizeRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(180,155,95,0.18),_transparent_28%),linear-gradient(180deg,_#090909_0%,_#111111_100%)] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1700px] grid-cols-1 gap-6 p-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="flex flex-col overflow-hidden rounded-[32px] border border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl xl:sticky xl:top-5 xl:h-[calc(100vh-40px)]">
          <div className="border-b border-white/10 p-6 pb-5">
  <div className="mb-3 flex items-center justify-between gap-3">
    <span className="rounded-full border border-[#b49b5f]/30 bg-[#b49b5f]/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#dcc58b]">
      Luxury Builder
    </span>
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-neutral-300">
      {images.length} images
    </span>
  </div>
  <h1 className="text-2xl font-semibold tracking-tight text-white">
    Proof Sheet Studio
  </h1>
  <p className="mt-2 text-sm leading-6 text-neutral-400">
    Clean contact sheets with logo placement, drag-to-reorder, and export.
  </p>
</div>
<div className="flex-1 min-h-0 space-y-6 overflow-y-auto p-5">
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-[0.24em] text-neutral-400">
                Upload images
              </label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] px-5 py-8 text-center transition hover:border-[#b49b5f]/40 hover:bg-white/[0.05]">
                <Upload className="mb-3 h-6 w-6 text-[#dcc58b]" />
                <span className="text-sm font-medium text-white">
                  Drop files here or browse
                </span>
                <span className="mt-1 text-xs text-neutral-400">
                  JPG, PNG, WEBP
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
              </label>
            </div>

            <div className="h-px bg-white/10" />

            <div className="space-y-3">
              <label className="text-xs uppercase tracking-[0.24em] text-neutral-400">
                Logo
              </label>
              {logoSrc ? (
                <div className="relative flex items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                  <img src={logoSrc} alt="Logo" className="max-h-16 max-w-full object-contain" />
                  <button
                    onClick={() => setLogoSrc(null)}
                    className="absolute right-2 top-2 rounded-full bg-white/10 p-1 text-neutral-400 hover:bg-white/20 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleLogoDrop}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-center transition hover:border-[#b49b5f]/40 hover:bg-white/[0.05]"
                >
                  <ImageIcon className="mb-2 h-5 w-5 text-[#dcc58b]" />
                  <span className="text-xs text-neutral-300">Drop logo or click</span>
                  <span className="mt-0.5 text-[11px] text-neutral-500">PNG recommended</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              )}
            </div>

            <div className="h-px bg-white/10" />

            <div className="space-y-4">
              <SectionTitle icon={<Type className="h-4 w-4" />} title="Branding" />

              <div className="space-y-2">
                <label className="text-sm text-neutral-300">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none placeholder:text-neutral-500 focus:border-[#b49b5f]/60"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-neutral-300">Subtitle</label>
                <input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none placeholder:text-neutral-500 focus:border-[#b49b5f]/60"
                />
              </div>
            </div>

            <div className="h-px bg-white/10" />

            <div className="space-y-4">
              <SectionTitle
                icon={<SlidersHorizontal className="h-4 w-4" />}
                title="Layout"
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm text-neutral-300">Columns</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={columns}
                    onChange={(e) =>
                      setColumns(
                        Math.max(1, Math.min(8, Number(e.target.value) || 1))
                      )
                    }
                    className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-[#b49b5f]/60"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-neutral-300">Aspect</label>
                  <select
                    value={aspect}
                    onChange={(e) => setAspect(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-[#b49b5f]/60"
                  >
                    <option value="4:5" className="bg-neutral-900">
                      Headshot 4:5
                    </option>
                    <option value="3:4" className="bg-neutral-900">
                      Portrait 3:4
                    </option>
                    <option value="1:1" className="bg-neutral-900">
                      Square 1:1
                    </option>
                    <option value="16:9" className="bg-neutral-900">
                      Wide 16:9
                    </option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-neutral-300">Gap</label>
                  <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                    {gap}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="32"
                  step="1"
                  value={gap}
                  onChange={(e) => setGap(Number(e.target.value))}
                  className="w-full accent-[#b49b5f]"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-neutral-300">
                    Canvas padding
                  </label>
                  <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                    {padding}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="2"
                  value={padding}
                  onChange={(e) => setPadding(Number(e.target.value))}
                  className="w-full accent-[#b49b5f]"
                />
              </div>

              <label className="flex items-center justify-between rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    Show image names
                  </p>
                  <p className="text-xs text-neutral-400">
                    Display a clean caption under each image
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showNames}
                  onChange={(e) => setShowNames(e.target.checked)}
                  className="h-5 w-5 accent-[#b49b5f]"
                />
              </label>
            </div>

            <div className="h-px bg-white/10" />

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Canvas Size</p>
              <select
                value={canvasSizeLabel}
                onChange={(e) => setCanvasSizeLabel(e.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-[#b49b5f]/60"
              >
                {CANVAS_SIZES.map((s) => (
                  <option key={s.label} value={s.label} className="bg-neutral-900">
                    {s.label}
                  </option>
                ))}
              </select>
              {canvasSize.label === "Custom" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400">Width px</label>
                    <input
                      type="number"
                      value={customW}
                      onChange={(e) => setCustomW(Number(e.target.value))}
                      className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-[#b49b5f]/60"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400">Height px</label>
                    <input
                      type="number"
                      value={customH}
                      onChange={(e) => setCustomH(Number(e.target.value))}
                      className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-[#b49b5f]/60"
                    />
                  </div>
                </div>
              )}
              <p className="text-[11px] text-neutral-500">
                Export target: {exportW} × {exportH}px
              </p>
            </div>

            <div className="h-px bg-white/10" />

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Export</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={exportPNG}
                  disabled={exporting}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-[#b49b5f] text-xs font-semibold text-black transition hover:bg-[#cdb06d] disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {exporting ? "…" : "PNG"}
                </button>
                <button
                  onClick={exportJPEG}
                  disabled={exporting}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-[#b49b5f]/40 bg-[#b49b5f]/10 text-xs font-semibold text-[#dcc58b] transition hover:bg-[#b49b5f]/20 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {exporting ? "…" : "JPEG"}
                </button>
                <button
                  onClick={exportPDF}
                  disabled={exporting}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-[#b49b5f]/40 bg-[#b49b5f]/10 text-xs font-semibold text-[#dcc58b] transition hover:bg-[#b49b5f]/20 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {exporting ? "…" : "PDF"}
                </button>
              </div>
              <button
                onClick={() => setImages([])}
                className="h-10 w-full rounded-2xl border border-white/10 bg-white/5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Clear All
              </button>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 items-center justify-center rounded-[32px] border border-white/10 bg-black/20 p-4 shadow-2xl backdrop-blur-sm">
          <div className="w-full overflow-auto rounded-[28px] p-4">
            <div
              ref={previewRef}
              className="relative mx-auto w-full max-w-[1100px] overflow-hidden rounded-[34px] border border-white/10 bg-[#0b0b0b] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.5)]"
              style={{ aspectRatio: `${exportW} / ${exportH}` }}
            >
              {/* draggable logo overlay */}
              {logoSrc && (
                <div
                  style={{ position: "absolute", left: logoPos.x, top: logoPos.y, width: logoSize, zIndex: 30 }}
                  onMouseDown={startLogoDrag}
                  className="group cursor-move select-none"
                >
                  <img src={logoSrc} alt="Logo" style={{ width: "100%", display: "block" }} draggable={false} />
                  {/* resize handle — hidden from export */}
                  <div
                    data-export-ignore="true"
                    onMouseDown={startLogoResize}
                    className="absolute -bottom-2 -right-2 h-5 w-5 cursor-se-resize rounded-full border-2 border-[#0b0b0b] shadow-md"
                    style={{ background: "rgba(180,155,95,0.95)" }}
                  />
                </div>
              )}

              <div className="mb-7 rounded-[28px] border border-[#b49b5f]/20 bg-[linear-gradient(135deg,rgba(180,155,95,0.16),rgba(255,255,255,0.03))] p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-[#dcc58b]">
                      Curated Selection
                    </p>
                    <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                      {title}
                    </h2>
                    <p className="mt-2 text-sm text-neutral-300">{subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-neutral-300">
                      {images.length} frames
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-neutral-300">
                      {aspect}
                    </div>
                  </div>
                </div>
              </div>

              {images.length === 0 ? (
                <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] text-center">
                  <div className="rounded-full border border-white/10 bg-white/[0.04] p-5">
                    <ImageIcon className="h-8 w-8 text-[#dcc58b]" />
                  </div>
                  <h3 className="mt-5 text-xl font-medium text-white">
                    Your proof sheet starts here
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-neutral-400">
                    Upload images on the left, then drag to reorder. The layout
                    is tuned for a clean luxury presentation instead of a generic
                    utility interface.
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}
                >
                  <SortableContext
                    items={images.map((img) => img.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div
                      className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]"
                      style={{ padding: `${padding}px` }}
                    >
                      <div
                        className="grid"
                        style={{
                          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                          gap: `${gap}px`,
                        }}
                      >
                        {images.map((image) => (
                          <SortableThumb
                            key={image.id}
                            image={image}
                            showNames={showNames}
                            ratioClass={ratioClass}
                          />
                        ))}
                      </div>
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
