import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  Clapperboard,
  Clock,
  Download,
  Edit2,
  Film,
  Key,
  Loader2,
  LogIn,
  LogOut,
  Monitor,
  Play,
  Plus,
  RefreshCw,
  Settings,
  Share2,
  Shield,
  ShoppingBag,
  Smartphone,
  Sparkles,
  User,
  Video,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ProjectAudience,
  ProjectGoal,
  type ProjectInput,
  ProjectPlatform,
  ProjectStatus,
  ProjectStyle,
  type Scene,
  type Script,
  VoiceoverType,
} from "./backend";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useCreateProject,
  useDeleteProject,
  useGenerateScenes,
  useGenerateScript,
  useGetUserProjects,
  useHasOpenAIKey,
  useIsCallerAdmin,
  useSetOpenAIKey,
  useUpdateProjectScript,
  useUpdateProjectStatus,
} from "./hooks/useQueries";

type AppView =
  | "dashboard"
  | "template"
  | "wizard"
  | "script"
  | "scenes"
  | "rendering"
  | "output"
  | "settings"
  | "profile";

interface WizardData {
  topic: string;
  goal: ProjectGoal;
  audience: ProjectAudience;
  style: ProjectStyle;
  platform: ProjectPlatform;
  voiceoverType: VoiceoverType;
  customScript: string;
}

const DEFAULT_WIZARD: WizardData = {
  topic: "",
  goal: ProjectGoal.educate,
  audience: ProjectAudience.beginners,
  style: ProjectStyle.cinematic,
  platform: ProjectPlatform.tiktok,
  voiceoverType: VoiceoverType.auto,
  customScript: "",
};

const WIZARD_STEPS = [
  "Topic",
  "Goal",
  "Audience",
  "Style",
  "Platform",
  "Voiceover",
];

const STATUS_MESSAGES = [
  "Generating visuals…",
  "Adding voiceover…",
  "Compositing scenes…",
  "Finalizing…",
  "Almost there…",
];

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar({
  view,
  onNav,
}: {
  view: AppView;
  onNav: (v: AppView) => void;
}) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal
    ? `${principal.slice(0, 6)}…${principal.slice(-4)}`
    : null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[oklch(0.13_0.022_240/0.95)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-6">
        {/* Brand */}
        <button
          type="button"
          onClick={() => onNav("dashboard")}
          className="flex items-center gap-2 shrink-0"
          data-ocid="nav.link"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center glow-blue">
            <Clapperboard className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">
            ViralCut <span className="text-gradient-blue">AI</span>
          </span>
        </button>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {(
            [
              ["dashboard", "Dashboard"],
              ["template", "Templates"],
              ["settings", "Settings"],
            ] as [AppView, string][]
          ).map(([v, label]) => (
            <button
              type="button"
              key={v}
              onClick={() => onNav(v)}
              data-ocid="nav.link"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === v
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3 ml-auto">
          <button
            type="button"
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
            data-ocid="nav.link"
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
          </button>

          <Button
            size="sm"
            className="rounded-full bg-accent/20 text-accent border border-accent/40 hover:bg-accent/30 px-4 font-medium text-xs"
            data-ocid="nav.link"
          >
            Upgrade
          </Button>

          {identity ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  data-ocid="nav.link"
                >
                  <Avatar className="w-8 h-8 border border-border">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {shortPrincipal?.slice(0, 2).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm text-muted-foreground">
                    {shortPrincipal}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-popover border-border"
              >
                <DropdownMenuItem
                  onClick={() => onNav("profile")}
                  className="text-muted-foreground"
                  data-ocid="nav.link"
                >
                  <User className="w-4 h-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={clear}
                  className="text-destructive"
                  data-ocid="nav.link"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              onClick={() => login()}
              disabled={loginStatus === "logging-in"}
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-blue"
              data-ocid="nav.link"
            >
              {loginStatus === "logging-in" ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <LogIn className="w-3 h-3 mr-1" />
              )}
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function WizardSidebar({
  wizardStep,
  view,
}: {
  wizardStep: number;
  view: AppView;
}) {
  const allSteps: Array<{ label: string; views: string[]; sub?: number }> = [
    { label: "Choose Template", views: ["template"] },
    ...WIZARD_STEPS.map((s, i) => ({ label: s, views: ["wizard"], sub: i })),
    { label: "Generate Script", views: ["script"] },
    { label: "Preview Scenes", views: ["scenes"] },
    { label: "Render", views: ["rendering", "output"] },
  ];

  const viewOrder: AppView[] = [
    "template",
    "wizard",
    "script",
    "scenes",
    "rendering",
    "output",
  ];
  const currentIdx = viewOrder.indexOf(view);

  return (
    <aside className="w-72 shrink-0">
      <div className="rounded-xl border border-border bg-card card-glow p-5 sticky top-24">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Progress
        </p>
        <div className="space-y-1">
          {allSteps.map((step, i) => {
            let status: "done" | "active" | "pending" = "pending";
            const stepViewIdx = viewOrder.indexOf(step.views[0] as AppView);

            if (step.views.includes("wizard") && view === "wizard") {
              if ((step.sub ?? 0) < wizardStep) status = "done";
              else if ((step.sub ?? 0) === wizardStep) status = "active";
            } else if (stepViewIdx < currentIdx) {
              status = "done";
            } else if (step.views.includes(view)) {
              status = "active";
            }

            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: stable list
                key={i}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  status === "active"
                    ? "bg-primary/15 border border-primary/30"
                    : "border border-transparent"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    status === "done"
                      ? "bg-accent/20 text-accent border border-accent/50"
                      : status === "active"
                        ? "bg-primary text-primary-foreground glow-blue"
                        : "bg-secondary text-muted-foreground border border-border"
                  }`}
                >
                  {status === "done" ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span
                  className={`text-sm font-medium ${
                    status === "active"
                      ? "text-foreground"
                      : status === "done"
                        ? "text-muted-foreground"
                        : "text-muted-foreground/60"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

// ─── HorizontalStepper ───────────────────────────────────────────────────────
function HorizontalStepper({ current }: { current: number }) {
  return (
    <div className="flex items-center bg-secondary/50 rounded-xl p-1 border border-border">
      {WIZARD_STEPS.map((step, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: stable list
        <div key={i} className="flex items-center">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              i === current
                ? "bg-primary text-primary-foreground glow-blue"
                : i < current
                  ? "text-accent"
                  : "text-muted-foreground/60"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i < current
                  ? "bg-accent/20 text-accent"
                  : i === current
                    ? "bg-white/20"
                    : "bg-secondary"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </span>
            <span className="hidden sm:block">{step}</span>
          </div>
          {i < WIZARD_STEPS.length - 1 && (
            <ChevronRight className="w-3 h-3 text-muted-foreground/30 mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function DashboardView({ onNav }: { onNav: (v: AppView) => void }) {
  const { data: projects, isLoading } = useGetUserProjects();
  const deleteProject = useDeleteProject();

  const statusColors: Record<string, string> = {
    draft: "bg-muted/50 text-muted-foreground border-muted",
    scripted: "bg-primary/20 text-primary border-primary/40",
    scenes_ready: "bg-accent/20 text-accent border-accent/40",
    rendering: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    complete: "bg-green-500/20 text-green-400 border-green-500/40",
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">
            Your <span className="text-gradient-blue">Projects</span>
          </h1>
          <p className="text-muted-foreground">
            Create, manage and publish your AI-generated videos
          </p>
        </div>
        <Button
          onClick={() => onNav("template")}
          className="bg-primary text-primary-foreground hover:bg-primary/90 glow-blue px-6"
          data-ocid="dashboard.primary_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Video
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Projects", value: projects?.length ?? 0, icon: Film },
          {
            label: "Completed",
            value: projects?.filter((p) => p.status === "complete").length ?? 0,
            icon: Check,
          },
          {
            label: "In Progress",
            value:
              projects?.filter(
                (p) => p.status !== "complete" && p.status !== "draft",
              ).length ?? 0,
            icon: Sparkles,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card card-glow p-5"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-2xl font-bold font-display text-foreground">
                {value}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Projects list */}
      <div className="rounded-xl border border-border bg-card card-glow overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-semibold text-foreground">
            Recent Projects
          </h2>
          <span className="text-xs text-muted-foreground">
            {projects?.length ?? 0} total
          </span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="dashboard.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-16 w-full rounded-lg bg-secondary/50"
              />
            ))}
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="p-16 text-center" data-ocid="dashboard.empty_state">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-1">
              No projects yet
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create your first viral video in minutes
            </p>
            <Button
              onClick={() => onNav("template")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-blue"
              data-ocid="dashboard.primary_button"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Your First Video
            </Button>
          </div>
        ) : (
          <div data-ocid="dashboard.table">
            {projects.map((p, idx) => (
              <div
                key={p.id.toString()}
                data-ocid={`dashboard.item.${idx + 1}`}
                className="flex items-center gap-4 px-6 py-4 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Film className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {p.topic}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(
                      Number(p.createdAt / 1_000_000n),
                    ).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  className={`text-xs border capitalize ${
                    statusColors[p.status] ?? statusColors.draft
                  }`}
                  variant="outline"
                >
                  {p.status.replace("_", " ")}
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNav("template")}
                    className="border-border text-muted-foreground hover:text-foreground text-xs"
                    data-ocid={`dashboard.edit_button.${idx + 1}`}
                  >
                    Continue
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      deleteProject.mutate(p.id, {
                        onSuccess: () => toast.success("Project deleted"),
                      })
                    }
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs"
                    data-ocid={`dashboard.delete_button.${idx + 1}`}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Template Selection ───────────────────────────────────────────────────────
function TemplateView({
  onSelect,
}: {
  onSelect: (defaults: Partial<WizardData>) => void;
}) {
  const templates = [
    {
      id: "viral",
      icon: Zap,
      title: "Viral Shorts",
      subtitle: "TikTok / Reels",
      desc: "Hook-first, fast-paced content optimized for maximum retention and shares",
      defaults: {
        platform: ProjectPlatform.tiktok,
        style: ProjectStyle.social,
        goal: ProjectGoal.inspire,
      },
      color: "from-primary/20 to-primary/5 border-primary/30",
    },
    {
      id: "educational",
      icon: BookOpen,
      title: "Educational",
      subtitle: "Explainer Videos",
      desc: "Structured lessons and how-to content that educates and builds authority",
      defaults: {
        platform: ProjectPlatform.youtube,
        style: ProjectStyle.minimal,
        goal: ProjectGoal.educate,
        audience: ProjectAudience.students,
      },
      color: "from-accent/20 to-accent/5 border-accent/30",
    },
    {
      id: "ads",
      icon: ShoppingBag,
      title: "Product Ads",
      subtitle: "Convert & Sell",
      desc: "Compelling product showcases with strong CTAs that drive conversions",
      defaults: {
        platform: ProjectPlatform.tiktok,
        style: ProjectStyle.cinematic,
        goal: ProjectGoal.sell,
        audience: ProjectAudience.professionals,
      },
      color: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
    },
    {
      id: "custom",
      icon: Wand2,
      title: "Custom",
      subtitle: "Full Control",
      desc: "Blank canvas with all options available to craft your unique vision",
      defaults: {},
      color: "from-purple-500/20 to-purple-500/5 border-purple-500/30",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-display font-bold text-foreground mb-2">
          Choose a <span className="text-gradient-blue">Template</span>
        </h1>
        <p className="text-muted-foreground">
          Select a mode to pre-configure your video settings
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {templates.map((t) => (
          <motion.button
            key={t.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(t.defaults)}
            data-ocid={`template.${t.id}.button`}
            className={`text-left rounded-xl border bg-gradient-to-br p-6 hover:shadow-glow transition-all ${t.color}`}
          >
            <div className="w-12 h-12 rounded-xl bg-background/50 border border-border flex items-center justify-center mb-4">
              <t.icon className="w-6 h-6 text-foreground" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-0.5">
              {t.title}
            </h3>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {t.subtitle}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.desc}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Input Wizard ─────────────────────────────────────────────────────────────
function WizardView({
  data,
  step,
  onChange,
  onBack,
  onNext,
}: {
  data: WizardData;
  step: number;
  onChange: (d: Partial<WizardData>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const topicSuggestions = [
    "AI Tools",
    "Health Tips",
    "Finance Hacks",
    "Travel",
    "Fitness",
    "Tech Reviews",
  ];

  const canNext = step === 0 ? data.topic.trim().length > 0 : true;

  return (
    <div className="space-y-6">
      <div>
        <HorizontalStepper current={step} />
      </div>

      <div className="rounded-xl border border-border bg-card card-glow p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 1: Topic */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-1">
                    What's your video about?
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Describe the topic or paste a keyword
                  </p>
                </div>
                <Input
                  placeholder="e.g. How AI is changing the creative industry"
                  value={data.topic}
                  onChange={(e) => onChange({ topic: e.target.value })}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground/50 h-12 text-base"
                  data-ocid="wizard.topic.input"
                />
                <div className="flex flex-wrap gap-2">
                  {topicSuggestions.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => onChange({ topic: s })}
                      data-ocid="wizard.topic.button"
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        data.topic === s
                          ? "bg-primary/20 border-primary/50 text-primary"
                          : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Goal */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-1">
                    What's the goal?
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Choose the primary purpose of your video
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      [
                        ProjectGoal.educate,
                        "Educate",
                        "Share knowledge",
                        BookOpen,
                      ],
                      [
                        ProjectGoal.sell,
                        "Sell",
                        "Drive conversions",
                        ShoppingBag,
                      ],
                      [
                        ProjectGoal.inspire,
                        "Inspire",
                        "Move & motivate",
                        Sparkles,
                      ],
                      [ProjectGoal.explain, "Explain", "Break it down", Zap],
                    ] as [ProjectGoal, string, string, any][]
                  ).map(([val, label, desc, Icon]) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => onChange({ goal: val })}
                      data-ocid="wizard.goal.button"
                      className={`p-4 rounded-xl border text-left transition-all ${
                        data.goal === val
                          ? "bg-primary/15 border-primary/50 shadow-glow"
                          : "bg-secondary/30 border-border hover:border-primary/30"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 mb-2 ${
                          data.goal === val
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <p className="font-semibold text-foreground text-sm">
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Audience */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-1">
                    Who's watching?
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Select your target audience
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {(
                    [
                      [ProjectAudience.beginners, "Beginners"],
                      [ProjectAudience.students, "Students"],
                      [ProjectAudience.professionals, "Professionals"],
                    ] as [ProjectAudience, string][]
                  ).map(([val, label]) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => onChange({ audience: val })}
                      data-ocid="wizard.audience.button"
                      className={`px-5 py-2.5 rounded-full text-sm font-medium border transition-all ${
                        data.audience === val
                          ? "bg-primary/20 border-primary/60 text-primary shadow-glow"
                          : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Style */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-1">
                    Pick a visual style
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    This shapes the look and feel of your video
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      [
                        ProjectStyle.cinematic,
                        "Cinematic",
                        "Epic, high-production look",
                      ],
                      [
                        ProjectStyle.minimal,
                        "Minimal",
                        "Clean, distraction-free",
                      ],
                      [ProjectStyle.threeD, "3D", "Immersive 3D visuals"],
                      [ProjectStyle.social, "Social", "Native, casual feel"],
                    ] as [ProjectStyle, string, string][]
                  ).map(([val, label, desc]) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => onChange({ style: val })}
                      data-ocid="wizard.style.button"
                      className={`p-4 rounded-xl border text-left transition-all ${
                        data.style === val
                          ? "bg-primary/15 border-primary/50 shadow-glow"
                          : "bg-secondary/30 border-border hover:border-primary/30"
                      }`}
                    >
                      <p className="font-semibold text-foreground text-sm mb-0.5">
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Platform */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-1">
                    Where will you publish?
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Determines the aspect ratio and pacing
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {(
                    [
                      [
                        ProjectPlatform.tiktok,
                        "TikTok",
                        "9:16 Portrait",
                        Smartphone,
                        "Short, punchy, fast",
                      ],
                      [
                        ProjectPlatform.youtube,
                        "YouTube",
                        "16:9 Landscape",
                        Monitor,
                        "Longer, detailed content",
                      ],
                    ] as [ProjectPlatform, string, string, any, string][]
                  ).map(([val, label, ratio, Icon, hint]) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => onChange({ platform: val })}
                      data-ocid="wizard.platform.button"
                      className={`p-6 rounded-xl border text-center transition-all ${
                        data.platform === val
                          ? "bg-primary/15 border-primary/50 shadow-glow"
                          : "bg-secondary/30 border-border hover:border-primary/30"
                      }`}
                    >
                      <Icon
                        className={`w-10 h-10 mx-auto mb-3 ${
                          data.platform === val
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <p className="font-bold text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {ratio}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {hint}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Voiceover */}
            {step === 5 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-1">
                    Voiceover
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Auto-generate a viral script or paste your own
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      [
                        VoiceoverType.auto,
                        "Auto-generate script",
                        "AI writes the viral script for you",
                      ],
                      [
                        VoiceoverType.custom,
                        "Custom script",
                        "Paste or write your own",
                      ],
                    ] as [VoiceoverType, string, string][]
                  ).map(([val, label, desc]) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => onChange({ voiceoverType: val })}
                      data-ocid="wizard.voiceover.button"
                      className={`p-4 rounded-xl border text-left transition-all ${
                        data.voiceoverType === val
                          ? "bg-primary/15 border-primary/50 shadow-glow"
                          : "bg-secondary/30 border-border hover:border-primary/30"
                      }`}
                    >
                      <p className="font-semibold text-foreground text-sm mb-1">
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </button>
                  ))}
                </div>
                {data.voiceoverType === VoiceoverType.custom && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <Textarea
                      placeholder="Paste your custom script here…"
                      value={data.customScript}
                      onChange={(e) =>
                        onChange({ customScript: e.target.value })
                      }
                      rows={6}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground/50 resize-none"
                      data-ocid="wizard.script.textarea"
                    />
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-border text-muted-foreground hover:text-foreground"
          data-ocid="wizard.cancel_button"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canNext}
          className="bg-primary text-primary-foreground hover:bg-primary/90 glow-blue px-8"
          data-ocid="wizard.submit_button"
        >
          {step === WIZARD_STEPS.length - 1 ? (
            <>
              <Sparkles className="w-4 h-4 mr-2" /> Generate Script
            </>
          ) : (
            <>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Script View ──────────────────────────────────────────────────────────────
function ScriptView({
  projectId,
  script,
  onRegenerate,
  onScriptChange,
  onProceed,
  isLoading,
}: {
  projectId: bigint;
  script: Script | null;
  onRegenerate: () => void;
  onScriptChange: (s: Script) => void;
  onProceed: () => void;
  isLoading: boolean;
}) {
  const [editing, setEditing] = useState<keyof Script | null>(null);
  const updateScript = useUpdateProjectScript();

  const sections: [keyof Script, string][] = [
    ["hook", "Hook"],
    ["main", "Main Content"],
    ["patternInterrupt", "Pattern Interrupt"],
    ["value", "Value Delivery"],
    ["cta", "CTA"],
  ];

  const handleSave = async () => {
    if (!script) return;
    try {
      await updateScript.mutateAsync({ projectId, script });
      setEditing(null);
      toast.success("Script saved");
    } catch {
      toast.error("Failed to save script");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-1">
            Your <span className="text-gradient-blue">Script</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            AI-generated viral script — review and edit before proceeding
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onRegenerate}
          disabled={isLoading}
          className="border-border text-muted-foreground hover:text-foreground shrink-0"
          data-ocid="script.secondary_button"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Regenerate
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="script.loading_state">
          {sections.map(([k]) => (
            <Skeleton
              key={k}
              className="h-28 w-full rounded-xl bg-secondary/50"
            />
          ))}
        </div>
      ) : script ? (
        <div className="space-y-3">
          {sections.map(([key, label]) => (
            <div
              key={key}
              className="rounded-xl border border-border bg-card card-glow p-5"
              data-ocid={`script.${key}.panel`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-accent">
                  {label}
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(editing === key ? null : key)}
                  data-ocid={`script.${key}.edit_button`}
                  className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {editing === key ? (
                <div className="space-y-2">
                  <Textarea
                    value={script[key]}
                    onChange={(e) =>
                      onScriptChange({ ...script, [key]: e.target.value })
                    }
                    rows={3}
                    className="bg-input border-border text-foreground text-sm resize-none"
                    data-ocid={`script.${key}.textarea`}
                  />
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateScript.isPending}
                    className="bg-primary text-primary-foreground text-xs"
                    data-ocid={`script.${key}.save_button`}
                  >
                    {updateScript.isPending ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3 mr-1" />
                    )}
                    Save
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {script[key]}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : null}

      <Button
        onClick={onProceed}
        disabled={!script || isLoading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-blue py-6 text-base font-semibold"
        data-ocid="script.submit_button"
      >
        <ChevronRight className="w-5 h-5 mr-2" /> Proceed to Scenes
      </Button>
    </div>
  );
}

// ─── Scenes View ──────────────────────────────────────────────────────────────
function ScenesView({
  scenes,
  isLoading,
  onProceed,
}: {
  scenes: Scene[];
  isLoading: boolean;
  onProceed: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-1">
          Scene <span className="text-gradient-blue">Timeline</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Review your scenes before rendering
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="scenes.loading_state">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              className="h-36 w-full rounded-xl bg-secondary/50"
            />
          ))}
        </div>
      ) : scenes.length === 0 ? (
        <div className="text-center py-16" data-ocid="scenes.empty_state">
          <p className="text-muted-foreground">No scenes generated yet.</p>
        </div>
      ) : (
        <div className="space-y-3" data-ocid="scenes.list">
          {scenes.map((scene, idx) => (
            <motion.div
              // biome-ignore lint/suspicious/noArrayIndexKey: stable list
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              data-ocid={`scenes.item.${idx + 1}`}
              className="rounded-xl border border-border bg-card card-glow p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 font-bold text-primary text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      {scene.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-xs border-border text-muted-foreground"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {scene.duration.toString()}s
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    <span className="text-accent font-medium">Visual:</span>{" "}
                    {scene.visualDescription}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-primary font-medium">Voiceover:</span>{" "}
                    {scene.voiceoverLine}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border text-muted-foreground hover:text-foreground text-xs shrink-0"
                  data-ocid={`scenes.edit_button.${idx + 1}`}
                >
                  <Edit2 className="w-3 h-3 mr-1" /> Edit
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Button
        onClick={onProceed}
        disabled={isLoading || scenes.length === 0}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-blue py-6 text-base font-semibold"
        data-ocid="scenes.submit_button"
      >
        <Film className="w-5 h-5 mr-2" /> Proceed to Render
      </Button>
    </div>
  );
}

// ─── Rendering View ───────────────────────────────────────────────────────────
function RenderingView({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(intervalRef.current!);
          setTimeout(onDone, 500);
          return 100;
        }
        return p + 1.5;
      });
      setMsgIdx((_m) => {
        const next = Math.floor((progress / 100) * STATUS_MESSAGES.length);
        return Math.min(next, STATUS_MESSAGES.length - 1);
      });
    }, 120);
    return () => clearInterval(intervalRef.current!);
  }, [onDone, progress]);

  return (
    <div
      className="flex flex-col items-center justify-center py-20 space-y-8"
      data-ocid="rendering.panel"
    >
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-primary/10 border border-primary/30 animate-pulse-glow" />
        <div className="absolute inset-2 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
          <Sparkles
            className="w-10 h-10 text-primary animate-spin"
            style={{ animationDuration: "3s" }}
          />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-display font-bold text-foreground">
          Rendering Your Video
        </h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-muted-foreground"
          >
            {STATUS_MESSAGES[msgIdx]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="w-full max-w-md space-y-2">
        <Progress
          value={progress}
          className="h-2 bg-secondary"
          data-ocid="rendering.loading_state"
        />
        <p className="text-right text-xs text-muted-foreground">
          {Math.round(progress)}%
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-md">
        {STATUS_MESSAGES.slice(0, 3).map((msg, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: stable list
            key={i}
            className={`rounded-lg border p-3 text-center transition-all ${
              msgIdx >= i
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-secondary/30 border-border text-muted-foreground/50"
            }`}
          >
            <p className="text-xs font-medium">{msg}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Output View ──────────────────────────────────────────────────────────────
function OutputView({ onNewVideo }: { onNewVideo: () => void }) {
  return (
    <div className="space-y-8" data-ocid="output.panel">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center mx-auto glow-teal">
          <Check className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Your Video is <span className="text-gradient-blue">Ready!</span>
        </h1>
        <p className="text-muted-foreground">
          Your AI-generated video has been created successfully
        </p>
      </div>

      {/* Video preview placeholder */}
      <div className="rounded-2xl border border-border bg-secondary/30 overflow-hidden aspect-video flex flex-col items-center justify-center gap-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
        <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center glow-blue relative z-10">
          <Play className="w-8 h-8 text-primary ml-1" />
        </div>
        <p className="text-muted-foreground text-sm relative z-10">
          Click to preview your video
        </p>
        <Badge
          variant="outline"
          className="border-accent/40 text-accent relative z-10"
        >
          <Sparkles className="w-3 h-3 mr-1" /> AI Generated
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 glow-blue py-5 font-semibold"
          data-ocid="output.primary_button"
        >
          <Download className="w-5 h-5 mr-2" /> Download Video
        </Button>
        <Button
          variant="outline"
          className="flex-1 border-border text-muted-foreground hover:text-foreground py-5 font-semibold"
          data-ocid="output.secondary_button"
        >
          <Share2 className="w-5 h-5 mr-2" /> Share
        </Button>
      </div>

      {/* Share chips */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Share to
        </p>
        <div className="flex gap-3 flex-wrap">
          {[
            { label: "TikTok", color: "bg-black border-white/20 text-white" },
            {
              label: "Instagram",
              color:
                "bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/40 text-purple-300",
            },
            {
              label: "YouTube",
              color: "bg-red-600/20 border-red-500/40 text-red-400",
            },
          ].map(({ label, color }) => (
            <button
              type="button"
              key={label}
              data-ocid="output.toggle"
              className={`px-5 py-2 rounded-full text-sm font-medium border transition-all hover:scale-105 ${color}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        onClick={onNewVideo}
        className="w-full border-border text-muted-foreground hover:text-foreground"
        data-ocid="output.secondary_button"
      >
        <Plus className="w-4 h-4 mr-2" /> Create Another Video
      </Button>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const year = new Date().getFullYear();
  const hostname = encodeURIComponent(window.location.hostname);

  return (
    <footer className="border-t border-border bg-[oklch(0.12_0.02_240)] mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clapperboard className="w-4 h-4 text-primary" />
              <span className="font-display font-bold text-foreground">
                ViralCut AI
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AI-powered viral video generation for creators everywhere.
            </p>
          </div>
          {[
            {
              title: "Product",
              links: ["Features", "Pricing", "Templates", "API"],
            },
            {
              title: "Resources",
              links: ["Tutorials", "Blog", "Community", "Status"],
            },
            {
              title: "Company",
              links: ["About", "Careers", "Privacy", "Terms"],
            },
          ].map(({ title, links }) => (
            <div key={title}>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                {title}
              </p>
              <div className="space-y-2">
                {links.map((l) => (
                  <p
                    key={l}
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    {l}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {year}. Built with ♥ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Settings View ────────────────────────────────────────────────────────────
function SettingsView({
  isAdmin,
  hasOpenAIKey,
  apiKeyInput,
  setApiKeyInput,
  setOpenAIKey,
}: {
  isAdmin: boolean | undefined;
  hasOpenAIKey: boolean | undefined;
  apiKeyInput: string;
  setApiKeyInput: (v: string) => void;
  setOpenAIKey: ReturnType<typeof useSetOpenAIKey>;
}) {
  return (
    <div className="space-y-8 max-w-2xl" data-ocid="settings.page">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure your ViralCut AI application settings.
        </p>
      </div>

      {/* API Key Card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              OpenAI API Key
            </h2>
            <p className="text-xs text-muted-foreground">
              Required for AI script &amp; scene generation
            </p>
          </div>
          <div className="ml-auto">
            {hasOpenAIKey === undefined ? (
              <span className="text-xs text-muted-foreground">Checking…</span>
            ) : hasOpenAIKey ? (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1"
                data-ocid="settings.success_state"
              >
                <Check className="w-3 h-3" /> Configured
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1"
                data-ocid="settings.error_state"
              >
                <AlertTriangle className="w-3 h-3" /> Not configured
              </span>
            )}
          </div>
        </div>

        {isAdmin ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter your OpenAI API key below. It is stored securely on-chain
              and only admins can update it.
            </p>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="bg-background border-border font-mono text-sm flex-1"
                data-ocid="settings.input"
              />
              <Button
                disabled={!apiKeyInput.trim() || setOpenAIKey.isPending}
                onClick={async () => {
                  try {
                    await setOpenAIKey.mutateAsync(apiKeyInput.trim());
                    toast.success("API key saved successfully!");
                    setApiKeyInput("");
                  } catch {
                    toast.error(
                      "Failed to save API key. Make sure you are an admin.",
                    );
                  }
                }}
                data-ocid="settings.save_button"
              >
                {setOpenAIKey.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Key
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              🔒 Your key is encrypted and only used for AI generation requests.
            </p>
          </div>
        ) : (
          <p
            className="text-sm text-muted-foreground"
            data-ocid="settings.panel"
          >
            AI generation requires an OpenAI API key configured by the app
            admin. Contact your administrator to set it up.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── ProfileView ─────────────────────────────────────────────────────────────
function ProfileView({
  principal,
  isAdmin,
}: {
  principal: string | undefined;
  isAdmin: boolean | undefined;
}) {
  return (
    <div className="space-y-8 max-w-2xl" data-ocid="profile.page">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Profile
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your account details and identity information.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Identity
            </h2>
            <p className="text-xs text-muted-foreground">
              Authenticated via Internet Identity
            </p>
          </div>
          <div className="ml-auto">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1"
              data-ocid="profile.success_state"
            >
              <Check className="w-3 h-3" /> Authenticated
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">
              Principal ID
            </p>
            <p
              className="text-sm font-mono text-foreground bg-background border border-border rounded-lg px-4 py-3 break-all"
              data-ocid="profile.panel"
            >
              {principal ?? "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">
              Role
            </p>
            <div className="flex items-center gap-2">
              {isAdmin === undefined ? (
                <span className="text-sm text-muted-foreground">Loading…</span>
              ) : isAdmin ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/30 rounded-full px-3 py-1">
                  <Shield className="w-3 h-3" /> Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/30 border border-border rounded-full px-3 py-1">
                  <User className="w-3 h-3" /> User
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<AppView>("dashboard");
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>(DEFAULT_WIZARD);
  const [currentProjectId, setCurrentProjectId] = useState<bigint | null>(null);
  const [currentScript, setCurrentScript] = useState<Script | null>(null);
  const [currentScenes, setCurrentScenes] = useState<Scene[]>([]);

  const createProject = useCreateProject();
  const generateScript = useGenerateScript();
  const generateScenes = useGenerateScenes();
  const updateStatus = useUpdateProjectStatus();

  const { identity } = useInternetIdentity();
  const { data: hasOpenAIKey } = useHasOpenAIKey();
  const { data: isAdmin } = useIsCallerAdmin();
  const setOpenAIKey = useSetOpenAIKey();
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  const showSidebar = [
    "template",
    "wizard",
    "script",
    "scenes",
    "rendering",
    "output",
  ].includes(view);

  const handleTemplateSelect = (defaults: Partial<WizardData>) => {
    setWizardData({ ...DEFAULT_WIZARD, ...defaults });
    setWizardStep(0);
    setView("wizard");
  };

  const handleWizardNext = async () => {
    if (wizardStep < WIZARD_STEPS.length - 1) {
      setWizardStep((s) => s + 1);
    } else {
      // Final step: create project and generate script
      try {
        const input: ProjectInput = {
          topic: wizardData.topic,
          goal: wizardData.goal,
          audience: wizardData.audience,
          platform: wizardData.platform,
          style: wizardData.style,
          voiceoverType: wizardData.voiceoverType,
        };
        const projectId = await createProject.mutateAsync(input);
        setCurrentProjectId(projectId);
        setView("script");
        // Generate script
        const script = await generateScript.mutateAsync(projectId);
        setCurrentScript(script);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("API key not configured") || msg.includes("OpenAI")) {
          toast.error(
            "OpenAI API key not set. An admin needs to configure it in Settings.",
          );
        } else {
          toast.error("Failed to generate script. Please try again.");
        }
        console.error(e);
      }
    }
  };

  const handleWizardBack = () => {
    if (wizardStep > 0) {
      setWizardStep((s) => s - 1);
    } else {
      setView("template");
    }
  };

  const handleRegenerate = async () => {
    if (!currentProjectId) return;
    try {
      const script = await generateScript.mutateAsync(currentProjectId);
      setCurrentScript(script);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("API key not configured") || msg.includes("OpenAI")) {
        toast.error(
          "OpenAI API key not set. An admin needs to configure it in Settings.",
        );
      } else {
        toast.error("Failed to regenerate script. Please try again.");
      }
    }
  };

  const handleProceedToScenes = async () => {
    if (!currentProjectId) return;
    setView("scenes");
    try {
      const scenes = await generateScenes.mutateAsync(currentProjectId);
      setCurrentScenes(scenes);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("API key not configured") || msg.includes("OpenAI")) {
        toast.error(
          "OpenAI API key not set. An admin needs to configure it in Settings.",
        );
      } else {
        toast.error("Failed to generate scenes. Please try again.");
      }
    }
  };

  const handleProceedToRender = async () => {
    if (!currentProjectId) return;
    setView("rendering");
    try {
      await updateStatus.mutateAsync({
        projectId: currentProjectId,
        status: ProjectStatus.rendering,
      });
    } catch {
      // non-fatal
    }
  };

  const handleRenderDone = async () => {
    if (currentProjectId) {
      try {
        await updateStatus.mutateAsync({
          projectId: currentProjectId,
          status: ProjectStatus.complete,
        });
      } catch {
        // non-fatal
      }
    }
    setView("output");
  };

  const handleNewVideo = () => {
    setWizardData(DEFAULT_WIZARD);
    setWizardStep(0);
    setCurrentProjectId(null);
    setCurrentScript(null);
    setCurrentScenes([]);
    setView("template");
  };

  const handleNav = (v: AppView) => {
    setView(v);
  };

  return (
    <div className="min-h-screen bg-page flex flex-col">
      <Toaster richColors />
      <Navbar view={view} onNav={handleNav} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Page title for wizard views */}
        {showSidebar && view !== "dashboard" && (
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
              Multi-Step Video{" "}
              <span className="text-gradient-blue">Generation Wizard</span>
            </h1>
          </div>
        )}

        <div
          className={`flex gap-8 ${
            showSidebar && view !== "dashboard" ? "flex-col lg:flex-row" : ""
          }`}
        >
          {/* OpenAI Key Banner */}
          {hasOpenAIKey === false && (
            <div className="px-4 pt-4">
              {isAdmin ? (
                <div
                  data-ocid="api_key.error_state"
                  className="flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="flex-1 text-amber-200">
                    OpenAI API key is not configured. AI generation will fail
                    until you set it.
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-500/50 text-amber-300 hover:bg-amber-500/20 text-xs gap-1"
                    onClick={() => setShowApiKeyDialog(true)}
                    data-ocid="api_key.open_modal_button"
                  >
                    <Settings className="w-3 h-3" />
                    Configure
                  </Button>
                </div>
              ) : (
                <div
                  data-ocid="api_key.error_state"
                  className="flex items-center gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm"
                >
                  <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-blue-200">
                    AI generation is not yet configured. Contact the app admin
                    to set up the OpenAI API key.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* API Key Dialog */}
          {showApiKeyDialog && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              data-ocid="api_key.modal"
            >
              <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
                <button
                  type="button"
                  className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => {
                    setShowApiKeyDialog(false);
                    setApiKeyInput("");
                  }}
                  data-ocid="api_key.close_button"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Key className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      OpenAI API Key
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Required for AI script &amp; scene generation
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="bg-background border-border font-mono text-sm"
                    data-ocid="api_key.input"
                  />
                  <p className="text-xs text-muted-foreground">
                    🔒 Your key is stored securely on-chain. Only admins can
                    change it.
                  </p>
                  <Button
                    className="w-full"
                    disabled={!apiKeyInput.trim() || setOpenAIKey.isPending}
                    onClick={async () => {
                      try {
                        await setOpenAIKey.mutateAsync(apiKeyInput.trim());
                        toast.success("API key saved successfully!");
                        setShowApiKeyDialog(false);
                        setApiKeyInput("");
                      } catch {
                        toast.error(
                          "Failed to save API key. Make sure you are an admin.",
                        );
                      }
                    }}
                    data-ocid="api_key.submit_button"
                  >
                    {setOpenAIKey.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Key
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {view === "dashboard" && <DashboardView onNav={handleNav} />}
                {view === "template" && (
                  <TemplateView onSelect={handleTemplateSelect} />
                )}
                {view === "wizard" && (
                  <WizardView
                    data={wizardData}
                    step={wizardStep}
                    onChange={(d) =>
                      setWizardData((prev) => ({ ...prev, ...d }))
                    }
                    onBack={handleWizardBack}
                    onNext={handleWizardNext}
                  />
                )}
                {view === "script" && (
                  <ScriptView
                    projectId={currentProjectId!}
                    script={currentScript}
                    onRegenerate={handleRegenerate}
                    onScriptChange={setCurrentScript}
                    onProceed={handleProceedToScenes}
                    isLoading={
                      generateScript.isPending || createProject.isPending
                    }
                  />
                )}
                {view === "scenes" && (
                  <ScenesView
                    scenes={currentScenes}
                    isLoading={generateScenes.isPending}
                    onProceed={handleProceedToRender}
                  />
                )}
                {view === "rendering" && (
                  <RenderingView onDone={handleRenderDone} />
                )}
                {view === "output" && (
                  <OutputView onNewVideo={handleNewVideo} />
                )}
                {view === "profile" && (
                  <ProfileView
                    principal={identity?.getPrincipal().toString()}
                    isAdmin={isAdmin}
                  />
                )}
                {view === "settings" && (
                  <SettingsView
                    isAdmin={isAdmin}
                    hasOpenAIKey={hasOpenAIKey}
                    apiKeyInput={apiKeyInput}
                    setApiKeyInput={setApiKeyInput}
                    setOpenAIKey={setOpenAIKey}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          {showSidebar && view !== "dashboard" && (
            <WizardSidebar wizardStep={wizardStep} view={view} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
