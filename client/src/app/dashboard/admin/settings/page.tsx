"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminSettingsApi } from "@/api/settings";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Database,
  Globe,
  Loader2,
  Lock,
  Mail,
  Palette,
  Save,
  Settings,
  Shield,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Section definitions ──────────────────────────────────────────────────────

const SECTIONS = [
  { id: "system", label: "System", icon: Globe, color: "text-sky-500" },
  { id: "exam", label: "Exams", icon: Database, color: "text-indigo-500" },
  {
    id: "payment",
    label: "Payment",
    icon: CreditCard,
    color: "text-emerald-500",
  },
  { id: "security", label: "Security", icon: Shield, color: "text-red-500" },
  { id: "email", label: "Email / SMTP", icon: Mail, color: "text-violet-500" },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    color: "text-amber-500",
  },
  { id: "content", label: "Content", icon: Palette, color: "text-pink-500" },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    color: "text-teal-500",
  },
  { id: "database", label: "Database", icon: Lock, color: "text-orange-500" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

// ─── Default state shapes ─────────────────────────────────────────────────────

const DEFAULTS = {
  system: {
    siteName: "QuizNow",
    siteDescription: "Professional Exam Preparation Platform",
    siteUrl: "https://quiznow.com",
    allowRegistration: true,
    requireEmailVerification: false,
    maintenanceMode: false,
    defaultLanguage: "en",
    timezone: "UTC",
  },
  exam: {
    defaultTestDuration: 60,
    defaultPassingMarks: 40,
    defaultNegativeMarking: 0.33,
    allowNegativeMarking: true,
    showResultsImmediately: true,
    allowRetest: true,
    retestWaitingPeriod: 24,
    maxQuestionsPerTest: 200,
    autoSubmitOnTimeout: true,
  },
  payment: {
    enablePayments: false,
    currency: "INR",
    testPrice: 99,
    subscriptionEnabled: false,
    monthlySubscriptionPrice: 299,
    yearlySubscriptionPrice: 2990,
    freeTestsPerMonth: 5,
  },
  email: {
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "noreply@quiznow.com",
    fromName: "QuizNow Team",
    enableEmailNotifications: true,
  },
  security: {
    passwordMinLength: "8",
    requireStrongPassword: true,
    sessionTimeout: "24",
    maxLoginAttempts: "5",
    enableTwoFactor: false,
    enableCaptcha: false,
    blockSuspiciousIPs: true,
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    newTestAlerts: true,
    userRegistrationAlerts: true,
    paymentAlerts: true,
    systemErrorAlerts: true,
    dailyDigest: false,
  },
  content: {
    enableQuestionBank: true,
    allowUserGeneratedContent: false,
    contentModeration: true,
    autoTranslateQuestions: false,
  },
  analytics: {
    enableAnalytics: true,
    trackUserBehavior: true,
    trackTestPerformance: true,
    anonymizeData: true,
    dataRetentionPeriod: 365,
  },
  database: {
    // read-only stats + action triggers — not persisted via key-value
  },
} as const;

// ─── DRY field primitives ─────────────────────────────────────────────────────

function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  step,
  description,
}: {
  id: string;
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
  description?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-xs font-semibold text-slate-700 dark:text-slate-300"
      >
        {label}
      </Label>
      {description && (
        <p className="text-[11px] text-slate-400">{description}</p>
      )}
      <Input
        id={id}
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700"
      />
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  danger,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="space-y-0.5 flex-1">
        <p
          className={cn(
            "text-sm font-medium",
            danger
              ? "text-red-600 dark:text-red-400"
              : "text-slate-800 dark:text-slate-200",
          )}
        >
          {label}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {description}
        </p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={danger && checked ? "data-[state=checked]:bg-red-500" : ""}
      />
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  color,
  title,
  description,
}: {
  icon: React.ElementType;
  color: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
      <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
        <Icon
          className={cn("h-4.5 w-4.5", color)}
          style={{ height: "1.125rem", width: "1.125rem" }}
        />
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
          {title}
        </h2>
        <p className="text-xs text-slate-400 mt-px">{description}</p>
      </div>
    </div>
  );
}

function SaveButton({
  onSave,
  saving,
  dirty,
}: {
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
      {dirty ? (
        <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <TriangleAlert className="h-3.5 w-3.5" />
          Unsaved changes
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          All changes saved
        </span>
      )}
      <Button
        size="sm"
        onClick={onSave}
        disabled={saving || !dirty}
        className="h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        {saving ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Save className="h-3.5 w-3.5" />
            Save Changes
          </>
        )}
      </Button>
    </div>
  );
}

// ─── useSectionSettings hook — handles load / save / dirty tracking ──────────

type SettingsMap = Record<string, any>;

function useSectionSettings(prefix: string, defaults: SettingsMap) {
  const [values, setValues] = useState<SettingsMap>(defaults);
  const [saved, setSaved] = useState<SettingsMap>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load from backend once on mount
  useEffect(() => {
    setLoading(true);
    adminSettingsApi
      .getAll()
      .then((res) => {
        const all: Record<string, any> = res.data ?? {};
        // Backend stores keys as e.g. "system.siteName" — merge into local state
        const merged = { ...defaults };
        Object.entries(all).forEach(([k, v]) => {
          if (k.startsWith(`${prefix}.`)) {
            const field = k.slice(prefix.length + 1);
            if (field in merged) {
              (merged as any)[field] = v;
            }
          }
        });
        setValues(merged);
        setSaved(merged);
      })
      .catch(() => {
        // API not ready / no settings yet — silently use defaults
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix]);

  const set = useCallback(<K extends keyof SettingsMap>(key: K, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const batch = Object.entries(values).map(([k, v]) => ({
        id: `${prefix}.${k}`,
        key: `${prefix}.${k}`,
        value: v,
      }));
      await adminSettingsApi.updateBatch(batch);
      setSaved({ ...values });
      toast({
        title: "Settings saved",
        description: `${prefix} settings updated.`,
      });
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [values, prefix, toast]);

  return { values, set, save, saving, dirty, loading };
}

// ─── Individual section panels ────────────────────────────────────────────────

function SystemPanel() {
  const {
    values: v,
    set,
    save,
    saving,
    dirty,
    loading,
  } = useSectionSettings("system", DEFAULTS.system);
  if (loading) return <PanelSkeleton />;
  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Globe}
        color="text-sky-500"
        title="System Configuration"
        description="Basic platform settings, branding, and access control"
      />
      <FieldRow>
        <TextField
          id="siteName"
          label="Site Name"
          value={v.siteName}
          onChange={(val) => set("siteName", val)}
          placeholder="QuizNow"
        />
        <TextField
          id="siteDescription"
          label="Site Description"
          value={v.siteDescription}
          onChange={(val) => set("siteDescription", val)}
          placeholder="Professional Exam Preparation"
        />
        <TextField
          id="siteUrl"
          label="Site URL"
          value={v.siteUrl}
          onChange={(val) => set("siteUrl", val)}
          placeholder="https://quiznow.com"
        />
        <TextField
          id="defaultLanguage"
          label="Default Language"
          value={v.defaultLanguage}
          onChange={(val) => set("defaultLanguage", val)}
          placeholder="en"
        />
        <TextField
          id="timezone"
          label="Timezone"
          value={v.timezone}
          onChange={(val) => set("timezone", val)}
          placeholder="UTC"
        />
      </FieldRow>
      <div className="pt-2">
        <ToggleRow
          label="Allow User Registration"
          description="New users can sign up on the platform"
          checked={v.allowRegistration}
          onCheckedChange={(c) => set("allowRegistration", c)}
        />
        <ToggleRow
          label="Require Email Verification"
          description="Users must verify their email before access"
          checked={v.requireEmailVerification}
          onCheckedChange={(c) => set("requireEmailVerification", c)}
        />
        <ToggleRow
          label="Maintenance Mode"
          description="Platform shows a maintenance page to all users"
          checked={v.maintenanceMode}
          onCheckedChange={(c) => set("maintenanceMode", c)}
          danger
        />
      </div>
      <SaveButton onSave={save} saving={saving} dirty={dirty} />
    </div>
  );
}

function ExamPanel() {
  const {
    values: v,
    set,
    save,
    saving,
    dirty,
    loading,
  } = useSectionSettings("exam", DEFAULTS.exam);
  if (loading) return <PanelSkeleton />;
  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Database}
        color="text-indigo-500"
        title="Exam Configuration"
        description="Defaults for test timing, scoring, and retry rules"
      />
      <FieldRow>
        <TextField
          id="defaultTestDuration"
          label="Default Test Duration (min)"
          type="number"
          value={v.defaultTestDuration}
          onChange={(val) => set("defaultTestDuration", Number(val))}
        />
        <TextField
          id="defaultPassingMarks"
          label="Default Passing Marks (%)"
          type="number"
          value={v.defaultPassingMarks}
          onChange={(val) => set("defaultPassingMarks", Number(val))}
        />
        <TextField
          id="defaultNegativeMarking"
          label="Default Negative Marking"
          type="number"
          step="0.01"
          value={v.defaultNegativeMarking}
          onChange={(val) => set("defaultNegativeMarking", Number(val))}
        />
        <TextField
          id="maxQuestionsPerTest"
          label="Max Questions Per Test"
          type="number"
          value={v.maxQuestionsPerTest}
          onChange={(val) => set("maxQuestionsPerTest", Number(val))}
        />
        <TextField
          id="retestWaitingPeriod"
          label="Retest Waiting Period (hrs)"
          type="number"
          value={v.retestWaitingPeriod}
          onChange={(val) => set("retestWaitingPeriod", Number(val))}
        />
      </FieldRow>
      <div className="pt-2">
        <ToggleRow
          label="Allow Negative Marking"
          description="Deduct marks for wrong answers"
          checked={v.allowNegativeMarking}
          onCheckedChange={(c) => set("allowNegativeMarking", c)}
        />
        <ToggleRow
          label="Show Results Immediately"
          description="Display scores as soon as test is submitted"
          checked={v.showResultsImmediately}
          onCheckedChange={(c) => set("showResultsImmediately", c)}
        />
        <ToggleRow
          label="Allow Retest"
          description="Users can retake the same test"
          checked={v.allowRetest}
          onCheckedChange={(c) => set("allowRetest", c)}
        />
        <ToggleRow
          label="Auto Submit on Timeout"
          description="Automatically submit when time expires"
          checked={v.autoSubmitOnTimeout}
          onCheckedChange={(c) => set("autoSubmitOnTimeout", c)}
        />
      </div>
      <SaveButton onSave={save} saving={saving} dirty={dirty} />
    </div>
  );
}

function PaymentPanel() {
  const {
    values: v,
    set,
    save,
    saving,
    dirty,
    loading,
  } = useSectionSettings("payment", DEFAULTS.payment);
  if (loading) return <PanelSkeleton />;
  return (
    <div className="space-y-6">
      <SectionHeader
        icon={CreditCard}
        color="text-emerald-500"
        title="Payment Configuration"
        description="Gateway settings, pricing, and subscription plans"
      />
      <FieldRow>
        <TextField
          id="currency"
          label="Currency"
          value={v.currency}
          onChange={(val) => set("currency", val)}
          placeholder="INR"
        />
        <TextField
          id="testPrice"
          label="Per-Test Price (₹)"
          type="number"
          value={v.testPrice}
          onChange={(val) => set("testPrice", Number(val))}
        />
        <TextField
          id="monthlySubscriptionPrice"
          label="Monthly Subscription (₹)"
          type="number"
          value={v.monthlySubscriptionPrice}
          onChange={(val) => set("monthlySubscriptionPrice", Number(val))}
        />
        <TextField
          id="yearlySubscriptionPrice"
          label="Yearly Subscription (₹)"
          type="number"
          value={v.yearlySubscriptionPrice}
          onChange={(val) => set("yearlySubscriptionPrice", Number(val))}
        />
        <TextField
          id="freeTestsPerMonth"
          label="Free Tests Per Month"
          type="number"
          value={v.freeTestsPerMonth}
          onChange={(val) => set("freeTestsPerMonth", Number(val))}
        />
      </FieldRow>
      <div className="pt-2">
        <ToggleRow
          label="Enable Payments"
          description="Collect payments for premium tests"
          checked={v.enablePayments}
          onCheckedChange={(c) => set("enablePayments", c)}
        />
        <ToggleRow
          label="Enable Subscriptions"
          description="Allow users to subscribe for unlimited access"
          checked={v.subscriptionEnabled}
          onCheckedChange={(c) => set("subscriptionEnabled", c)}
        />
      </div>
      <SaveButton onSave={save} saving={saving} dirty={dirty} />
    </div>
  );
}

function SecurityPanel() {
  const {
    values: v,
    set,
    save,
    saving,
    dirty,
    loading,
  } = useSectionSettings("security", DEFAULTS.security);
  if (loading) return <PanelSkeleton />;
  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Shield}
        color="text-red-500"
        title="Security Configuration"
        description="Password policy, sessions, and authentication controls"
      />
      <FieldRow>
        <TextField
          id="passwordMinLength"
          label="Minimum Password Length"
          type="number"
          value={v.passwordMinLength}
          onChange={(val) => set("passwordMinLength", val)}
        />
        <TextField
          id="sessionTimeout"
          label="Session Timeout (hours)"
          type="number"
          value={v.sessionTimeout}
          onChange={(val) => set("sessionTimeout", val)}
        />
        <TextField
          id="maxLoginAttempts"
          label="Max Login Attempts"
          type="number"
          value={v.maxLoginAttempts}
          onChange={(val) => set("maxLoginAttempts", val)}
        />
      </FieldRow>
      <div className="pt-2">
        <ToggleRow
          label="Require Strong Password"
          description="Enforce uppercase, number, and symbol requirements"
          checked={v.requireStrongPassword}
          onCheckedChange={(c) => set("requireStrongPassword", c)}
        />
        <ToggleRow
          label="Enable Two-Factor Authentication"
          description="Allow users to enable 2FA via authenticator app"
          checked={v.enableTwoFactor}
          onCheckedChange={(c) => set("enableTwoFactor", c)}
        />
        <ToggleRow
          label="Enable CAPTCHA"
          description="Show CAPTCHA on login and registration forms"
          checked={v.enableCaptcha}
          onCheckedChange={(c) => set("enableCaptcha", c)}
        />
        <ToggleRow
          label="Block Suspicious IPs"
          description="Automatically block IPs with too many failed attempts"
          checked={v.blockSuspiciousIPs}
          onCheckedChange={(c) => set("blockSuspiciousIPs", c)}
        />
      </div>
      <SaveButton onSave={save} saving={saving} dirty={dirty} />
    </div>
  );
}

function EmailPanel() {
  const {
    values: v,
    set,
    save,
    saving,
    dirty,
    loading,
  } = useSectionSettings("email", DEFAULTS.email);
  if (loading) return <PanelSkeleton />;
  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Mail}
        color="text-violet-500"
        title="Email / SMTP Configuration"
        description="Outbound email settings for notifications and verification"
      />
      <FieldRow>
        <TextField
          id="smtpHost"
          label="SMTP Host"
          value={v.smtpHost}
          onChange={(val) => set("smtpHost", val)}
          placeholder="smtp.gmail.com"
        />
        <TextField
          id="smtpPort"
          label="SMTP Port"
          type="number"
          value={v.smtpPort}
          onChange={(val) => set("smtpPort", val)}
          placeholder="587"
        />
        <TextField
          id="smtpUser"
          label="SMTP Username"
          value={v.smtpUser}
          onChange={(val) => set("smtpUser", val)}
          placeholder="your@email.com"
        />
        <TextField
          id="smtpPassword"
          label="SMTP Password"
          type="password"
          value={v.smtpPassword}
          onChange={(val) => set("smtpPassword", val)}
          placeholder="App password"
        />
        <TextField
          id="fromEmail"
          label="From Email"
          value={v.fromEmail}
          onChange={(val) => set("fromEmail", val)}
          placeholder="noreply@quiznow.com"
        />
        <TextField
          id="fromName"
          label="From Name"
          value={v.fromName}
          onChange={(val) => set("fromName", val)}
          placeholder="QuizNow Team"
        />
      </FieldRow>
      <div className="pt-2">
        <ToggleRow
          label="Enable Email Notifications"
          description="Send automated emails to users"
          checked={v.enableEmailNotifications}
          onCheckedChange={(c) => set("enableEmailNotifications", c)}
        />
      </div>
      <SaveButton onSave={save} saving={saving} dirty={dirty} />
    </div>
  );
}

function NotificationsPanel() {
  const {
    values: v,
    set,
    save,
    saving,
    dirty,
    loading,
  } = useSectionSettings("notifications", DEFAULTS.notifications);
  if (loading) return <PanelSkeleton />;
  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Bell}
        color="text-amber-500"
        title="Notification Preferences"
        description="Control which alerts and digests are sent"
      />
      <div className="pt-2">
        <ToggleRow
          label="Email Notifications"
          description="Send email notifications to users"
          checked={v.emailNotifications}
          onCheckedChange={(c) => set("emailNotifications", c)}
        />
        <ToggleRow
          label="Push Notifications"
          description="Enable browser push notifications"
          checked={v.pushNotifications}
          onCheckedChange={(c) => set("pushNotifications", c)}
        />
        <ToggleRow
          label="SMS Notifications"
          description="Send SMS alerts (requires SMS gateway)"
          checked={v.smsNotifications}
          onCheckedChange={(c) => set("smsNotifications", c)}
        />
        <ToggleRow
          label="New Test Alerts"
          description="Notify users when new tests are published"
          checked={v.newTestAlerts}
          onCheckedChange={(c) => set("newTestAlerts", c)}
        />
        <ToggleRow
          label="User Registration Alerts"
          description="Alert admins on new user signups"
          checked={v.userRegistrationAlerts}
          onCheckedChange={(c) => set("userRegistrationAlerts", c)}
        />
        <ToggleRow
          label="Payment Alerts"
          description="Notify admins of successful payments"
          checked={v.paymentAlerts}
          onCheckedChange={(c) => set("paymentAlerts", c)}
        />
        <ToggleRow
          label="System Error Alerts"
          description="Alert admins of critical system errors"
          checked={v.systemErrorAlerts}
          onCheckedChange={(c) => set("systemErrorAlerts", c)}
        />
        <ToggleRow
          label="Daily Digest"
          description="Send a daily summary email to admins"
          checked={v.dailyDigest}
          onCheckedChange={(c) => set("dailyDigest", c)}
        />
      </div>
      <SaveButton onSave={save} saving={saving} dirty={dirty} />
    </div>
  );
}

function ContentPanel() {
  const {
    values: v,
    set,
    save,
    saving,
    dirty,
    loading,
  } = useSectionSettings("content", DEFAULTS.content);
  if (loading) return <PanelSkeleton />;
  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Palette}
        color="text-pink-500"
        title="Content Settings"
        description="Question bank, moderation, and multilingual support"
      />
      <div className="pt-2">
        <ToggleRow
          label="Enable Question Bank"
          description="Allow admins to manage a shared question library"
          checked={v.enableQuestionBank}
          onCheckedChange={(c) => set("enableQuestionBank", c)}
        />
        <ToggleRow
          label="Allow User Generated Content"
          description="Instructors can contribute questions"
          checked={v.allowUserGeneratedContent}
          onCheckedChange={(c) => set("allowUserGeneratedContent", c)}
        />
        <ToggleRow
          label="Content Moderation"
          description="Review user-submitted content before publishing"
          checked={v.contentModeration}
          onCheckedChange={(c) => set("contentModeration", c)}
        />
        <ToggleRow
          label="Auto-Translate Questions"
          description="Automatically translate questions using AI (experimental)"
          checked={v.autoTranslateQuestions}
          onCheckedChange={(c) => set("autoTranslateQuestions", c)}
        />
      </div>
      <SaveButton onSave={save} saving={saving} dirty={dirty} />
    </div>
  );
}

function AnalyticsPanel() {
  const {
    values: v,
    set,
    save,
    saving,
    dirty,
    loading,
  } = useSectionSettings("analytics", DEFAULTS.analytics);
  if (loading) return <PanelSkeleton />;
  return (
    <div className="space-y-6">
      <SectionHeader
        icon={BarChart3}
        color="text-teal-500"
        title="Analytics Configuration"
        description="Data collection, retention, and performance tracking"
      />
      <FieldRow>
        <TextField
          id="dataRetentionPeriod"
          label="Data Retention Period (days)"
          type="number"
          value={v.dataRetentionPeriod}
          onChange={(val) => set("dataRetentionPeriod", Number(val))}
          description="Analytics data older than this will be purged"
        />
      </FieldRow>
      <div className="pt-2">
        <ToggleRow
          label="Enable Analytics"
          description="Track platform-wide usage statistics"
          checked={v.enableAnalytics}
          onCheckedChange={(c) => set("enableAnalytics", c)}
        />
        <ToggleRow
          label="Track User Behavior"
          description="Record page views, clicks, and session data"
          checked={v.trackUserBehavior}
          onCheckedChange={(c) => set("trackUserBehavior", c)}
        />
        <ToggleRow
          label="Track Test Performance"
          description="Collect question-level accuracy and timing data"
          checked={v.trackTestPerformance}
          onCheckedChange={(c) => set("trackTestPerformance", c)}
        />
        <ToggleRow
          label="Anonymize Data"
          description="Strip PII before storing analytics"
          checked={v.anonymizeData}
          onCheckedChange={(c) => set("anonymizeData", c)}
        />
      </div>
      <SaveButton onSave={save} saving={saving} dirty={dirty} />
    </div>
  );
}

// ─── Database panel (actions only — nothing persisted) ────────────────────────

function DatabasePanel() {
  const { toast } = useToast();
  const [running, setRunning] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const dbStats = [
    { label: "Total Users", value: "—" },
    { label: "Total Tests", value: "—" },
    { label: "Total Questions", value: "—" },
    { label: "Total Attempts", value: "—" },
  ];

  const runAction = async (action: string, label: string) => {
    setRunning(action);
    // Simulated — wire to real endpoints when available
    await new Promise((r) => setTimeout(r, 1200));
    toast({ title: `${label} complete` });
    setRunning(null);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Lock}
        color="text-orange-500"
        title="Database Management"
        description="Stats and maintenance actions — use with caution"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {dbStats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-center"
          >
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {s.value}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <Separator />

      {/* Maintenance actions */}
      <div className="space-y-2">
        {[
          {
            id: "cache",
            label: "Clear Cache",
            description: "Flush all server-side caches",
          },
          {
            id: "optimize",
            label: "Optimize Database",
            description: "Run VACUUM and re-index tables",
          },
          {
            id: "backup",
            label: "Backup Database",
            description: "Download a full database snapshot",
          },
        ].map((action) => (
          <div
            key={action.id}
            className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          >
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {action.label}
              </p>
              <p className="text-xs text-slate-400">{action.description}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs shrink-0"
              disabled={running === action.id}
              onClick={() => runAction(action.id, action.label)}
            >
              {running === action.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                action.label
              )}
            </Button>
          </div>
        ))}

        {/* Destructive action */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10">
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Reset Demo Data
            </p>
            <p className="text-xs text-red-400">
              Permanently delete all demo content. Cannot be undone.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 text-xs shrink-0"
            disabled={!!running}
            onClick={() => setResetOpen(true)}
          >
            Reset
          </Button>
        </div>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset demo data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all demo content including test
              attempts, demo users, and sample questions.{" "}
              <strong>This cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                setResetOpen(false);
                await runAction("reset", "Reset Demo Data");
              }}
            >
              Yes, reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Skeleton for loading state ───────────────────────────────────────────────

function PanelSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-72" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ))}
      </div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800"
          >
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-60" />
            </div>
            <Skeleton className="h-5 w-9 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Panel map ────────────────────────────────────────────────────────────────

const PANEL_MAP: Record<SectionId, React.ComponentType> = {
  system: SystemPanel,
  exam: ExamPanel,
  payment: PaymentPanel,
  security: SecurityPanel,
  email: EmailPanel,
  notifications: NotificationsPanel,
  content: ContentPanel,
  analytics: AnalyticsPanel,
  database: DatabasePanel,
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("system");

  const ActivePanel = PANEL_MAP[activeSection];
  const activeInfo = SECTIONS.find((s) => s.id === activeSection)!;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-linear-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center shadow-sm">
          <Settings className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
            Settings
          </h1>
          <p className="text-xs text-slate-400 mt-px">
            Configure your QuizNow platform
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-5 items-start">
        {/* ── Left nav ── */}
        <nav className="w-52 shrink-0 hidden md:block sticky top-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Configuration
              </p>
            </div>
            <div className="p-1.5 space-y-0.5">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      "w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-colors",
                        isActive
                          ? s.color
                          : "text-slate-300 dark:text-slate-600 group-hover:text-slate-400",
                      )}
                    />
                    <span className="truncate flex-1">{s.label}</span>
                    {isActive && (
                      <ChevronRight className="h-3 w-3 text-indigo-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* ── Content panel ── */}
        <div className="flex-1 min-w-0">
          {/* Mobile section picker (shown instead of sidebar) */}
          <div className="md:hidden mb-4">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      activeSection === s.id
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <ActivePanel />
          </div>
        </div>
      </div>
    </div>
  );
}
