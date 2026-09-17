import React, { useState, useEffect } from 'react';
import {
  Code2,
  Plus,
  Flame,
  Bug,
  Lightbulb,
  Cpu,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { CodingProblem } from '../types';

export const CodingPractice: React.FC = () => {
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Assistant State
  const [assistantCode, setAssistantCode] = useState('');
  const [assistantLang, setAssistantLang] = useState('Python');
  const [assistantQueryType, setAssistantQueryType] = useState('give_hint');
  const [assistantAnalysis, setAssistantAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // New Problem Form
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('LeetCode');
  const [url, setUrl] = useState('');
  const [topic, setTopic] = useState('Arrays');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [notes, setNotes] = useState('');

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const data = await api.listCodingProblems();
      setProblems(data);
    } catch (e) {
      console.warn('Coding problems fetch notice', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !topic.trim()) return;

    try {
      const created = await api.createCodingProblem({
        title,
        platform,
        url: url || undefined,
        topic,
        difficulty,
        notes: notes || undefined,
        status: 'solved',
      });
      setProblems((prev) => [created, ...prev]);
      setShowAddModal(false);
      setTitle('');
      setUrl('');
      setNotes('');
    } catch (err) {
      console.error('Failed to create problem', err);
    }
  };

  const handleDeleteProblem = async (id: string) => {
    try {
      await api.deleteCodingProblem(id);
      setProblems((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error('Failed to delete problem', e);
    }
  };

  const handleRunAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantCode.trim() || analyzing) return;

    setAnalyzing(true);
    setAssistantAnalysis(null);
    try {
      const res = await api.codeAssist(assistantCode, assistantLang, assistantQueryType);
      setAssistantAnalysis(res);
    } catch (e: any) {
      alert(`Code Assistant Error: ${e.message || 'Failed'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const dsaTopics = ['Arrays', 'Two Pointers', 'Sliding Window', 'Binary Search', 'Trees', 'Graphs', 'Dynamic Programming', 'Tries'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Code2 className="h-4 w-4" />
            <span>DSA & Algorithmic Practice</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Coding Practice Tracker & AI Mentor
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log LeetCode & Codeforces problems, maintain your daily coding streak, and request progressive hints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
            <Flame className="h-4 w-4 fill-amber-400" />
            <span>{problems.length} Solved</span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shadow-indigo-500/25"
          >
            <Plus className="h-4 w-4" />
            <span>Log Solved Problem</span>
          </button>
        </div>
      </div>

      {/* Grid: Problems List + In-Browser Code Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Problems List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="text-xs font-bold uppercase text-muted-foreground tracking-wider px-1">
            Logged Problems ({problems.length})
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Loading coding history...</div>
          ) : problems.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-card border border-dashed border-border text-xs text-muted-foreground space-y-2">
              <Code2 className="h-8 w-8 mx-auto text-muted-foreground" />
              <p>No coding problems logged yet.</p>
              <p className="text-[11px]">Log solved LeetCode/DSA problems to track streaks and weak patterns.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {problems.map((prob) => (
                <div
                  key={prob.id}
                  className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-3 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                      {prob.platform.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground truncate">{prob.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            prob.difficulty === 'easy'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : prob.difficulty === 'medium'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {prob.difficulty}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        <span className="font-semibold text-indigo-400">{prob.topic}</span>
                        <span>•</span>
                        <span>{prob.platform}</span>
                        {prob.solved_at && (
                          <>
                            <span>•</span>
                            <span>{prob.solved_at}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {prob.url && (
                      <a
                        href={prob.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        title="Open problem link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteProblem(prob.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Coding Assistant Panel */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase text-muted-foreground tracking-wider px-1">
            AI Code Mentor & Hint System
          </div>

          <div className="rounded-3xl bg-card border border-border p-5 space-y-4">
            <form onSubmit={handleRunAssistant} className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={assistantQueryType}
                  onChange={(e) => setAssistantQueryType(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                >
                  <option value="give_hint">💡 Give me a hint</option>
                  <option value="find_bug">🐛 Find bug / issue</option>
                  <option value="optimize_complexity">⚡ Optimize complexity</option>
                  <option value="explain">📖 Explain line-by-line</option>
                </select>

                <select
                  value={assistantLang}
                  onChange={(e) => setAssistantLang(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                >
                  <option value="Python">Python</option>
                  <option value="Java">Java</option>
                  <option value="C++">C++</option>
                  <option value="JavaScript">JavaScript</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Paste Code Snippet
                </label>
                <textarea
                  rows={6}
                  required
                  value={assistantCode}
                  onChange={(e) => setAssistantCode(e.target.value)}
                  placeholder="def binary_search(arr, target):&#10;    low, high = 0, len(arr) - 1&#10;    ..."
                  className="w-full p-3 rounded-xl bg-secondary/50 border border-border text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={analyzing}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shadow-indigo-500/25 disabled:opacity-50"
              >
                {analyzing ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Run AI Analysis</span>
                  </>
                )}
              </button>
            </form>

            {/* Analysis Output */}
            {assistantAnalysis && (
              <div className="space-y-3 pt-3 border-t border-border/60 text-xs animate-in fade-in">
                {assistantAnalysis.complexity_analysis && (
                  <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono font-semibold">
                    {assistantAnalysis.complexity_analysis}
                  </div>
                )}

                <div className="space-y-1">
                  <div className="font-bold text-foreground">Analysis:</div>
                  <p className="text-muted-foreground leading-relaxed">
                    {assistantAnalysis.analysis}
                  </p>
                </div>

                {assistantAnalysis.hints && assistantAnalysis.hints.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="font-bold text-amber-400 flex items-center gap-1">
                      <Lightbulb className="h-3.5 w-3.5" />
                      <span>Progressive Hints:</span>
                    </div>
                    <ul className="space-y-1 text-muted-foreground pl-2">
                      {assistantAnalysis.hints.map((h: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-amber-400">•</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Problem Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Log Solved Problem</h3>
            <form onSubmit={handleCreateProblem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Problem Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 33. Search in Rotated Sorted Array"
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  >
                    {['LeetCode', 'Codeforces', 'HackerRank', 'GeeksforGeeks', 'CodeChef'].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Topic</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                >
                  {dsaTopics.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Problem URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://leetcode.com/problems/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Personal Key Takeaway</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Edge case: handled pivot duplicates with condition..."
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold"
                >
                  Log Problem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
