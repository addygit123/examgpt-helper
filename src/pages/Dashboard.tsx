import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, BookOpen, GraduationCap, Loader2, Menu, User, LogOut, Crown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type MarkType = "2" | "5" | "10";
type LevelType = "school" | "college";

interface HistoryItem {
  id: string;
  subject: string;
  topic: string;
  marks: MarkType;
  level: LevelType;
  content: string;
  createdAt: Date;
}

const ease = [0.16, 1, 0.3, 1] as const;

function UsageCounter({ profile }: { profile: any }) {
  if (!profile) return null;
  const isPaid = profile.plan_type !== "free" && profile.plan_expiry && new Date(profile.plan_expiry) > new Date();
  const remaining = profile.daily_answers_cap - profile.daily_answers_used;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isPaid && (
        <div className="inline-flex items-center gap-3 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background">
          <span className="font-mono-app">2M: {Math.max(0, 2 - profile.searches_2mark)}/2</span>
          <span className="font-mono-app">5M: {Math.max(0, 2 - profile.searches_5mark)}/2</span>
          <span className="font-mono-app">10M: {Math.max(0, 2 - profile.searches_10mark)}/2</span>
        </div>
      )}
      <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground">
        <span className="font-mono-app">{Math.max(0, remaining)}/{profile.daily_answers_cap}</span>
        <span className="text-muted-foreground">today</span>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground btn-press animate-brand">
      {copied ? <Check className="h-3.5 w-3.5" strokeWidth={1.5} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function AnswerCard({ item }: { item: HistoryItem }) {
  const isSchool = item.level === "school";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
      className="rounded-xl border border-border bg-card shadow-surface overflow-hidden"
    >
      <div className="bg-muted px-4 py-2 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-mono-app text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {item.marks} Marks • {item.level}
          </span>
          {isSchool ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
              <BookOpen className="h-3 w-3" strokeWidth={1.5} /> School
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              <GraduationCap className="h-3 w-3" strokeWidth={1.5} /> College
            </span>
          )}
        </div>
        <CopyButton text={item.content} />
      </div>
      <div className="p-6 prose prose-sm prose-slate max-w-none text-foreground">
        <ReactMarkdown>{item.content}</ReactMarkdown>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [marks, setMarks] = useState<MarkType>("5");
  const [level, setLevel] = useState<LevelType>("school");
  const [diagram, setDiagram] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  const handleGenerate = async () => {
    if (!subject.trim() || !topic.trim()) return;
    setLoading(true);
    setStreamingContent("");
    setCurrentAnswer(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to continue");
        navigate("/login");
        return;
      }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-answer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ subject, topic, marks, level, diagram }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        if (err.error === "daily_limit") {
          toast.error("You've reached today's limit of 20 answers!");
        } else if (err.error === "free_limit") {
          toast.error(err.message || `You've used all free ${marks}-mark answers!`);
        } else {
          toast.error(err.error || "Generation failed");
        }
        setLoading(false);
        return;
      }

      // Stream SSE response
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setStreamingContent(fullContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      const item: HistoryItem = {
        id: Date.now().toString(),
        subject, topic, marks, level,
        content: fullContent,
        createdAt: new Date(),
      };
      setCurrentAnswer(item);
      setStreamingContent("");
      setHistory((prev) => [item, ...prev].slice(0, 5));
      await refreshProfile();
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = profile?.name || user?.user_metadata?.full_name || "Student";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:static z-50 top-0 left-0 h-full w-72 border-r border-border bg-card p-4 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="font-display text-lg tracking-tight text-foreground">Exam<span className="text-primary">AI</span></Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground">✕</button>
        </div>

        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Recent</h3>
        <div className="flex-1 overflow-y-auto space-y-2">
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">No answers yet. Generate your first!</p>
          ) : (
            history.map((h) => (
              <button key={h.id} onClick={() => setCurrentAnswer(h)} className="w-full text-left rounded-lg border border-border p-3 hover:bg-muted animate-brand btn-press">
                <p className="text-sm font-medium text-foreground truncate">{h.topic}</p>
                <p className="text-xs text-muted-foreground">{h.subject} • {h.marks}M • {h.level}</p>
              </button>
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border space-y-2">
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <span className="text-xs font-medium text-foreground capitalize">{profile?.plan_type || "Free"} Plan</span>
            </div>
            {profile?.plan_type === "free" && <Link to="/#pricing" className="mt-1 block text-xs font-medium text-primary hover:underline">Upgrade →</Link>}
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted animate-brand">
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} /> Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground"><Menu className="h-5 w-5" strokeWidth={1.5} /></button>
              <span className="text-sm font-medium text-foreground hidden sm:block">Hi, {displayName} 👋</span>
            </div>
            <div className="flex items-center gap-4">
              <UsageCounter profile={profile} />
              <Link to="/profile" className="rounded-full border border-border p-1.5 hover:bg-muted animate-brand">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                )}
              </Link>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
            {/* Form */}
            <div className="lg:w-[40%] space-y-4">
              <div>
                <h2 className="font-display text-xl text-foreground mb-1">Generate Answer</h2>
                <p className="text-sm text-muted-foreground">Fill in the details and hit generate.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Subject</label>
                  <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Physics" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Topic</label>
                  <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Newton's Laws of Motion" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Answer Type</label>
                  <div className="flex gap-2">
                    {(["2", "5", "10"] as MarkType[]).map((m) => (
                      <button key={m} onClick={() => setMarks(m)} className={`flex-1 rounded-lg border py-2.5 text-sm font-medium btn-press animate-brand ${marks === m ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                        {m} Marks
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Education Level</label>
                  <div className="flex gap-2">
                    <button onClick={() => setLevel("school")} className={`flex-1 rounded-lg border py-2.5 text-sm font-medium btn-press animate-brand flex items-center justify-center gap-2 ${level === "school" ? "border-secondary bg-secondary/10 text-secondary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                      <BookOpen className="h-4 w-4" strokeWidth={1.5} /> School
                    </button>
                    <button onClick={() => setLevel("college")} className={`flex-1 rounded-lg border py-2.5 text-sm font-medium btn-press animate-brand flex items-center justify-center gap-2 ${level === "college" ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:bg-muted"}`}>
                      <GraduationCap className="h-4 w-4" strokeWidth={1.5} /> College
                    </button>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={diagram} onChange={(e) => setDiagram(e.target.checked)} className="h-4 w-4 rounded border-border text-primary focus:ring-ring" />
                  <span className="text-sm text-foreground">Include diagram</span>
                </label>
                <button onClick={handleGenerate} disabled={loading || !subject.trim() || !topic.trim()} className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground btn-press shadow-surface disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? (<><Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} /> Generating...</>) : "Generate Answer"}
                </button>
              </div>
            </div>

            {/* Answer */}
            <div className="lg:w-[60%]">
              {loading && streamingContent && (
                <div className="rounded-xl border border-border bg-card shadow-surface overflow-hidden">
                  <div className="relative h-1 bg-muted overflow-hidden">
                    <div className="absolute inset-0 w-1/2 bg-primary animate-pulse-line rounded-full" />
                  </div>
                  <div className="p-6 prose prose-sm prose-slate max-w-none text-foreground">
                    <ReactMarkdown>{streamingContent}</ReactMarkdown>
                  </div>
                </div>
              )}

              {loading && !streamingContent && (
                <div className="rounded-xl border border-border bg-card shadow-surface overflow-hidden">
                  <div className="relative h-1 bg-muted overflow-hidden">
                    <div className="absolute inset-0 w-1/2 bg-primary animate-pulse-line rounded-full" />
                  </div>
                  <div className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" strokeWidth={1.5} />
                    <p className="text-sm text-muted-foreground">Crafting your answer...</p>
                  </div>
                </div>
              )}

              {!loading && currentAnswer && <AnswerCard item={currentAnswer} />}

              {!loading && !currentAnswer && (
                <div className="rounded-xl border border-border bg-card shadow-surface p-12 text-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1.5} />
                  <h3 className="font-display text-base text-foreground mb-1">Your answer will appear here</h3>
                  <p className="text-sm text-muted-foreground">Fill in the form and click Generate.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
