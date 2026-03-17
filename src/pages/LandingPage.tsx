import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Zap, FileText, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: FileText,
    title: "Structured Answers",
    desc: "2, 5, and 10 mark formats that match exactly what examiners expect.",
  },
  {
    icon: GraduationCap,
    title: "School vs College",
    desc: "Board exam style for Class 10–12. University style for college students.",
  },
  {
    icon: BookOpen,
    title: "Diagram Support",
    desc: "ASCII diagrams and clear diagram descriptions included when needed.",
  },
  {
    icon: Zap,
    title: "Exam-Ready Format",
    desc: "Headings, bullet points, and conclusions — like a topper's answer sheet.",
  },
];

const plans = [
  { name: "Daily", price: "₹9", period: "/day", features: ["Unlimited answer types", "20 answers/day", "All subjects"] },
  { name: "Weekly", price: "₹39", period: "/week", popular: true, features: ["Unlimited answer types", "20 answers/day", "All subjects", "Best value"] },
  { name: "Monthly", price: "₹99", period: "/month", features: ["Unlimited answer types", "20 answers/day", "All subjects", "Priority support"] },
];

const ease = [0.16, 1, 0.3, 1] as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="font-display text-lg tracking-tight text-foreground">
            Exam<span className="text-primary">AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground animate-brand">
              Log in
            </Link>
            <Link
              to="/signup"
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground btn-press shadow-surface"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
          >
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="font-mono-app">14,202</span> students today
            </div>
            <h1 className="font-display text-4xl md:text-6xl leading-[1.1] tracking-tight text-foreground max-w-3xl mx-auto">
              Write answers that{" "}
              <span className="text-primary">examiners love.</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              AI-powered exam notes for CBSE, ICSE &amp; University exams. 
              Structured by marks. Formatted like a topper.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/signup"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground btn-press shadow-surface"
              >
                Start Generating <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
              <Link
                to="/login"
                className="inline-flex h-12 items-center rounded-lg border border-border px-6 text-base font-medium text-foreground btn-press"
              >
                Log in
              </Link>
            </div>
          </motion.div>

          {/* Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="mt-16 mx-auto max-w-2xl"
          >
            <div className="rounded-xl border border-border bg-card shadow-surface overflow-hidden">
              <div className="bg-muted px-4 py-2 border-b border-border flex items-center justify-between">
                <span className="font-mono-app text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  5 Marks • School
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
                  <GraduationCap className="h-3 w-3" strokeWidth={1.5} /> Board Exam
                </span>
              </div>
              <div className="p-6 text-left space-y-3">
                <p className="text-sm font-medium text-foreground">
                  <strong>Q: Explain Newton's Third Law of Motion with examples.</strong>
                </p>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong className="text-foreground">Introduction:</strong> Newton's Third Law states that for every action, there is an equal and opposite reaction.</p>
                  <p><strong className="text-foreground">Key Points:</strong></p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>Forces always occur in pairs — action and reaction</li>
                    <li>Both forces are equal in magnitude but opposite in direction</li>
                    <li>They act on different bodies simultaneously</li>
                  </ul>
                  <p className="text-xs text-muted-foreground italic">...continue reading after signup</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-t border-border">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl text-center text-foreground mb-12">
            Built for how Indian exams work
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease }}
                className="rounded-xl border border-border bg-card p-6 shadow-surface"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-base text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 border-t border-border" id="pricing">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl text-center text-foreground mb-3">
            Simple pricing
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Start free with 6 answers. Upgrade when you need more.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 ${
                  plan.popular
                    ? "border-primary bg-primary/5 shadow-surface ring-1 ring-primary/20"
                    : "border-border bg-card shadow-surface"
                }`}
              >
                {plan.popular && (
                  <span className="mb-3 inline-block rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    Popular
                  </span>
                )}
                <h3 className="font-display text-lg text-foreground">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="font-display text-3xl text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-accent" strokeWidth={1.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className={`block w-full text-center rounded-lg py-2.5 text-sm font-medium btn-press ${
                    plan.popular
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-foreground hover:bg-muted"
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>

          {/* Top-up */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Need more today? <span className="font-medium text-foreground">₹5 for 10 extra</span> or{" "}
              <span className="font-medium text-foreground">₹10 for 20 extra</span> answers.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-sm text-foreground">
            Exam<span className="text-primary">AI</span>
          </span>
          <p className="text-xs text-muted-foreground">© 2026 ExamAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
