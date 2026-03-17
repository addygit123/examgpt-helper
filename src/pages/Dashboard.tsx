import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, BookOpen, GraduationCap, Loader2, Menu, User, LogOut, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";

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

// Mock usage data (will be replaced with Supabase)
const mockUsage = {
  free: { "2": 1, "5": 0, "10": 2 },
  freeMax: 2,
  dailyUsed: 3,
  dailyCap: 20,
  plan: "free" as const,
};

function UsageCounter({ dailyUsed, dailyCap, free, freeMax }: typeof mockUsage) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-3 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background">
        <span className="font-mono-app">2M: {free["2"]}/{freeMax}</span>
        <span className="font-mono-app">5M: {free["5"]}/{freeMax}</span>
        <span className="font-mono-app">10M: {free["10"]}/{freeMax}</span>
      </div>
      <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground">
        <span className="font-mono-app">{dailyCap - dailyUsed}/{dailyCap}</span>
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

// Mock AI response
function getMockAnswer(subject: string, topic: string, marks: MarkType, level: LevelType, diagram: boolean): string {
  const isSchool = level === "school";
  if (marks === "2") {
    return isSchool
      ? `**${topic}**\n\n${topic} in ${subject} refers to the fundamental concept that governs the behavior of the system. It is defined as the principle that explains the relationship between key variables.\n\n**Key Point:** This concept is essential for solving numerical problems in board exams.`
      : `**${topic}**\n\n${topic} is formally defined in ${subject} as the theoretical framework that establishes the quantitative relationship between dependent and independent variables in a controlled system.\n\n**Technical Note:** This principle finds application in advanced computational models.`;
  }
  const intro = isSchool
    ? `## ${topic}\n\n**Introduction:** ${topic} is an important concept in ${subject} that is frequently asked in board examinations.\n\n`
    : `## ${topic}\n\n**Introduction:** ${topic} represents a foundational pillar in the study of ${subject}, with significant implications in both theoretical and applied domains.\n\n`;
  const points = isSchool
    ? `**Key Points:**\n\n1. **Definition:** ${topic} can be defined as the principle governing the primary interactions in ${subject}.\n\n2. **Characteristics:** The key features include measurability, reproducibility, and universal applicability across standard conditions.\n\n3. **Applications:** This concept is widely applied in daily life, industrial processes, and scientific research.\n\n4. **Formula/Law:** The mathematical representation helps in solving numerical problems effectively.\n\n`
    : `**Detailed Analysis:**\n\n1. **Theoretical Framework:** ${topic} is grounded in the axiomatic principles of ${subject}, deriving from first principles established through rigorous experimentation.\n\n2. **Mathematical Formulation:** The governing equations can be derived using differential calculus and boundary conditions.\n\n3. **Experimental Validation:** Multiple peer-reviewed studies have confirmed the validity of this principle under standard laboratory conditions.\n\n4. **Industrial Applications:** ${topic} finds extensive application in engineering design, computational modeling, and process optimization.\n\n5. **Critical Analysis:** While widely accepted, certain edge cases present challenges that are addressed by modified theories.\n\n`;
  const diag = diagram ? `**Diagram:**\n\`\`\`\n    ┌──────────┐\n    │  Input   │\n    └────┬─────┘\n         │\n    ┌────▼─────┐\n    │ Process  │\n    └────┬─────┘\n         │\n    ┌────▼─────┐\n    │  Output  │\n    └──────────┘\n\`\`\`\n\n` : "";
  const conclusion = isSchool
    ? `**Conclusion:** ${topic} is a vital concept in ${subject} and students should focus on understanding the underlying principles for better performance in examinations.`
    : `**Conclusion:** In summation, ${topic} in ${subject} constitutes a critical area of study that bridges theoretical knowledge with practical application, warranting thorough comprehension for academic excellence.`;
  return intro + points + diag + conclusion;
}

export default function Dashboard() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [marks, setMarks] = useState<MarkType>("5");
  const [level, setLevel] = useState<LevelType>("school");
  const [diagram, setDiagram] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleGenerate = async () => {
    if (!subject.trim() || !topic.trim()) return;
    setLoading(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 1500));
    const content = getMockAnswer(subject, topic, marks, level, diagram);
    const item: HistoryItem = {
      id: Date.now().toString(),
      subject,
      topic,
      marks,
      level,
      content,
      createdAt: new Date(),
    };
    setCurrentAnswer(item);
    setHistory((prev) => [item, ...prev].slice(0, 5));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — History */}
      <aside
        className={`fixed lg:static z-50 top-0 left-0 h-full w-72 border-r border-border bg-card p-4 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="font-display text-lg tracking-tight text-foreground">
            Exam<span className="text-primary">AI</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground">
            ✕
          </button>
        </div>

        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Recent</h3>
        <div className="flex-1 overflow-y-auto space-y-2">
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">No answers yet. Generate your first!</p>
          ) : (
            history.map((h) => (
              <button
                key={h.id}
                onClick={() => setCurrentAnswer(h)}
                className="w-full text-left rounded-lg border border-border p-3 hover:bg-muted animate-brand btn-press"
              >
                <p className="text-sm font-medium text-foreground truncate">{h.topic}</p>
                <p className="text-xs text-muted-foreground">
                  {h.subject} • {h.marks}M • {h.level}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Plan status */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <span className="text-xs font-medium text-foreground">Free Plan</span>
            </div>
            <p className="text-xs text-muted-foreground">6 free answers included</p>
            <Link to="/pricing" className="mt-2 block text-xs font-medium text-primary hover:underline">
              Upgrade →
            </Link>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground">
                <Menu className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <span className="text-sm font-medium text-foreground hidden sm:block">Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <UsageCounter {...mockUsage} />
              <Link to="/profile" className="rounded-full border border-border p-1.5 hover:bg-muted animate-brand">
                <User className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
            {/* Left — Form (40%) */}
            <div className="lg:w-[40%] space-y-4">
              <div>
                <h2 className="font-display text-xl text-foreground mb-1">Generate Answer</h2>
                <p className="text-sm text-muted-foreground">Fill in the details and hit generate.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Physics"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Topic</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Newton's Laws of Motion"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Marks */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Answer Type</label>
                  <div className="flex gap-2">
                    {(["2", "5", "10"] as MarkType[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMarks(m)}
                        className={`flex-1 rounded-lg border py-2.5 text-sm font-medium btn-press animate-brand ${
                          marks === m
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {m} Marks
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Education Level</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLevel("school")}
                      className={`flex-1 rounded-lg border py-2.5 text-sm font-medium btn-press animate-brand flex items-center justify-center gap-2 ${
                        level === "school"
                          ? "border-secondary bg-secondary/10 text-secondary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <BookOpen className="h-4 w-4" strokeWidth={1.5} /> School
                    </button>
                    <button
                      onClick={() => setLevel("college")}
                      className={`flex-1 rounded-lg border py-2.5 text-sm font-medium btn-press animate-brand flex items-center justify-center gap-2 ${
                        level === "college"
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <GraduationCap className="h-4 w-4" strokeWidth={1.5} /> College
                    </button>
                  </div>
                </div>

                {/* Diagram */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={diagram}
                    onChange={(e) => setDiagram(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                  />
                  <span className="text-sm text-foreground">Include diagram</span>
                </label>

                {/* Generate */}
                <button
                  onClick={handleGenerate}
                  disabled={loading || !subject.trim() || !topic.trim()}
                  className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground btn-press shadow-surface disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} /> Generating...
                    </>
                  ) : (
                    "Generate Answer"
                  )}
                </button>
              </div>
            </div>

            {/* Right — Answer (60%) */}
            <div className="lg:w-[60%]">
              {loading && (
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
                  <p className="text-sm text-muted-foreground">
                    Fill in the subject and topic, select your mark type and level, then generate.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
