"use client";

import { useState } from "react";
import Link from "next/link";
import { PREBUILT_TEMPLATES, TemplateCategory } from "@/lib/templates";
import { Search, Plus, Stethoscope, ChevronRight } from "lucide-react";

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "All">("All");

  const categories = ["All", ...Array.from(new Set(PREBUILT_TEMPLATES.map(t => t.category)))];

  const filtered = PREBUILT_TEMPLATES.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-screen-xl mx-auto px-5 sm:px-8 py-10 font-inter">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-nq-border mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-nq-text tracking-tight">
            Templates
          </h1>
          <p className="text-sm text-nq-text-muted mt-2">
            Select a prebuilt medical procedure to quickly generate a consent form.
          </p>
        </div>
        <Link
          href="/generate"
          className="nq-btn-primary py-2.5 px-6 text-sm"
        >
          <Plus className="w-4 h-4" />
          Blank Form
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-nq-text-light" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates (e.g., Appendectomy, Cataract)..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-nq-border bg-white text-nq-text placeholder-nq-text-light outline-none focus:border-nq-purple focus:ring-1 focus:ring-nq-purple transition-all text-sm font-medium"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as any)}
          className="px-4 py-3 rounded-xl border border-nq-border bg-white text-nq-text outline-none focus:border-nq-purple focus:ring-1 focus:ring-nq-purple transition-all text-sm font-medium sm:w-56 appearance-none cursor-pointer"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      {filtered.length === 0 ? (
        <div className="nq-card nq-noise text-center py-16 px-4">
          <h3 className="text-lg font-bold text-nq-text mb-2">No templates found</h3>
          <p className="text-sm text-nq-text-muted">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((template) => (
            <Link
              key={template.id}
              href={`/generate?templateId=${template.id}`}
              className="nq-card p-6 flex flex-col hover:border-nq-purple/40 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-nq-purple-soft flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-nq-purple" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-nq-purple bg-nq-purple-soft px-2 py-1 rounded-lg">
                  {template.category}
                </span>
              </div>
              <h3 className="text-lg font-black text-nq-text tracking-tight mb-2 group-hover:text-nq-purple transition-colors">
                {template.title}
              </h3>
              <p className="text-sm text-nq-text-muted flex-1 mb-4 leading-relaxed line-clamp-3">
                {template.description}
              </p>
              <div className="flex items-center text-sm font-bold text-nq-purple pt-4 border-t border-nq-border">
                Use Template
                <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
