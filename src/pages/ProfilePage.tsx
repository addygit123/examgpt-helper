import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Crown, Calendar, Zap, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (!profile || !user) return null;

  const isPaid = profile.plan_type !== "free" && profile.plan_expiry && new Date(profile.plan_expiry) > new Date();
  const remaining = Math.max(0, profile.daily_answers_cap - profile.daily_answers_used);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg py-8">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 animate-brand">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-4 mb-8">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-display text-muted-foreground">
              {(profile.name || user.email || "S").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-display text-xl text-foreground">{profile.name || "Student"}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-surface p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h3 className="text-sm font-medium text-foreground">Plan</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-display text-foreground capitalize">{profile.plan_type}</p>
              {isPaid && profile.plan_expiry && (
                <p className="text-xs text-muted-foreground">
                  Expires: {new Date(profile.plan_expiry).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              )}
            </div>
            {!isPaid && (
              <Link to="/#pricing" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground btn-press">
                Upgrade
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl border border-border bg-card shadow-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <span className="text-xs text-muted-foreground">Today</span>
            </div>
            <p className="text-2xl font-display text-foreground font-mono-app">{remaining}/{profile.daily_answers_cap}</p>
            <p className="text-xs text-muted-foreground">answers remaining</p>
          </div>
          <div className="rounded-xl border border-border bg-card shadow-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <span className="text-xs text-muted-foreground">All Time</span>
            </div>
            <p className="text-2xl font-display text-foreground font-mono-app">{profile.total_answers_generated}</p>
            <p className="text-xs text-muted-foreground">answers generated</p>
          </div>
        </div>

        {!isPaid && (
          <div className="rounded-xl border border-border bg-card shadow-surface p-4 mb-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Free Searches Remaining</h3>
            <div className="flex gap-4">
              {(["2", "5", "10"] as const).map((m) => {
                const key = `searches_${m}mark` as "searches_2mark" | "searches_5mark" | "searches_10mark";
                return (
                  <div key={m} className="flex-1 text-center rounded-lg bg-muted p-3">
                    <p className="text-lg font-display font-mono-app text-foreground">{Math.max(0, 2 - profile[key])}/2</p>
                    <p className="text-xs text-muted-foreground">{m} Mark</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card shadow-surface p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-sm text-muted-foreground">
              Joined {new Date(profile.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
        </div>

        <button onClick={handleLogout} className="w-full rounded-lg border border-destructive/30 py-2.5 text-sm font-medium text-destructive btn-press hover:bg-destructive/5 animate-brand flex items-center justify-center gap-2">
          <LogOut className="h-4 w-4" strokeWidth={1.5} /> Log out
        </button>
      </div>
    </div>
  );
}
