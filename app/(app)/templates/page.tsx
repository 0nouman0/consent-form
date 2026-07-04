"use client";

import { useState } from "react";
import Link from "next/link";
import { PREBUILT_TEMPLATES, RESEARCH_TEMPLATES, TemplateCategory, ResearchCategory } from "@/lib/templates";
import { MagnifyingGlass, Plus, Stethoscope, CaretRight, BookOpen } from "@phosphor-icons/react/dist/ssr";

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState<"surgical" | "research">("surgical");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const surgicalCategories = ["All", ...Array.from(new Set(PREBUILT_TEMPLATES.map((t) => t.category)))];
  const researchCategories = ["All", ...Array.from(new Set(RESEARCH_TEMPLATES.map((t) => t.category)))];
  const categories = activeTab === "surgical" ? surgicalCategories : researchCategories;

  const handleTabChange = (tab: "surgical" | "research") => {
    setActiveTab(tab);
    setSelectedCategory("All");
  };

  const filteredSurgical = PREBUILT_TEMPLATES.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.procedureName.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (selectedCategory === "All" || t.category === selectedCategory);
  });

  const filteredResearch = RESEARCH_TEMPLATES.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.studyTitle.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (selectedCategory === "All" || t.category === selectedCategory);
  });

  const filtered = activeTab === "surgical" ? filteredSurgical : filteredResearch;

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 font-body" style={{ backgroundColor: "var(--paper)" }}>
      <div className="max-w-screen-xl mx-auto space-y-4">

        {/* Page Header Card */}
        <div className="rounded-md px-6 sm:px-8 py-6 sm:py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: "var(--ink-muted)" }}>Library</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
              Template <span style={{ color: "var(--red)" }}>library</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>
              Select a prebuilt template to quickly generate a consent form.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/generate?formType=surgical"
              className="inline-flex items-center gap-2 rounded-md text-sm font-medium transition-all px-4 py-2 whitespace-nowrap"
              style={{ border: "1px solid var(--rule)", color: "var(--ink)" }}
            >
              Surgical Form
            </Link>
            <Link
              href="/generate?formType=research"
              className="inline-flex items-center gap-2 rounded-md text-sm font-medium transition-all pl-4 pr-2 py-2 hover:opacity-90 whitespace-nowrap"
              style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
            >
              Research Form
              <span className="flex items-center justify-center w-6 h-6 rounded-md" style={{ backgroundColor: "rgba(252,251,247,0.15)" }}>
                <Plus className="w-3 h-3" weight="bold" style={{ color: "var(--sheet)" }} />
              </span>
            </Link>
          </div>
        </div>

        {/* Tabs + Search + Filter row */}
        <div className="rounded-md overflow-hidden" style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
          {/* Tab switcher */}
          <div className="flex px-6 sm:px-8" style={{ borderBottom: "1px solid var(--rule)" }}>
            <button
              onClick={() => handleTabChange("surgical")}
              className={`px-0 mr-6 py-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "surgical"
                  ? "border-[var(--ink)] text-[var(--ink)]"
                  : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-soft)]"
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              Surgical &amp; Clinical ({PREBUILT_TEMPLATES.length})
            </button>
            <button
              onClick={() => handleTabChange("research")}
              className={`px-0 py-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "research"
                  ? "border-[var(--ink)] text-[var(--ink)]"
                  : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-soft)]"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Research Studies ({RESEARCH_TEMPLATES.length})
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 px-6 sm:px-8 py-4" style={{ borderBottom: "1px solid var(--rule)" }}>
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ink-muted)" }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  activeTab === "surgical"
                    ? "Search templates (e.g. Appendectomy, Cataract)..."
                    : "Search research templates (e.g. AETCOM, Vaccine Trial)..."
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-md text-sm outline-none transition-all placeholder:text-[var(--ink-muted)] focus:ring-2 focus:ring-[rgba(23,20,16,0.08)] focus:border-[var(--ink)]"
                style={{ border: "1px solid var(--rule)", color: "var(--ink)", backgroundColor: "var(--paper)" }}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 rounded-md text-sm outline-none transition-all sm:w-52 appearance-none cursor-pointer"
              style={{ border: "1px solid var(--rule)", color: "var(--ink)", backgroundColor: "var(--paper)" }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Templates grid */}
          <div className="p-6 sm:p-8">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-md flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--paper)" }}>
                  <FileIcon className="w-5 h-5" style={{ color: "var(--ink-muted)" }} />
                </div>
                <h3 className="text-base font-semibold mb-1" style={{ color: "var(--ink)" }}>No templates found</h3>
                <p className="text-sm" style={{ color: "var(--ink-muted)" }}>Try adjusting your search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((template) => (
                  <Link
                    key={template.id}
                    href={`/generate?formType=${activeTab}&templateId=${template.id}`}
                    className="rounded-md p-6 flex flex-col group hover:-translate-y-0.5 transition-all duration-200"
                    style={{
                      border: "1px solid var(--rule)",
                      backgroundColor: "var(--paper)",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--sheet)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--paper)")}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--sheet)" }}>
                        {activeTab === "surgical" ? (
                          <Stethoscope className="w-5 h-5" style={{ color: "var(--ink-muted)" }} />
                        ) : (
                          <BookOpen className="w-5 h-5" style={{ color: "var(--ink-muted)" }} />
                        )}
                      </div>
                      <span className="font-mono text-[11px] uppercase tracking-[0.06em] font-semibold px-2.5 py-1 rounded-md" style={{ color: "var(--ink-muted)", backgroundColor: "var(--sheet)" }}>
                        {template.category}
                      </span>
                    </div>
                    <h3 className="font-serif text-base font-semibold tracking-tight mb-2 line-clamp-1" style={{ color: "var(--ink)" }}>
                      {template.title}
                    </h3>
                    <p className="text-sm flex-1 mb-4 leading-relaxed line-clamp-3" style={{ color: "var(--ink-muted)" }}>
                      {template.description}
                    </p>
                    <div className="flex items-center text-sm font-semibold pt-4 text-[var(--ink-soft)] group-hover:text-[var(--ink)] transition-colors"
                      style={{ borderTop: "1px solid var(--rule)" }}>
                      Use Template
                      <CaretRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline fallback icon
function FileIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}
