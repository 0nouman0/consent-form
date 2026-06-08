"use client";

import { useState } from "react";
import Link from "next/link";
import { PREBUILT_TEMPLATES, TemplateCategory } from "@/lib/templates";
import { MagnifyingGlass, Plus, Stethoscope, CaretRight } from "@phosphor-icons/react/dist/ssr";

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "All">("All");

  const categories = ["All", ...Array.from(new Set(PREBUILT_TEMPLATES.map(t => t.category)))];
  const filtered = PREBUILT_TEMPLATES.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (selectedCategory === "All" || t.category === selectedCategory);
  });

  return (
    <div className="min-h-screen font-body" style={{ background: "hsl(var(--muted))" }}>
      <div className="max-w-screen-xl mx-auto px-5 sm:px-8 py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-border mb-8">
          <div>
            <h1 className="font-sans font-black text-4xl sm:text-5xl text-foreground tracking-tight">
              Templates
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-body">
              Select a prebuilt medical procedure to quickly generate a consent form.
            </p>
          </div>
          <Link href="/generate" className="btn-primary py-2.5 px-6 text-sm">
            <Plus className="w-4 h-4" /> Blank Form
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates (e.g., Appendectomy, Cataract)..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm font-body" />
          </div>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="px-4 py-3 rounded-xl border border-border bg-background text-foreground outline-none focus:border-primary transition-all text-sm font-body sm:w-56 appearance-none cursor-pointer">
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {/* Templates grid */}
        {filtered.length === 0 ? (
          <div className="bg-background border border-border rounded-2xl text-center py-16 px-4 shadow-card">
            <h3 className="font-sans font-bold text-xl text-foreground mb-2">No templates found</h3>
            <p className="text-sm text-muted-foreground font-body">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((template) => (
              <Link key={template.id} href={`/generate?templateId=${template.id}`}
                className="bg-background border border-border rounded-2xl p-6 flex flex-col shadow-card hover:border-primary/30 hover:shadow-card-hover transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "hsl(var(--primary) / 0.1)" }}>
                    <Stethoscope className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-1 rounded-lg"
                    style={{ background: "hsl(var(--primary) / 0.08)" }}>
                    {template.category}
                  </span>
                </div>
                <h3 className="font-sans font-bold text-xl text-foreground tracking-tight mb-2 group-hover:text-primary transition-colors">
                  {template.title}
                </h3>
                <p className="text-sm text-muted-foreground flex-1 mb-4 leading-relaxed line-clamp-3 font-body">
                  {template.description}
                </p>
                <div className="flex items-center text-sm font-semibold text-primary pt-4 border-t border-border font-body">
                  Use Template
                  <CaretRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
