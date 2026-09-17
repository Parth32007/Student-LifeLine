import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  ListTree,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  GraduationCap
} from 'lucide-react';
import { useSubjects } from '../context/SubjectContext';
import { Subject, SubjectUnit } from '../types';

export const Subjects: React.FC = () => {
  const { subjects, loading, createSubject, updateSubject, deleteSubject, updateSubjectSyllabus } = useSubjects();

  // Create Subject State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [targetGrade, setTargetGrade] = useState('A');
  const [credits, setCredits] = useState(4);
  const [unitsInput, setUnitsInput] = useState<Array<{ title: string; topics: string }>>([
    { title: 'Unit 1: Fundamentals & Invariants', topics: 'Introduction, Core Properties, Axioms' },
    { title: 'Unit 2: Architectural Structures', topics: 'Component Hierarchy, Internal Pipelines' },
    { title: 'Unit 3: Applied Systems & Optimizations', topics: 'Performance Profiling, Trade-offs' },
    { title: 'Unit 4: Advanced Principles & Scaling', topics: 'Distributed Execution, High Availability' },
    { title: 'Unit 5: Real-World Case Studies', topics: 'Production Design, Failure Recovery' },
  ]);

  // Syllabus Editor Modal State
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [syllabusModalOpen, setSyllabusModalOpen] = useState(false);
  const [editingUnits, setEditingUnits] = useState<Array<{ title: string; topicsText: string }>>([]);

  // Toast Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAddUnitField = () => {
    const nextNum = unitsInput.length + 1;
    setUnitsInput([...unitsInput, { title: `Unit ${nextNum}: New Topic Area`, topics: '' }]);
  };

  const handleRemoveUnitField = (index: number) => {
    if (unitsInput.length <= 1) return;
    setUnitsInput(unitsInput.filter((_, i) => i !== index));
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const formattedUnits = unitsInput
        .filter((u) => u.title.trim())
        .map((u, idx) => ({
          unit_number: idx + 1,
          title: u.title.trim(),
          description: `Key unit syllabus for ${u.title.trim()}`,
          topics: u.topics
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }));

      await createSubject({
        name: name.trim(),
        color,
        target_grade: targetGrade,
        credits: Number(credits),
        syllabus_topics: formattedUnits.map((u) => u.title),
        units: formattedUnits.map((u, i) => ({
          id: `unit-${Date.now()}-${i + 1}`,
          subject_id: '',
          unit_number: u.unit_number,
          title: u.title,
          description: u.description,
          topics: u.topics,
        })),
      });

      setShowAddModal(false);
      setName('');
      setUnitsInput([
        { title: 'Unit 1: Fundamentals & Invariants', topics: 'Introduction, Core Properties, Axioms' },
        { title: 'Unit 2: Architectural Structures', topics: 'Component Hierarchy, Internal Pipelines' },
        { title: 'Unit 3: Applied Systems & Optimizations', topics: 'Performance Profiling, Trade-offs' },
        { title: 'Unit 4: Advanced Principles & Scaling', topics: 'Distributed Execution, High Availability' },
        { title: 'Unit 5: Real-World Case Studies', topics: 'Production Design, Failure Recovery' },
      ]);
      showToast('success', `Subject "${name.trim()}" and its syllabus units have been synchronized application-wide!`);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to create subject.');
    }
  };

  const openSyllabusEditor = (subj: Subject) => {
    setSelectedSubject(subj);
    if (subj.units && subj.units.length > 0) {
      setEditingUnits(
        subj.units.map((u) => ({
          title: u.title,
          topicsText: Array.isArray(u.topics) ? u.topics.join(', ') : '',
        }))
      );
    } else if (subj.syllabus_topics && subj.syllabus_topics.length > 0) {
      setEditingUnits(
        subj.syllabus_topics.map((t, idx) => ({
          title: t.startsWith('Unit') ? t : `Unit ${idx + 1}: ${t}`,
          topicsText: 'Key Principles, Standard Problems',
        }))
      );
    } else {
      setEditingUnits([
        { title: 'Unit 1: Core Fundamentals', topicsText: 'Introduction, Definitions' },
        { title: 'Unit 2: Applied Methodologies', topicsText: 'Implementation, Optimization' },
      ]);
    }
    setSyllabusModalOpen(true);
  };

  const handleSaveSyllabus = async () => {
    if (!selectedSubject) return;

    try {
      const unitsToSave = editingUnits
        .filter((u) => u.title.trim())
        .map((u, idx) => ({
          unit_number: idx + 1,
          title: u.title.trim(),
          description: `Syllabus specifications for ${u.title.trim()}`,
          topics: u.topicsText
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }));

      await updateSubjectSyllabus(selectedSubject.id, unitsToSave);
      setSyllabusModalOpen(false);
      showToast('success', `Syllabus for "${selectedSubject.name}" updated and synchronized across all learning modules!`);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update syllabus.');
    }
  };

  const handleDeleteSubject = async (id: string, subName: string) => {
    if (!confirm(`Are you sure you want to remove "${subName}"? All associated units will also be deleted.`)) return;
    try {
      await deleteSubject(id);
      showToast('success', `Subject "${subName}" removed.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete subject.');
    }
  };

  const colorOptions = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#6366F1'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md transition-all animate-in slide-in-from-top-2 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
            <BookOpen className="h-4 w-4" />
            <span>Curriculum & Knowledge Base</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Course Subjects & Syllabus
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Centralized academic source of truth. Every unit directly powers your AI Tutor, Flashcard Decks, and Timed Quizzes.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shadow-indigo-500/25 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Subject</span>
        </button>
      </div>

      {/* Subject List Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-muted-foreground space-y-3">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Synchronizing centralized subjects & syllabus...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="py-16 text-center space-y-3 rounded-3xl bg-card border border-border p-8">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
          <h3 className="text-base font-bold text-foreground">No subjects found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Click "Add New Subject" to configure your semester modules, syllabus units, and target grades.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {subjects.map((subj) => {
            const units = subj.units || [];
            return (
              <div
                key={subj.id}
                className="rounded-3xl bg-card border border-border p-6 space-y-4 hover:shadow-xl hover:border-indigo-500/30 transition-all relative overflow-hidden flex flex-col justify-between"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-2"
                  style={{ backgroundColor: subj.color || '#3B82F6' }}
                />

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div>
                      <h3 className="text-xl font-bold text-foreground tracking-tight">
                        {subj.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground text-[11px] font-bold">
                          Target Grade {subj.target_grade || 'A'}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {subj.credits || 4} Credits
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openSyllabusEditor(subj)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-colors"
                        title="Edit Syllabus Units"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Syllabus</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(subj.id, subj.name)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                        title="Delete subject"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Units Section */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <ListTree className="h-3.5 w-3.5 text-indigo-400" />
                        Syllabus Units ({units.length > 0 ? units.length : subj.syllabus_topics?.length || 0})
                      </span>
                      <span className="text-[10px] text-indigo-400 font-normal">Auto-Synced</span>
                    </div>

                    {units.length > 0 ? (
                      <div className="space-y-2">
                        {units.slice(0, 5).map((unit, idx) => (
                          <div
                            key={unit.id || idx}
                            className="p-2.5 rounded-2xl bg-secondary/40 border border-border/50 text-xs space-y-1"
                          >
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              {unit.title}
                            </div>
                            {unit.topics && unit.topics.length > 0 && (
                              <div className="flex flex-wrap gap-1 pl-3">
                                {unit.topics.map((tp, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="px-1.5 py-0.5 rounded bg-background/60 text-[10px] text-muted-foreground font-mono"
                                  >
                                    {tp}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : subj.syllabus_topics && subj.syllabus_topics.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {subj.syllabus_topics.map((top, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-xl bg-secondary/60 text-xs text-foreground font-medium"
                          >
                            {top}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No syllabus uploaded yet. Click "Syllabus" to add units.</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Ready
                  </span>
                  <button
                    onClick={() => openSyllabusEditor(subj)}
                    className="text-xs text-indigo-400 hover:underline font-semibold"
                  >
                    Manage Units →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-5 scrollbar-thin">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">Add New Academic Subject</h3>
                <p className="text-xs text-muted-foreground">Create a course module and define its syllabus units.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Computer Networks"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Target Grade</label>
                  <select
                    value={targetGrade}
                    onChange={(e) => setTargetGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    {['A+', 'A', 'A-', 'B+', 'B', 'Pass'].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Units Input List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Syllabus Units & Topics ({unitsInput.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddUnitField}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Unit
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {unitsInput.map((unit, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-secondary/30 border border-border/60 space-y-2 relative">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          required
                          value={unit.title}
                          onChange={(e) => {
                            const updated = [...unitsInput];
                            updated[idx].title = e.target.value;
                            setUnitsInput(updated);
                          }}
                          placeholder={`Unit ${idx + 1} Title`}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                        />
                        {unitsInput.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveUnitField(idx)}
                            className="text-muted-foreground hover:text-destructive p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={unit.topics}
                        onChange={(e) => {
                          const updated = [...unitsInput];
                          updated[idx].topics = e.target.value;
                          setUnitsInput(updated);
                        }}
                        placeholder="Topics (comma separated, e.g. OSI Model, TCP/IP, Sockets)"
                        className="w-full px-2.5 py-1 rounded-lg bg-background border border-border text-[11px] text-muted-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Color Accent</label>
                <div className="flex gap-2.5">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${
                        color === c ? 'scale-110 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-indigo-500/25"
                >
                  Create & Synchronize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Syllabus Modal */}
      {syllabusModalOpen && selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-5 scrollbar-thin">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Manage Syllabus — {selectedSubject.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Update syllabus units. Changes automatically propagate to the AI Tutor, Flashcards, and Quizzes.
                </p>
              </div>
              <button
                onClick={() => setSyllabusModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Units ({editingUnits.length})
                </span>
                <button
                  onClick={() =>
                    setEditingUnits([
                      ...editingUnits,
                      { title: `Unit ${editingUnits.length + 1}: New Unit`, topicsText: '' },
                    ])
                  }
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Unit
                </button>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {editingUnits.map((u, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 space-y-2 relative">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-400">#{idx + 1}</span>
                      <input
                        type="text"
                        value={u.title}
                        onChange={(e) => {
                          const updated = [...editingUnits];
                          updated[idx].title = e.target.value;
                          setEditingUnits(updated);
                        }}
                        placeholder="Unit Title"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                      />
                      {editingUnits.length > 1 && (
                        <button
                          onClick={() => setEditingUnits(editingUnits.filter((_, i) => i !== idx))}
                          className="text-muted-foreground hover:text-destructive p-1"
                          title="Remove unit"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">
                        Topics (comma separated)
                      </label>
                      <textarea
                        rows={2}
                        value={u.topicsText}
                        onChange={(e) => {
                          const updated = [...editingUnits];
                          updated[idx].topicsText = e.target.value;
                          setEditingUnits(updated);
                        }}
                        placeholder="e.g. Dynamic Programming, Bellman-Ford, Tree Rotations"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setSyllabusModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSyllabus}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-indigo-500/25"
              >
                Save & Synchronize Syllabus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
