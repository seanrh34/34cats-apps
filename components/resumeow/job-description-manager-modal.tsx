"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ResumeJobDescription } from "@/lib/types/resume";

const MAX_JOB_DESCRIPTIONS = 3;

interface JobDescriptionManagerModalProps {
  open: boolean;
  onClose: () => void;
  isLocked?: boolean;
  jobDescriptions: ResumeJobDescription[];
  onSaveJobDescription: (payload: {
    id?: string;
    title: string;
    company: string;
    role: string;
    content: string;
  }) => Promise<void>;
  onDeleteJobDescription: (jobDescriptionId: string) => Promise<void>;
  isSavingJobDescription: boolean;
}

export function JobDescriptionManagerModal({
  open,
  onClose,
  isLocked = false,
  jobDescriptions,
  onSaveJobDescription,
  onDeleteJobDescription,
  isSavingJobDescription,
}: JobDescriptionManagerModalProps) {
  const [jobDraft, setJobDraft] = useState({
    title: "",
    company: "",
    role: "",
    content: "",
  });
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  const resetDraft = () => {
    setEditingJobId(null);
    setLimitWarning(null);
    setJobDraft({
      title: "",
      company: "",
      role: "",
      content: "",
    });
  };

  const isAddingNew = editingJobId === null;
  const isAtJobDescriptionLimit = jobDescriptions.length >= MAX_JOB_DESCRIPTIONS;
  const shouldBlockNewSave = isAddingNew && isAtJobDescriptionLimit;

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto border border-gray-700 bg-gray-900/95 p-0">
        <div className="border-b border-gray-800 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-xl font-semibold text-white">
                Manage Job Descriptions
              </h4>
              <p className="mt-1 text-s text-gray-400">
                Add new contexts, edit existing ones, or delete old ones.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSavingJobDescription}
            >
              Close
            </Button>
          </div>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Card className="border border-gray-800 bg-gray-900/60 p-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Existing
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {jobDescriptions.length}/{MAX_JOB_DESCRIPTIONS} saved
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isAtJobDescriptionLimit) {
                    setLimitWarning(
                      `You can only save up to ${MAX_JOB_DESCRIPTIONS} job descriptions. Delete one to add a new one.`
                    );
                    return;
                  }
                  resetDraft();
                }}
                disabled={isLocked || isSavingJobDescription}
              >
                New
              </Button>
            </div>
            <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
              {jobDescriptions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-700 px-3 py-3 text-xs text-gray-400">
                  No saved job descriptions yet.
                </p>
              ) : (
                jobDescriptions.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-lg border border-gray-800 bg-black/20 p-3"
                  >
                    <p className="truncate text-sm font-medium text-white">
                      {job.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-gray-400">
                      {[job.company, job.role].filter(Boolean).join(" • ") ||
                        "No company or role"}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isLocked || isSavingJobDescription}
                        onClick={() => {
                          setLimitWarning(null);
                          setEditingJobId(job.id);
                          setJobDraft({
                            title: job.title,
                            company: job.company,
                            role: job.role,
                            content: job.content,
                          });
                        }}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          isLocked ||
                          isSavingJobDescription ||
                          deletingJobId === job.id
                        }
                        isLoading={deletingJobId === job.id}
                        onClick={async () => {
                          if (!confirm("Delete this job description?")) {
                            return;
                          }
                          setDeletingJobId(job.id);
                          try {
                            await onDeleteJobDescription(job.id);
                            setLimitWarning(null);
                            if (editingJobId === job.id) {
                              resetDraft();
                            }
                          } finally {
                            setDeletingJobId(null);
                          }
                        }}
                        className="flex-1"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="border border-gray-800 bg-gray-900/60 p-4">
            <div className="mb-3">
              <p className="text-sm font-semibold text-white">
                {editingJobId ? "Edit Job Description" : "Add Job Description"}
              </p>
              <p className="mt-1 text-s text-gray-400">
                This content can be selected as specific Job Description for Resumeow AI to tailor its feedback and edits.
                You may paste the job description directly from the job listing, or you can customize it to include specific details you want Resumeow AI to consider.
              </p>
            </div>

            <div className="space-y-3">
              <input
                value={jobDraft.title}
                onChange={(event) =>
                  setJobDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                disabled={isLocked || isSavingJobDescription}
                placeholder="Title"
                className="h-10 w-full rounded-xl border border-gray-700 bg-gray-800/60 px-3 text-sm text-white placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#E84A3A]"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={jobDraft.company}
                  onChange={(event) =>
                    setJobDraft((current) => ({
                      ...current,
                      company: event.target.value,
                    }))
                  }
                  disabled={isLocked || isSavingJobDescription}
                  placeholder="Company"
                  className="h-10 w-full rounded-xl border border-gray-700 bg-gray-800/60 px-3 text-sm text-white placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#E84A3A]"
                />
                <input
                  value={jobDraft.role}
                  onChange={(event) =>
                    setJobDraft((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                  disabled={isLocked || isSavingJobDescription}
                  placeholder="Role"
                  className="h-10 w-full rounded-xl border border-gray-700 bg-gray-800/60 px-3 text-sm text-white placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#E84A3A]"
                />
              </div>
              <textarea
                value={jobDraft.content}
                onChange={(event) =>
                  setJobDraft((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                disabled={isLocked || isSavingJobDescription}
                placeholder="Paste the job description here..."
                className="min-h-56 w-full rounded-xl border border-gray-700 bg-gray-800/60 px-3 py-3 text-sm text-white placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#E84A3A]"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={isLocked || isSavingJobDescription}
                  onClick={resetDraft}
                >
                  Clear
                </Button>
                <Button
                  isLoading={isSavingJobDescription}
                  disabled={isLocked || !jobDraft.content.trim()}
                  onClick={async () => {
                    if (shouldBlockNewSave) {
                      setLimitWarning(
                        `You can only save up to ${MAX_JOB_DESCRIPTIONS} job descriptions. Delete one to add a new one.`
                      );
                      return;
                    }

                    try {
                      await onSaveJobDescription({
                        id: editingJobId ?? undefined,
                        ...jobDraft,
                      });
                      setLimitWarning(null);
                      resetDraft();
                    } catch (error) {
                      const message =
                        error instanceof Error
                          ? error.message
                          : "Failed to save job description.";
                      setLimitWarning(message);
                    }
                  }}
                >
                  {editingJobId ? "Update" : "Add"}
                </Button>
              </div>
              {limitWarning ? (
                <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  {limitWarning}
                </p>
              ) : null}
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
}
