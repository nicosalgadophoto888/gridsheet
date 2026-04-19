"use client";

import React, { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
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
import { Upload, Download, Grid3X3, Columns3, Type, Image as ImageIcon, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

function SortableThumb({ image, showNames, ratioClass }) {
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
      className={`group cursor-grab active:cursor-grabbing ${isDragging ? "opacity-70" : ""}`}
    >
      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-2 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur-sm transition duration-300 hover:border-white/20 hover:bg-white/[0.06]">
        <div className={`relative overflow-hidden rounded-[18px] bg-neutral-900 ${ratioClass}`}>
          <img
            src={image.src}
            alt={image.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5" />
        </div>
        {showNames && (
          <div className="px-1 pb-1 pt-3">
            <p className="truncate text-[11px] font-medium tracking-[0.18em] text-neutral-300 uppercase">
              {image.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LuxurySheetBuilder() {
  const [images, setImages] = useState([]);
  const [columns, setColumns] = useState(4);
  const [gap, setGap] = useState(14);
  const [padding, setPadding] = useState(24);
  const [showNames, setShowNames] = useState(true);
  const [title, setTitle] = useState("Nico Salgado — Proof Sheet");
  const [subtitle, setSubtitle] = useState("Curated image selection");
  const [aspect, setAspect] = useState("4:5");
  const previewRef = useRef(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const ratioClass = useMemo(() => {
    if (aspect === "1:1") return "aspect-square";
    if (aspect === "3:4") return "aspect-[3/4]";
    if (aspect === "16:9") return "aspect-video";
    return "aspect-[4/5]";
  }, [aspect]);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const next = files.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      name: file.name.replace(/\.[^/.]+$/, ""),
      src: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...next]);
  };

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);
    setImages((items) => arrayMove(items, oldIndex, newIndex));
  };

  const exportPNG = async () => {
    if (!previewRef.current) return;
    const canvas = await html2canvas(previewRef.current, {
      backgroundColor: "#0a0a0a",
      scale: 2,
      useCORS: true,
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "luxury-proof-sheet.png";
    link.click();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(180,155,95,0.18),_transparent_28%),linear-gradient(180deg,_#090909_0%,_#111111_100%)] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1700px] grid-cols-1 gap-6 p-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl xl:sticky xl:top-5 xl:h-[calc(100vh-40px)] overflow-hidden rounded-[32px]">
          <CardHeader className="border-b border-white/10 pb-5">
            <div className="mb-3 flex items-center justify-between">
              <Badge className="rounded-full border border-[#b49b5f]/30 bg-[#b49b5f]/10 px-3 py-1 text-[10px] tracking-[0.22em] text-[#dcc58b] uppercase hover:bg-[#b49b5f]/10">
                Luxury Builder
              </Badge>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] tracking-[0.22em] text-neutral-300 uppercase">
                {images.length} images
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-white">
              Proof Sheet Studio
            </CardTitle>
            <p className="mt-2 text-sm leading-6 text-neutral-400">
              Clean, premium contact sheets with live preview, drag-to-reorder, and export.
            </p>
          </CardHeader>

          <CardContent className="space-y-6 overflow-y-auto p-5">
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-[0.24em] text-neutral-400">Upload images</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] px-5 py-8 text-center transition hover:border-[#b49b5f]/40 hover:bg-white/[0.05]">
                <Upload className="mb-3 h-6 w-6 text-[#dcc58b]" />
                <span className="text-sm font-medium text-white">Drop files here or browse</span>
                <span className="mt-1 text-xs text-neutral-400">JPG, PNG, WEBP</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
            </div>

            <Separator className="bg-white/10" />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-[#dcc58b]" />
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Branding</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-neutral-300">Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-neutral-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-neutral-300">Subtitle</Label>
                <Input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="h-11 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-neutral-500"
                />
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#dcc58b]" />
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Layout</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm text-neutral-300">Columns</Label>
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={columns}
                    onChange={(e) => setColumns(Math.max(1, Math.min(8, Number(e.target.value) || 1)))}
                    className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-neutral-300">Aspect</Label>
                  <Select value={aspect} onValueChange={setAspect}>
                    <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-white/5 text-white">
                      <SelectValue placeholder="Select aspect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4:5">Headshot 4:5</SelectItem>
                      <SelectItem value="3:4">Portrait 3:4</SelectItem>
                      <SelectItem value="1:1">Square 1:1</SelectItem>
                      <SelectItem value="16:9">Wide 16:9</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-neutral-300">Gap</Label>
                  <span className="text-xs tracking-[0.2em] text-neutral-500 uppercase">{gap}px</span>
                </div>
                <Slider value={[gap]} min={0} max={32} step={1} onValueChange={(v) => setGap(v[0])} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-neutral-300">Canvas padding</Label>
                  <span className="text-xs tracking-[0.2em] text-neutral-500 uppercase">{padding}px</span>
                </div>
                <Slider value={[padding]} min={0} max={60} step={2} onValueChange={(v) => setPadding(v[0])} />
              </div>

              <div className="flex items-center justify-between rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">Show image names</p>
                  <p className="text-xs text-neutral-400">Display a clean caption under each image</p>
                </div>
                <Switch checked={showNames} onCheckedChange={setShowNames} />
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={exportPNG}
                className="h-12 rounded-2xl bg-[#b49b5f] text-black hover:bg-[#cdb06d]"
              >
                <Download className="mr-2 h-4 w-4" />
                Export PNG
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => setImages([])}
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex min-w-0 items-center justify-center rounded-[32px] border border-white/10 bg-black/20 p-4 shadow-2xl backdrop-blur-sm">
          <div className="w-full overflow-auto rounded-[28px] p-4">
            <div
              ref={previewRef}
              className="mx-auto w-full max-w-[1100px] rounded-[34px] border border-white/10 bg-[#0b0b0b] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.5)]"
            >
              <div className="mb-7 rounded-[28px] border border-[#b49b5f]/20 bg-[linear-gradient(135deg,rgba(180,155,95,0.16),rgba(255,255,255,0.03))] p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="mb-3 text-[10px] tracking-[0.35em] text-[#dcc58b] uppercase">Curated Selection</p>
                    <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{title}</h1>
                    <p className="mt-2 text-sm text-neutral-300">{subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] tracking-[0.25em] text-neutral-300 uppercase">
                      {images.length} frames
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] tracking-[0.25em] text-neutral-300 uppercase">
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
                  <h3 className="mt-5 text-xl font-medium text-white">Your proof sheet starts here</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-neutral-400">
                    Upload images on the left, then drag to reorder. The layout is tuned for a clean luxury presentation instead of a generic utility interface.
                  </p>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
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
        </div>
      </div>
    </div>
  );
}
