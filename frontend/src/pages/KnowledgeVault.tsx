import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderLock,
  Upload,
  Search,
  FileText,
  Trash2,
  Sparkles,
  Bot,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { DocumentItem, Subject, RAGCitation } from '../types';

export const KnowledgeVault: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RAGCitation[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);
  const navigate = useNavigate();

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const [dData, sData] = await Promise.all([
        api.listDocuments(selectedSubjectId || undefined),
        api.listSubjects(),
      ]);
      setDocuments(dData);
      setSubjects(sData);
      if (dData.length > 0 && !activeDoc) {
        setActiveDoc(dData[0]);
      }
    } catch (e) {
      console.warn('Knowledge vault fetch notice', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [selectedSubjectId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const doc = await api.uploadDocument(file, selectedSubjectId || undefined, file.name);
      setDocuments((prev) => [doc, ...prev]);
      setActiveDoc(doc);
      // Re-fetch after 4s to poll processing status
      setTimeout(fetchDocs, 4000);
    } catch (err: any) {
      alert(`Upload error: ${err.message || 'Failed to upload'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const results = await api.searchDocuments(searchQuery, selectedSubjectId || undefined);
      setSearchResults(results);
    } catch (err) {
      console.error('Vault search error', err);
    } finally {
      setSearching(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document from the vault?')) return;
    try {
      await api.deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (activeDoc?.id === docId) setActiveDoc(null);
    } catch (err) {
      console.error('Failed to delete document', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
            <FolderLock className="h-4 w-4" />
            <span>Smart Knowledge Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Academic Knowledge Repository
          </h1>
        </div>

        {/* Upload Button */}
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm cursor-pointer">
          <Upload className="h-4 w-4" />
          <span>{uploading ? 'Processing...' : 'Upload'}</span>
          <input
            type="file"
            accept=".pdf,.txt,.docx,.md"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Search & Subject Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Semantic search across document contents & concepts..."
            className="w-full pl-10 pr-20 py-2.5 rounded-2xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={searching}
            className="absolute right-2 top-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-colors"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-card border border-border text-xs text-foreground focus:outline-none shrink-0"
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Semantic Search Results Banner */}
      {searchResults && (
        <div className="rounded-3xl bg-secondary/40 border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-indigo-400">
              <Sparkles className="h-4 w-4" />
              <span>Semantic Search Matches ({searchResults.length})</span>
            </div>
            <button
              onClick={() => setSearchResults(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {searchResults.map((r, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-bold text-foreground">
                  <span>📄 {r.document_title}</span>
                  {r.page_number && <span className="font-mono text-indigo-400">Page {r.page_number}</span>}
                </div>
                <p className="text-muted-foreground leading-relaxed">"{r.snippet}"</p>
                <div className="pt-1 text-[11px] text-emerald-400 font-semibold">
                  Match relevance: {Math.round((r.similarity_score || 0.85) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="lg:col-span-1 space-y-2.5">
          <div className="text-xs font-bold uppercase text-muted-foreground tracking-wider px-1">
            Uploaded Materials ({documents.length})
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Loading vault documents...</div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-card border border-dashed border-border text-xs text-muted-foreground space-y-2">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
              <p>No documents uploaded yet.</p>
              <p className="text-[11px]">Upload PDFs or lecture notes to unlock RAG AI tutoring.</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setActiveDoc(doc)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  activeDoc?.id === doc.id
                    ? 'bg-secondary border-primary/50 shadow-sm'
                    : 'bg-card hover:bg-secondary/50 border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <FileText className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-foreground truncate">{doc.title}</div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        <span className="uppercase">{doc.file_type || 'PDF'}</span>
                        <span>•</span>
                        <span>{doc.subject_name || 'General'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        doc.status === 'ready'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : doc.status === 'processing'
                          ? 'bg-amber-500/10 text-amber-400 animate-pulse'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {doc.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Document Detail Preview & Key Takeaways */}
        <div className="lg:col-span-2">
          {activeDoc ? (
            <div className="rounded-3xl bg-card border border-border p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border gap-2">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{activeDoc.title}</h2>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Course: {activeDoc.subject_name || 'Academic Core'} • Status: {activeDoc.status}
                  </div>
                </div>

                <button
                  onClick={() => navigate('/tutor')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold transition-colors"
                >
                  <Bot className="h-4 w-4" />
                  <span>Ask AI Tutor About This</span>
                </button>
              </div>

              {/* AI Summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-indigo-400">
                  <Sparkles className="h-4 w-4" />
                  <span>AI Executive Summary</span>
                </div>
                <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-sm text-foreground leading-relaxed">
                  {activeDoc.summary || 'Processing document summary with Gemini...'}
                </div>
              </div>

              {/* Key Points */}
              {activeDoc.key_points && activeDoc.key_points.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Core Concepts Extracted
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeDoc.key_points.map((pt, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-secondary/30 text-xs text-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulas & Definitions */}
              {activeDoc.formulas_definitions && activeDoc.formulas_definitions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Extracted Definitions & Formulas
                  </div>
                  <div className="space-y-2">
                    {activeDoc.formulas_definitions.map((fd, i) => (
                      <div key={i} className="p-3 rounded-xl bg-secondary/40 border border-border/60 text-xs space-y-1">
                        <span className="font-bold text-foreground text-sm">{fd.name}</span>
                        <p className="text-muted-foreground">{fd.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[300px] flex items-center justify-center rounded-3xl bg-card border border-border text-center text-xs text-muted-foreground p-8">
              Select or upload a document to view its AI summary and indexed concepts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
