import React, { useState } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  Calendar,
  Sparkles,
  BarChart3,
  BookmarkX,
  BookOpen
} from 'lucide-react';
import { useSubjects } from '../context/SubjectContext';
import { getActiveSession } from '../services/staticStorage';

export const ExportReports: React.FC = () => {
  const { subjects } = useSubjects();
  const session = getActiveSession();
  const [downloaded, setDownloaded] = useState<string | null>(null);

  const triggerDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloaded(filename);
    setTimeout(() => setDownloaded(null), 3000);
  };

  const handleExportSyllabusMarkdown = () => {
    let md = `# LifeOS Academic Curriculum & Syllabus Export\n`;
    md += `Student: ${session?.user?.full_name || 'LifeOS Student'}\n`;
    md += `Exported: ${new Date().toLocaleDateString()}\n\n`;

    subjects.forEach((s) => {
      md += `## ${s.name} (${s.credits || 4} Credits, Target Grade: ${s.target_grade || 'A'})\n`;
      if (s.units && s.units.length > 0) {
        s.units.forEach((u) => {
          md += `### ${u.title}\n`;
          if (u.topics && u.topics.length > 0) {
            u.topics.forEach((tp) => {
              md += `- ${tp}\n`;
            });
          }
        });
      } else if (s.syllabus_topics) {
        s.syllabus_topics.forEach((t) => {
          md += `- ${t}\n`;
        });
      }
      md += `\n`;
    });

    triggerDownload('LifeOS_Academic_Curriculum.md', md, 'text/markdown');
  };

  const handleExportAnalyticsJson = () => {
    const data = {
      student: session?.user?.full_name || 'LifeOS Student',
      email: session?.user?.email || 'student@university.edu',
      export_date: new Date().toISOString(),
      courses: subjects.map((s) => ({
        name: s.name,
        credits: s.credits,
        target_grade: s.target_grade,
        units_count: s.units?.length || s.syllabus_topics?.length || 0,
      })),
    };
    triggerDownload('LifeOS_Academic_Data.json', JSON.stringify(data, null, 2), 'application/json');
  };

  const handleExportWeeklyCSV = () => {
    let csv = `Course Name,Credits,Target Grade,Total Units\n`;
    subjects.forEach((s) => {
      csv += `"${s.name}",${s.credits || 4},"${s.target_grade || 'A'}",${s.units?.length || s.syllabus_topics?.length || 0}\n`;
    });
    triggerDownload('LifeOS_Study_Summary.csv', csv, 'text/csv');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
          <Download className="h-4 w-4" />
          <span>Data Portability & Transcripts</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
          Export Academic Reports
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Generate structured exports of your course syllabus, revision notes, and study analytics.
        </p>
      </div>

      {downloaded && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Successfully downloaded {downloaded}!</span>
        </div>
      )}

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Markdown Syllabus Report */}
        <div className="rounded-3xl bg-card border border-border p-6 space-y-4 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Syllabus & Course Curriculum</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Complete markdown dossier of all {subjects.length} subjects, units, subtopics, and target letter grades.
            </p>
          </div>

          <button
            onClick={handleExportSyllabusMarkdown}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export as Markdown (.md)</span>
          </button>
        </div>

        {/* CSV Summary */}
        <div className="rounded-3xl bg-card border border-border p-6 space-y-4 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Semester Course Matrix (CSV)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tabular spreadsheet containing credits, units, grade milestones, and study commitments.
            </p>
          </div>

          <button
            onClick={handleExportWeeklyCSV}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all border border-border"
          >
            <Download className="h-4 w-4" />
            <span>Export as CSV (.csv)</span>
          </button>
        </div>

        {/* JSON Raw Data */}
        <div className="rounded-3xl bg-card border border-border p-6 space-y-4 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <FileJson className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Complete Academic JSON</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Raw structured JSON data for importing into external tools, Notion, or personal archival databases.
            </p>
          </div>

          <button
            onClick={handleExportAnalyticsJson}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all border border-border"
          >
            <Download className="h-4 w-4" />
            <span>Export as JSON (.json)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportReports;
