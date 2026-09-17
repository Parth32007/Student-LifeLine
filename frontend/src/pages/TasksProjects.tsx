import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  Trash2,
  Calendar,
  AlertCircle,
  Kanban,
  List as ListIcon,
  FolderKanban,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  Layers,
  Sparkles,
  Users,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { api } from '../services/api';
import { Assignment, Subject } from '../types';

interface ProjectMilestone {
  id: string;
  title: string;
  completed: boolean;
}

interface Project {
  id: string;
  title: string;
  subject_name: string;
  subject_color: string;
  description: string;
  due_date: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed';
  progress: number;
  repo_url?: string;
  milestones: ProjectMilestone[];
  tech_stack: string[];
}

export const TasksProjects: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assignments' | 'projects'>('assignments');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);

  // Assignment Form State
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('high');
  const [estimatedHours, setEstimatedHours] = useState(2.0);
  const [description, setDescription] = useState('');

  // Sample Projects State with localStorage persistence
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('lifeos_academic_projects');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'proj-1',
        title: 'Distributed Key-Value Store with Raft Consensus',
        subject_name: 'Cloud Computing',
        subject_color: '#3B82F6',
        description: 'Fault-tolerant distributed store implementing leader election, log replication, and persistence invariants.',
        due_date: new Date(Date.now() + 14 * 86400000).toISOString(),
        status: 'in_progress',
        progress: 65,
        repo_url: 'https://github.com/academic/distributed-raft-kv',
        tech_stack: ['Go', 'Raft Protocol', 'gRPC', 'Docker'],
        milestones: [
          { id: 'm1', title: 'Leader Election & Heartbeat Timing', completed: true },
          { id: 'm2', title: 'Log Replication & Commit Index Verification', completed: true },
          { id: 'm3', title: 'Network Partition Fault-Tolerance Testing', completed: false },
          { id: 'm4', title: 'Benchmarking & Final Architecture Report', completed: false }
        ]
      },
      {
        id: 'proj-2',
        title: 'B+ Tree Index Engine with Buffer Pool Manager',
        subject_name: 'DBMS',
        subject_color: '#10B981',
        description: 'Storage engine supporting concurrent read/writes, leaf node splitting, and LRU-K cache eviction policy.',
        due_date: new Date(Date.now() + 21 * 86400000).toISOString(),
        status: 'planning',
        progress: 30,
        repo_url: 'https://github.com/academic/bplus-tree-engine',
        tech_stack: ['C++20', 'Disk Storage', 'Concurrency', 'GoogleTest'],
        milestones: [
          { id: 'm21', title: 'Disk Manager & Slotted-Page Frame Layout', completed: true },
          { id: 'm22', title: 'Buffer Pool LRU-K Replacement Algorithm', completed: false },
          { id: 'm23', title: 'B+ Tree Insert & Recursive Node Split', completed: false },
          { id: 'm24', title: 'Read/Write Latch Crabbing Protocol', completed: false }
        ]
      }
    ];
  });

  // Project Form State
  const [projTitle, setProjTitle] = useState('');
  const [projSubject, setProjSubject] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projDueDate, setProjDueDate] = useState('');
  const [projTech, setProjTech] = useState('');

  useEffect(() => {
    localStorage.setItem('lifeos_academic_projects', JSON.stringify(projects));
  }, [projects]);

  const fetchAssignmentsAndSubjects = async () => {
    try {
      setLoading(true);
      const [aData, sData] = await Promise.all([
        api.listAssignments(),
        api.listSubjects(),
      ]);
      setAssignments(aData);
      setSubjects(sData);
      if (sData.length > 0 && !subjectId) {
        setSubjectId(sData[0].id);
        setProjSubject(sData[0].name);
      }
    } catch (e) {
      console.warn('Assignments fetch notice', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentsAndSubjects();
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setDueDate(d.toISOString().slice(0, 16));
    setProjDueDate(d.toISOString().split('T')[0]);
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

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;

    const matchedSubj = subjects.find((s) => s.name === projSubject) || subjects[0];
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      title: projTitle.trim(),
      subject_name: matchedSubj ? matchedSubj.name : 'Computer Science',
      subject_color: matchedSubj ? (matchedSubj.color || '#3B82F6') : '#3B82F6',
      description: projDesc.trim() || 'Academic term project and implementation deliverable.',
      due_date: new Date(projDueDate || Date.now() + 14 * 86400000).toISOString(),
      status: 'planning',
      progress: 0,
      tech_stack: projTech.split(',').map((t) => t.trim()).filter(Boolean),
      milestones: [
        { id: `m-${Date.now()}-1`, title: 'Design Architecture & Formal Specification', completed: false },
        { id: `m-${Date.now()}-2`, title: 'Core Implementation & Test Suite', completed: false },
        { id: `m-${Date.now()}-3`, title: 'Benchmarking & Final Submission', completed: false },
      ],
    };

    setProjects((prev) => [newProj, ...prev]);
    setShowAddProjectModal(false);
    setProjTitle('');
    setProjDesc('');
    setProjTech('');
  };

  const handleToggleMilestone = (projectId: string, milestoneId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const updatedMilestones = p.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        const completedCount = updatedMilestones.filter((m) => m.completed).length;
        const progress = Math.round((completedCount / updatedMilestones.length) * 100);
        const status = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'planning';
        return { ...p, milestones: updatedMilestones, progress, status };
      })
    );
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
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
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <CheckSquare className="h-4 w-4" />
            <span>Academics & Execution Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Tasks & Projects
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Unified workspace for weekly coursework deadlines and multi-week capstone projects.
          </p>
        </div>

        {/* Tab Controls & Add Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-secondary rounded-2xl p-1 border border-border">
            <button
              onClick={() => setActiveTab('assignments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'assignments'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Assignments ({assignments.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'projects'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FolderKanban className="h-3.5 w-3.5" />
              <span>Term Projects ({projects.length})</span>
            </button>
          </div>

          {activeTab === 'assignments' ? (
            <div className="flex items-center gap-2">
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Assignment</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddProjectModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>New Term Project</span>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: Coursework & Assignments                               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Loading coursework assignments...</div>
          ) : assignments.length === 0 ? (
            <div className="py-16 text-center space-y-3 rounded-3xl bg-card border border-border">
              <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">No assignments logged</h3>
              <p className="text-xs text-muted-foreground">Click "Add Assignment" to log upcoming lab reports, problem sets, and homework.</p>
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
                          className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-2.5 hover:border-primary/50 transition-all shadow-sm"
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
                                  ? 'bg-rose-500/10 text-rose-500'
                                  : a.priority === 'high'
                                  ? 'bg-amber-500/10 text-amber-500'
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
                              <Calendar className="h-3 w-3 text-primary" />
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
                                className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20"
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
            <div className="rounded-3xl bg-card border border-border divide-y divide-border overflow-hidden">
              {assignments.map((a) => (
                <div key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        a.status === 'completed'
                          ? 'bg-emerald-500'
                          : a.status === 'in_progress'
                          ? 'bg-primary'
                          : 'bg-muted-foreground'
                      }`}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{a.title}</h4>
                      <p className="text-xs text-muted-foreground">{a.subject_name || 'Academic Assignment'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">{new Date(a.due_date).toLocaleDateString()}</span>
                    <span className="capitalize px-2 py-0.5 rounded bg-secondary text-foreground font-semibold">
                      {a.status.replace('_', ' ')}
                    </span>
                    <button
                      onClick={() => handleDeleteAssignment(a.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: Term Projects & Capstones                              */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="rounded-3xl bg-card border border-border p-6 space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold text-white inline-block mb-1.5"
                        style={{ backgroundColor: proj.subject_color }}
                      >
                        {proj.subject_name}
                      </span>
                      <h3 className="text-lg font-bold text-foreground leading-snug">{proj.title}</h3>
                    </div>
                    <button
                      onClick={() => handleDeleteProject(proj.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg"
                      title="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {proj.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Milestones Progress</span>
                      <span className="text-primary font-bold">{proj.progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Tech Stack Chips */}
                  {proj.tech_stack && proj.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {proj.tech_stack.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-semibold text-secondary-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Milestones Checklist */}
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Sprint Deliverables
                    </span>
                    <div className="space-y-1.5">
                      {proj.milestones.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => handleToggleMilestone(proj.id, m.id)}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-secondary/30 hover:bg-secondary/60 cursor-pointer transition-colors text-xs select-none"
                        >
                          <input
                            type="checkbox"
                            checked={m.completed}
                            onChange={() => {}}
                            className="h-3.5 w-3.5 accent-primary rounded cursor-pointer"
                          />
                          <span
                            className={m.completed ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}
                          >
                            {m.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Info & Repository Link */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Due: {new Date(proj.due_date).toLocaleDateString()}
                  </span>
                  {proj.repo_url && (
                    <a
                      href={proj.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline font-semibold text-[11px]"
                    >
                      <GitBranch className="h-3.5 w-3.5" />
                      <span>Repository</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Log New Assignment</h3>
            <form onSubmit={handleCreateAssignment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lab 3: Deadlock Detection Algorithm"
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Course Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Due Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Est. Effort (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instructions, rubric details, or link to problem specification..."
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm"
                >
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Launch Term Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  placeholder="e.g. LLM Inference Optimization Engine"
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Subject</label>
                  <select
                    value={projSubject}
                    onChange={(e) => setProjSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Submission Deadline</label>
                  <input
                    type="date"
                    required
                    value={projDueDate}
                    onChange={(e) => setProjDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  value={projTech}
                  onChange={(e) => setProjTech(e.target.value)}
                  placeholder="Python, PyTorch, CUDA, FastAPI"
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Deliverable Scope</label>
                <textarea
                  rows={2}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Goals, technical deliverables, and grading requirements..."
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const Assignments = TasksProjects;
export default TasksProjects;
