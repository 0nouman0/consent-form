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
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 font-body" style={{ backgroundColor: "#ededed" }}>
      <div className="max-w-screen-xl mx-auto space-y-4">

        {/* Page Header Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl px-6 sm:px-8 py-6 sm:py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">Library</p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "#0b0f1a", letterSpacing: "-0.02em" }}>
              Template <span className="font-serif italic font-normal text-neutral-600 font-instrument" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>library</span>
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Select a prebuilt template to quickly generate a consent form.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/generate?formType=surgical"
              className="inline-flex items-center gap-2 rounded-full text-sm font-medium transition-all px-4 py-2 whitespace-nowrap"
              style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#0b0f1a" }}
            >
              Surgical Form
            </Link>
            <Link
              href="/generate?formType=research"
              className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-white transition-all pl-4 pr-2 py-2 hover:opacity-90 whitespace-nowrap"
              style={{ backgroundColor: "#0b0f1a" }}
            >
              Research Form
              <span className="flex items-center justify-center w-6 h-6 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                <Plus className="w-3 h-3 text-white" weight="bold" />
              </span>
            </Link>
          </div>
        </div>

        {/* Tabs + Search + Filter row */}
        <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          {/* Tab switcher */}
          <div className="flex px-6 sm:px-8" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <button
              onClick={() => handleTabChange("surgical")}
              className={`px-0 mr-6 py-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "surgical"
                  ? "border-neutral-800 text-neutral-800"
                  : "border-transparent text-neutral-400 hover:text-neutral-700"
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              Surgical &amp; Clinical ({PREBUILT_TEMPLATES.length})
            </button>
            <button
              onClick={() => handleTabChange("research")}
              className={`px-0 py-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "research"
                  ? "border-neutral-800 text-neutral-800"
                  : "border-transparent text-neutral-400 hover:text-neutral-700"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Research Studies ({RESEARCH_TEMPLATES.length})
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 px-6 sm:px-8 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  activeTab === "surgical"
                    ? "Search templates (e.g. Appendectomy, Cataract)..."
                    : "Search research templates (e.g. AETCOM, Vaccine Trial)..."
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all text-neutral-800 placeholder-neutral-400 focus:ring-2 focus:ring-neutral-800/10 focus:border-neutral-800 bg-neutral-50"
                style={{ border: "1px solid rgba(0,0,0,0.08)" }}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm outline-none transition-all text-neutral-800 sm:w-52 appearance-none cursor-pointer bg-neutral-50"
              style={{ border: "1px solid rgba(0,0,0,0.08)" }}
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
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <FileIcon className="w-5 h-5 text-neutral-400" />
                </div>
                <h3 className="text-base font-semibold text-neutral-700 mb-1">No templates found</h3>
                <p className="text-sm text-neutral-500">Try adjusting your search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((template) => (
                  <Link
                    key={template.id}
                    href={`/generate?formType=${activeTab}&templateId=${template.id}`}
                    className="rounded-2xl p-6 flex flex-col group hover:-translate-y-0.5 transition-all duration-200"
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      backgroundColor: "#fafafa",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fff")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#fafafa")}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-neutral-100">
                        {activeTab === "surgical" ? (
                          <Stethoscope className="w-5 h-5 text-neutral-600" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-neutral-600" />
                        )}
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 px-2.5 py-1 rounded-full bg-neutral-100">
                        {template.category}
                      </span>
                    </div>
                    <h3 className="text-base font-bold tracking-tight mb-2 group-hover:text-neutral-900 transition-colors line-clamp-1" style={{ color: "#0b0f1a" }}>
                      {template.title}
                    </h3>
                    <p className="text-sm text-neutral-500 flex-1 mb-4 leading-relaxed line-clamp-3">
                      {template.description}
                    </p>
                    <div className="flex items-center text-sm font-semibold text-neutral-700 pt-4 group-hover:text-neutral-900 transition-colors"
                      style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
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
function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}
