import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  GraduationCap,
  FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { ExamSettingsConfig, GradingScale, GradeRule } from "@/types/exams";
import {
  getExamSettings,
  updateExamSettings,
  getGradingScale,
  updateGradingScale,
} from "@/services/examService";
import { DEFAULT_GRADE_RULES } from "@/services/resultCalculationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const ExamSettingsView: React.FC = () => {
  const { organization, userProfile } = useAuth();

  const [settings, setSettings] = useState<ExamSettingsConfig>({
    examTypes: ["Unit Test", "Periodic Test", "Half Yearly", "Annual", "Pre-Board", "Board", "Practical", "Other"],
    defaultPassingPercentage: 33,
    requireAllSubjectsPass: true,
    enableRankings: true,
    showAttendanceOnReportCard: true,
    reportCardHeaderNote: "Annual Academic Performance & Evaluation Report",
    reportCardFooterNote: "This is a computer-generated official grade sheet.",
  });

  const [gradingScale, setGradingScale] = useState<GradingScale>({
    id: "default",
    organizationId: "",
    name: "Standard 8-Point Scale",
    isDefault: true,
    grades: DEFAULT_GRADE_RULES,
    createdAt: "",
    updatedAt: "",
  });

  const [newTypeInput, setNewTypeInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingScale, setIsSavingScale] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadSettings = async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const [s, g] = await Promise.all([
        getExamSettings(organization.id),
        getGradingScale(organization.id),
      ]);
      setSettings(s);
      setGradingScale(g);
    } catch (err) {
      console.error("Load exam settings error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [organization]);

  const handleAddType = () => {
    if (!newTypeInput.trim()) return;
    if (settings.examTypes.includes(newTypeInput.trim())) return;
    setSettings((prev) => ({
      ...prev,
      examTypes: [...prev.examTypes, newTypeInput.trim()],
    }));
    setNewTypeInput("");
  };

  const handleRemoveType = (t: string) => {
    setSettings((prev) => ({
      ...prev,
      examTypes: prev.examTypes.filter((item) => item !== t),
    }));
  };

  const handleSaveSettings = async () => {
    if (!organization || !userProfile) return;
    setIsSavingSettings(true);
    setSuccessMsg(null);
    try {
      await updateExamSettings(organization.id, settings, {
        uid: userProfile.uid,
        name: userProfile.displayName || "Admin",
      });
      setSuccessMsg("Examination settings saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to save exam settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveScale = async () => {
    if (!organization || !userProfile) return;
    setIsSavingScale(true);
    setSuccessMsg(null);
    try {
      await updateGradingScale(organization.id, {
        name: gradingScale.name,
        isDefault: true,
        grades: gradingScale.grades,
      }, {
        uid: userProfile.uid,
        name: userProfile.displayName || "Admin",
      });
      setSuccessMsg("Grading scale saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to save grading scale.");
    } finally {
      setIsSavingScale(false);
    }
  };

  const handleGradeRuleChange = (index: number, field: keyof GradeRule, val: any) => {
    setGradingScale((prev) => {
      const updated = [...prev.grades];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, grades: updated };
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-16">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-secondary" />
        <div className="h-64 animate-pulse rounded-3xl bg-secondary/80 border border-border/50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Examination & Grading Settings
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure examination types, passing criteria, grade point boundaries, and report card notes.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-600">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SECTION 1: Exam Types */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="border-b border-border pb-3">
          <h3 className="text-sm font-bold text-foreground">Configured Examination Types</h3>
          <p className="text-xs text-muted-foreground">
            These examination types appear in exam creation dropdowns across the institution.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {settings.examTypes.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground shadow-xs"
            >
              {t}
              <button
                type="button"
                onClick={() => handleRemoveType(t)}
                className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 max-w-sm pt-2">
          <Input
            placeholder="Add new exam type (e.g. Assessment-1)"
            value={newTypeInput}
            onChange={(e) => setNewTypeInput(e.target.value)}
            className="rounded-xl text-xs"
          />
          <Button onClick={handleAddType} variant="outline" size="sm" className="rounded-xl text-xs font-bold shrink-0">
            <Plus className="size-3.5 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* SECTION 2: Passing Criteria & Rules */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="border-b border-border pb-3">
          <h3 className="text-sm font-bold text-foreground">Passing Threshold & Academic Policies</h3>
          <p className="text-xs text-muted-foreground">
            Authoritative rules applied during automated result and grade processing.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="passPct" className="text-xs font-bold">
              Default Overall Passing Percentage (%)
            </Label>
            <Input
              id="passPct"
              type="number"
              min={1}
              max={100}
              value={settings.defaultPassingPercentage}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, defaultPassingPercentage: Number(e.target.value) }))
              }
              className="rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Checkbox
              id="reqAll"
              checked={settings.requireAllSubjectsPass}
              onCheckedChange={(c) =>
                setSettings((prev) => ({ ...prev, requireAllSubjectsPass: !!c }))
              }
            />
            <label htmlFor="reqAll" className="text-xs font-medium text-foreground cursor-pointer">
              Require passing in every individual subject to pass overall
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableRanks"
              checked={settings.enableRankings}
              onCheckedChange={(c) =>
                setSettings((prev) => ({ ...prev, enableRankings: !!c }))
              }
            />
            <label htmlFor="enableRanks" className="text-xs font-medium text-foreground cursor-pointer">
              Enable Class Rankings & Merit Standings
            </label>
          </div>
        </div>

        {/* Report Card Custom Notes */}
        <div className="space-y-3 pt-3 border-t border-border">
          <div className="space-y-1.5">
            <Label htmlFor="rcHeader" className="text-xs font-bold">
              Report Card Header Note
            </Label>
            <Input
              id="rcHeader"
              value={settings.reportCardHeaderNote || ""}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, reportCardHeaderNote: e.target.value }))
              }
              className="rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rcFooter" className="text-xs font-bold">
              Report Card Footer Disclaimer
            </Label>
            <Input
              id="rcFooter"
              value={settings.reportCardFooterNote || ""}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, reportCardFooterNote: e.target.value }))
              }
              className="rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <Button
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            variant="hero"
            size="sm"
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSavingSettings ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Save className="size-3.5 mr-1.5" />}
            Save Policy Settings
          </Button>
        </div>
      </div>

      {/* SECTION 3: Grading Scale Builder */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">Institutional Grading Scale</h3>
            <p className="text-xs text-muted-foreground">
              Define grade labels, percentage ranges, and grade point values.
            </p>
          </div>

          <Button
            onClick={handleSaveScale}
            disabled={isSavingScale}
            variant="hero"
            size="sm"
            className="rounded-xl text-xs font-bold"
          >
            {isSavingScale ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Save className="size-3.5 mr-1.5" />}
            Save Grading Scale
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-surface/50 font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
              <tr>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3 w-28">Min %</th>
                <th className="px-4 py-3 w-28">Max %</th>
                <th className="px-4 py-3 w-28">Grade Point</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {gradingScale.grades.map((rule, idx) => (
                <tr key={idx} className="hover:bg-surface/30">
                  <td className="px-4 py-2 font-black text-primary text-sm">
                    <Input
                      value={rule.grade}
                      onChange={(e) => handleGradeRuleChange(idx, "grade", e.target.value)}
                      className="h-8 w-20 rounded-lg text-xs font-bold"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      value={rule.minPercentage}
                      onChange={(e) => handleGradeRuleChange(idx, "minPercentage", Number(e.target.value))}
                      className="h-8 rounded-lg text-xs"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      value={rule.maxPercentage}
                      onChange={(e) => handleGradeRuleChange(idx, "maxPercentage", Number(e.target.value))}
                      className="h-8 rounded-lg text-xs"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      value={rule.gradePoint}
                      onChange={(e) => handleGradeRuleChange(idx, "gradePoint", Number(e.target.value))}
                      className="h-8 rounded-lg text-xs"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={rule.description || ""}
                      onChange={(e) => handleGradeRuleChange(idx, "description", e.target.value)}
                      className="h-8 rounded-lg text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
