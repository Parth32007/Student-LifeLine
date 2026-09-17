import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  Trash2,
  Calendar,
  AlertCircle,
  Kanban,
  List as ListIcon
} from 'lucide-react';
import { api } from '../services/api';
import { Assignment, Subject } from '../types';

export const Assignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('high');
  const [estimatedHours, setEstimatedHours] = useState(2.0);
  const [description, setDescription] = useState('');

  const fetchAssignmentsAndSubjects = async () => {
    try {
      setLoading(true);
      const [aData, sData] = await Promise.all([
        api.listAssignments(),
        api.listSubjects(),
      ]);
      setAssignments(aData);
      setSubjects(sData);
      if (sData.length > 0 && !subjectId) setSubjectId(sData[0].id);
    } catch (e) {
      console.warn('Assignments fetch notice', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentsAndSubjects();
    // Default due date: tomorrow
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setDueDate(d.toISOString().slice(0, 16));
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    try {
      const created = await api.createAssignment({
        title,
        subject_id: subjectId || undefined,
        due_date: new Date(dueDate).toISOString(),
        priority,
        estimated_effort_hours: Number(estimatedHours),
        description: description || undefined,
        status: 'todo',
      });
      setAssignments((prev) => [created, ...prev]);
      setShowAddModal(false);
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error('Failed to create assignment', err);
    }
  };

  const handleUpdateStatus = async (assignmentId: string, newStatus: 'todo' | 'in_progress' | 'completed') => {
    try {
      const updated = await api.updateAssignment(assignmentId, { status: newStatus });
      setAssignments((prev) => prev.map((a) => (a.id === assignmentId ? updated : a)));
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      await api.deleteAssignment(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error('Failed to delete assignment', e);
    }
  };

  const columns: { id: 'todo' | 'in_progress' | 'completed'; label: string }[] = [
    { id: 'todo', label: 'To Do' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
            <CheckSquare className="h-4 w-4" />
            <span>Academic Task & Deadline Manager</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Assignments & Deadlines
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track coursework deadlines, manage subtasks, and rebalance daily study missions around due dates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-secondary rounded-xl p-1 border border-border">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'board' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
              title="List View"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shadow-indigo-500/25"
          >
            <Plus className="h-4 w-4" />
            <span>Add Assignment</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div className="py-16 text-center space-y-3 rounded-3xl bg-card border border-border">
          <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold text-foreground">No assignments logged</h3>
          <p className="text-xs text-muted-foreground">Log upcoming projects, lab reports, and assignments.</p>
        </div>
      ) : viewMode === 'board' ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {columns.map((col) => {
            const colAssignments = assignments.filter((a) => a.status === col.id);
            return (
              <div key={col.id} className="rounded-3xl bg-card border border-border p-4 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{col.label}</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                      {colAssignments.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 min-h-[200px]">
                  {colAssignments.map((a) => (
                    <div
                      key={a.id}
                      className="p-4 rounded-2xl bg-secondary/40 border border-border/80 space-y-2.5 hover:border-primary/50 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        {a.subject_name && (
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-white"
                            style={{ backgroundColor: a.subject_color || '#3B82F6' }}
                          >
                            {a.subject_name}
                          </span>
                        )}
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            a.priority === 'urgent'
                              ? 'bg-rose-500/10 text-rose-400'
                              : a.priority === 'high'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          {a.priority}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-foreground leading-snug">{a.title}</h4>
                      {a.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                      )}

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-indigo-400" />
                          {new Date(a.due_date).toLocaleDateString()}
                        </span>
                        <span>{a.estimated_effort_hours}h work</span>
                      </div>

                      {/* Move Status Controls */}
                      <div className="pt-1 flex gap-1 justify-end">
                        {col.id !== 'todo' && (
                          <button
                            onClick={() => handleUpdateStatus(a.id, 'todo')}
                            className="px-2 py-0.5 rounded bg-card text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            ← To Do
                          </button>
                        )}
                        {col.id !== 'in_progress' && (
                          <button
                            onClick={() => handleUpdateStatus(a.id, 'in_progress')}
                            className="px-2 py-0.5 rounded bg-card text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            {col.id === 'todo' ? 'Start →' : '← Active'}
                          </button>
                        )}
                        {col.id !== 'completed' && (
                          <button
                            onClick={() => handleUpdateStatus(a.id, 'completed')}
                            className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20"
                          >
                            Done ✓
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAssignment(a.id)}
                          className="p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-3xl bg-card border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {assignments.map((a) => (
              <div key={a.id} className="p-4 flex items-center justify-between gap-4 hover:bg-secondary/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {a.subject_name && (
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-white"
                        style={{ backgroundColor: a.subject_color || '#3B82F6' }}
                      >
                        {a.subject_name}
                      </span>
                    )}
                    <span className="text-sm font-bold text-foreground">{a.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary uppercase text-muted-foreground">
                      {a.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-3">
                    <span>Due: {new Date(a.due_date).toLocaleString()}</span>
                    <span>•</span>
                    <span>Effort: {a.estimated_effort_hours}h</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteAssignment(a.id)}
                  className="p-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Add Assignment / Project</h3>
            <form onSubmit={handleCreateAssignment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. DBMS Normalization Case Study Report"
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Course</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Due Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Estimated Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="40"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Submission instructions, portal link..."
                  className="w-full p-3 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
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
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
