import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  Code2,
  HelpCircle,
  Award,
  Layers,
  FileText,
  Copy,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../services/api';
import { Conversation, ChatMessage, Subject } from '../types';

export const Tutor: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<'general' | 'notes_rag' | 'explain' | 'exam_prep' | 'coding' | 'quiz_me'>('notes_rag');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tutorModes = [
    { id: 'notes_rag', label: 'Ask from Notes (RAG)', icon: FileText, desc: 'Grounds answers in your uploaded PDFs' },
    { id: 'general', label: 'General Professor', icon: Bot, desc: 'In-depth academic discussions' },
    { id: 'explain', label: 'Explain Step-by-Step', icon: BookOpen, desc: 'Feynman technique with intuitive analogies' },
    { id: 'exam_prep', label: 'Exam High-Yield', icon: Award, desc: 'Key formulas, exam traps & heuristics' },
    { id: 'coding', label: 'Coding Mentor', icon: Code2, desc: 'Algorithm debug & time-space complexity' },
    { id: 'quiz_me', label: 'Quiz Me', icon: HelpCircle, desc: 'Active recall questions with hints' },
  ];

  const fetchConversations = async () => {
    try {
      const convs = await api.listConversations();
      setConversations(convs);
      if (convs.length > 0 && !activeConvId) {
        setActiveConvId(convs[0].id);
        setMessages(convs[0].messages || []);
        if (convs[0].subject_id) setSelectedSubjectId(convs[0].subject_id);
      }
    } catch (err) {
      console.warn('Conversations fetch notice', err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const subjs = await api.listSubjects();
      setSubjects(subjs);
    } catch (e) {
      console.warn('Subjects fetch notice', e);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchSubjects();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConvId(conv.id);
    setMessages(conv.messages || []);
    if (conv.subject_id) setSelectedSubjectId(conv.subject_id);
    setMode((conv.mode as any) || 'notes_rag');
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customPrompt || inputText;
    if (!promptToSend.trim() || loading) return;

    setInputText('');

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConvId || 'new',
      role: 'user',
      content: promptToSend,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const aiResponse = await api.sendChatMessage(
        promptToSend,
        activeConvId || undefined,
        selectedSubjectId || undefined,
        mode
      );
      setMessages((prev) => [...prev, aiResponse]);
      if (!activeConvId) {
        setActiveConvId(aiResponse.conversation_id);
      }
      fetchConversations();
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        conversation_id: activeConvId || 'error',
        role: 'assistant',
        content: `⚠️ Could not reach Gemini: ${err.message || 'Unknown error'}. Please verify backend configuration.`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDeleteConv = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConvId === convId) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4 animate-in fade-in duration-200">
      {/* Left Sidebar: Conversation History & Subject Selector */}
      <div className="w-full md:w-64 flex flex-col rounded-3xl bg-card border border-border p-4 space-y-3 shrink-0">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shadow-indigo-500/25"
        >
          <Plus className="h-4 w-4" />
          <span>New AI Discussion</span>
        </button>

        {/* Subject Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Subject Focus
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl bg-secondary text-xs text-foreground border border-border focus:outline-none"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1 py-1">
            Past Discussions
          </div>
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground p-2">No conversations yet.</p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelectConversation(c)}
                className={`group flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                  activeConvId === c.id
                    ? 'bg-secondary text-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                }`}
              >
                <span className="truncate flex-1">{c.title}</span>
                <button
                  onClick={(e) => handleDeleteConv(e, c.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col rounded-3xl bg-card border border-border overflow-hidden">
        {/* Tutor Mode Bar */}
        <div className="p-3 border-b border-border bg-secondary/30 flex items-center gap-1.5 overflow-x-auto">
          {tutorModes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                mode === m.id
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-indigo-500/25'
                  : 'bg-card text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <m.icon className="h-3.5 w-3.5" />
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 py-12">
              <div className="h-14 w-14 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 dark:bg-gradient-to-tr dark:from-indigo-500 dark:to-purple-600 dark:text-white">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">
                  Student Lifeline AI Academic Professor
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ask conceptual questions, debug code, or interrogate your uploaded lecture notes with full source citations.
                </p>
              </div>

              {/* Starter Prompt Badges */}
              <div className="w-full grid grid-cols-1 gap-2 pt-2 text-left text-xs">
                {[
                  'What are the 4 conditions of Normalization in DBMS?',
                  'Explain Dijkstra algorithm step-by-step with an analogy',
                  'Quiz me on Binary Search trees with progressive hints',
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => handleSendMessage(undefined, promptText)}
                    className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary text-foreground transition-colors border border-border/50 text-xs"
                  >
                    "{promptText}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id || index}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-sm dark:bg-gradient-to-tr dark:from-indigo-600 dark:to-purple-600 dark:text-white">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`max-w-3xl lg:max-w-4xl space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-5 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-primary text-primary-foreground rounded-tr-none shadow-md shadow-indigo-500/20 font-medium'
                          : 'bg-card text-foreground border border-border/80 rounded-tl-none shadow-sm'
                      }`}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ node, ...props }) => (
                            <h1 className="text-xl font-black text-foreground mt-4 mb-2 pb-1 border-b border-border/60 flex items-center gap-2" {...props} />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2 className="text-lg font-bold text-indigo-400 mt-4 mb-2 flex items-center gap-2" {...props} />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 className="text-base font-semibold text-purple-400 mt-3 mb-1" {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p className="mb-3 leading-relaxed text-foreground/90 last:mb-0" {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul className="list-disc pl-5 mb-3 space-y-1 text-foreground/90" {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className="list-decimal pl-5 mb-3 space-y-1 text-foreground/90" {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="leading-relaxed" {...props} />
                          ),
                          blockquote: ({ node, ...props }) => (
                            <blockquote className="border-l-4 border-indigo-500 pl-4 py-2 my-3 bg-secondary/40 rounded-r-xl italic text-foreground/90 font-medium" {...props} />
                          ),
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-4 rounded-xl border border-border bg-secondary/30 shadow-sm">
                              <table className="min-w-full divide-y divide-border text-xs text-left" {...props} />
                            </div>
                          ),
                          thead: ({ node, ...props }) => (
                            <thead className="bg-secondary/80 font-bold text-foreground" {...props} />
                          ),
                          tbody: ({ node, ...props }) => (
                            <tbody className="divide-y divide-border/60 bg-card/60" {...props} />
                          ),
                          tr: ({ node, ...props }) => (
                            <tr className="hover:bg-secondary/40 transition-colors" {...props} />
                          ),
                          th: ({ node, ...props }) => (
                            <th className="px-4 py-3 font-bold text-indigo-300 uppercase tracking-wider text-[11px]" {...props} />
                          ),
                          td: ({ node, ...props }) => (
                            <td className="px-4 py-2.5 text-foreground/90 font-mono text-[12px]" {...props} />
                          ),
                          code: ({ node, inline, className, children, ...props }: any) => {
                            if (inline) {
                              return (
                                <code className="px-1.5 py-0.5 rounded-md bg-secondary text-indigo-300 font-mono text-xs font-semibold" {...props}>
                                  {children}
                                </code>
                              );
                            }
                            return (
                              <div className="my-3 rounded-xl overflow-hidden border border-border bg-zinc-950 text-xs">
                                <pre className="p-4 overflow-x-auto font-mono text-emerald-400 leading-relaxed">
                                  <code {...props}>{children}</code>
                                </pre>
                              </div>
                            );
                          },
                          hr: ({ node, ...props }) => (
                            <hr className="my-4 border-border/60" {...props} />
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {/* Citations block if available */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="rounded-xl bg-secondary/40 border border-border p-3 text-xs space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-400 text-[11px] uppercase tracking-wider">
                          <FileText className="h-3.5 w-3.5" />
                          <span>Grounded Source Citations</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.citations.map((cit, cIdx) => (
                            <div key={cIdx} className="p-2 rounded-lg bg-card/80 border border-border/50 space-y-1">
                              <div className="font-semibold text-foreground truncate">
                                📄 {cit.document_title}
                              </div>
                              <div className="text-[11px] text-muted-foreground line-clamp-2">
                                "{cit.snippet}"
                              </div>
                              {cit.page_number && (
                                <span className="inline-block text-[10px] text-indigo-400 font-mono">
                                  Page {cit.page_number}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Copy action on assistant message */}
                    {!isUser && (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground pl-1">
                        <button
                          onClick={() => handleCopy(msg.content, index)}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy response</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 animate-pulse">
                <Bot className="h-4 w-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-secondary/60 text-xs text-muted-foreground flex items-center gap-2">
                <div className="h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span>Synthesizing response from academic knowledge base...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-border bg-card">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                mode === 'notes_rag'
                  ? 'Ask anything from your uploaded course notes & PDFs...'
                  : 'Ask AI Tutor any academic concept or paste code...'
              }
              className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-secondary/60 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="absolute right-2.5 p-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-40 transition-colors shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
