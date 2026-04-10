"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ResumeAiMessage,
  ResumeChangeSet,
  ResumeJobDescription,
  ResumeProfile,
} from "@/lib/types/resume";

interface ResumeAiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isStreaming: boolean;
  chatDisabled: boolean;
  chatDisabledReason?: string;
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendMessage: (actionHint?: "review" | "edit" | null) => Promise<void>;
  messages: ResumeAiMessage[];
  streamingText: string;
  changeSets: ResumeChangeSet[];
  onUndoChangeSet: (changeSetId: string) => Promise<void>;
  applyingChangeSetId?: string | null;
  consumedUndoChangeSetIds?: string[];
  profile: ResumeProfile | null;
  onOpenProfile: () => void;
  jobDescriptions: ResumeJobDescription[];
  selectedJobDescriptionId?: string | null;
  onSelectedJobDescriptionChange: (value: string) => void;
  onSaveJobDescription: (payload: {
    title: string;
    company: string;
    role: string;
    content: string;
  }) => Promise<void>;
  isSavingJobDescription: boolean;
  rateLimitMessage?: string | null;
  activeProcessLabel?: string | null;
  errorMessage?: string | null;
  isLocked?: boolean;
}

interface ReviewFindingPreview {
  id: string;
  title: string;
  severity: string;
  recommendation: string;
}

interface ToolMessageMetadata {
  findings?: ReviewFindingPreview[];
  changeSet?: ResumeChangeSet;
  diffItems?: ResumeChangeSet["diff_items"];
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-2 whitespace-pre-wrap text-sm leading-6 text-gray-100 last:mb-0">
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        em: ({ children }) => <em className="italic text-gray-100">{children}</em>,
        ul: ({ children }) => (
          <ul className="mb-2 list-disc space-y-1 pl-5 text-sm text-gray-100 last:mb-0">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal space-y-1 pl-5 text-sm text-gray-100 last:mb-0">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="leading-6">{children}</li>,
        code: ({ children }) => (
          <code className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-100">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="mb-2 overflow-x-auto rounded-lg border border-gray-800 bg-black/30 p-3 text-xs text-gray-100 last:mb-0">
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <div className="mb-2 overflow-x-auto rounded-lg border border-gray-800 last:mb-0">
            <table className="w-full border-collapse text-left text-xs text-gray-100">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-gray-800/80">{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr className="border-b border-gray-800">{children}</tr>,
        th: ({ children }) => (
          <th className="px-3 py-2 font-semibold text-white">{children}</th>
        ),
        td: ({ children }) => <td className="px-3 py-2 align-top">{children}</td>,
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-[#E84A3A] underline decoration-[#E84A3A]/60 underline-offset-2"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function SidebarMessage({
  message,
  onUndoChangeSet,
  applyingChangeSetId,
  consumedUndoChangeSetIds,
  changeSets,
  isLocked,
}: {
  message: ResumeAiMessage;
  onUndoChangeSet: (changeSetId: string) => Promise<void>;
  applyingChangeSetId?: string | null;
  consumedUndoChangeSetIds?: string[];
  changeSets: ResumeChangeSet[];
  isLocked?: boolean;
}) {
  const isUser = message.role === "user";
  const isTool = message.role === "tool";
  const metadata = (message.metadata ?? {}) as ToolMessageMetadata;
  const effectiveChangeSet = metadata.changeSet
    ? changeSets.find((changeSet) => changeSet.id === metadata.changeSet?.id) ??
      metadata.changeSet
    : null;
  const effectiveDiffItems =
    metadata.diffItems ?? effectiveChangeSet?.diff_items ?? [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? "rounded-br-md bg-[#E84A3A] text-white"
            : "rounded-bl-md border border-gray-800 bg-gray-900/90 text-gray-100"
        }`}
      >
        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em]">
          <span className={isUser ? "text-white/70" : "text-gray-500"}>
            {isUser
              ? "You"
              : isTool
                ? message.tool_name?.replace(/_/g, " ") ?? "Tool"
                : "Resume AI"}
          </span>
          <span className={isUser ? "text-white/50" : "text-gray-600"}>
            {new Date(message.created_at).toLocaleTimeString()}
          </span>
        </div>

        {isTool && message.tool_name === "review_resume" ? (
          <div className="space-y-3">
            <MarkdownMessage content={message.content} />
            {Array.isArray(metadata.findings) && metadata.findings.length > 0 ? (
              <div className="space-y-2">
                {metadata.findings.slice(0, 3).map((finding) => (
                  <div
                    key={finding.id}
                    className="rounded-xl border border-gray-800 bg-black/20 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-white">
                        {finding.title}
                      </p>
                      <span className="rounded-full bg-gray-800 px-2 py-1 text-[10px] uppercase tracking-wide text-gray-300">
                        {finding.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-gray-300">
                      {finding.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {isUser ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-white">
                {message.content}
              </p>
            ) : (
              <MarkdownMessage content={message.content} />
            )}
            {!isTool && !isUser && effectiveChangeSet ? (
              <div className="rounded-xl border border-[#E84A3A]/30 bg-[#E84A3A]/10 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {effectiveChangeSet.status === "applied"
                        ? "Resume updated"
                        : effectiveChangeSet.status === "reverted"
                          ? "Changes undone"
                          : "Change set ready"}
                    </p>
                    <p className="mt-1 text-xs text-gray-200">
                      {effectiveDiffItems.length} section
                      {effectiveDiffItems.length === 1
                        ? ""
                        : "s"}{" "}
                      updated.
                      {effectiveChangeSet.status === "applied"
                        ? " You can undo this change."
                        : effectiveChangeSet.status === "reverted"
                          ? " The prior resume has been restored."
                          : " Review the change set."}
                    </p>
                  </div>
                  {effectiveChangeSet.status === "applied" ? (
                    <Button
                      size="sm"
                      disabled={
                        isLocked ||
                        applyingChangeSetId === effectiveChangeSet.id ||
                        (consumedUndoChangeSetIds ?? []).includes(
                          effectiveChangeSet.id
                        )
                      }
                      isLoading={applyingChangeSetId === effectiveChangeSet.id}
                      onClick={() => {
                        if (isLocked) {
                          return;
                        }
                        void onUndoChangeSet(effectiveChangeSet.id);
                      }}
                    >
                      Undo
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function StreamingBubble({ streamingText }: { streamingText: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-gray-800 bg-gray-900/90 px-4 py-3 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-gray-500">
          <span>Resume AI</span>
          <span className="text-gray-600">typing</span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-100">
          {streamingText}
        </p>
      </div>
    </div>
  );
}

export function ResumeAiSidebar({
  isOpen,
  onClose,
  isStreaming,
  chatDisabled,
  chatDisabledReason,
  chatInput,
  onChatInputChange,
  onSendMessage,
  messages,
  streamingText,
  changeSets,
  onUndoChangeSet,
  applyingChangeSetId,
  consumedUndoChangeSetIds,
  profile,
  onOpenProfile,
  jobDescriptions,
  selectedJobDescriptionId,
  onSelectedJobDescriptionChange,
  onSaveJobDescription,
  isSavingJobDescription,
  rateLimitMessage,
  activeProcessLabel,
  errorMessage,
  isLocked = false,
}: ResumeAiSidebarProps) {
  const [jobDraft, setJobDraft] = useState({
    title: "",
    company: "",
    role: "",
    content: "",
  });
  const [isJobComposerOpen, setIsJobComposerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }

    node.scrollTo({
      top: node.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streamingText, changeSets]);

  const containerClassName = isOpen
    ? "fixed inset-y-0 right-0 z-40 w-full max-w-md translate-x-0 border-l border-gray-800 bg-gray-950/95 shadow-2xl shadow-black/30 backdrop-blur transition-transform lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:w-auto lg:max-w-none lg:translate-x-0 lg:overflow-hidden lg:rounded-3xl lg:border"
    : "fixed inset-y-0 right-0 z-40 w-full max-w-md translate-x-full border-l border-gray-800 bg-gray-950/95 shadow-2xl shadow-black/30 backdrop-blur transition-transform lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:w-auto lg:max-w-none lg:translate-x-0 lg:overflow-hidden lg:rounded-3xl lg:border";

  const canSend = !chatDisabled && !isStreaming && Boolean(chatInput.trim());

  const handleChatKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        void onSendMessage(null);
      }
    }
  };

  return (
    <aside className={containerClassName}>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="border-b border-gray-800 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Resume AI</h2>
              <p className="mt-1 text-xs leading-5 text-gray-400">
                Chat naturally. I&apos;ll interpret your prompt, review the current
                resume, and draft grounded changes when needed.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenProfile}
                disabled={isLocked}
              >
                {profile ? "Profile" : "Set Up"}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden">
                Close
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                Job Context
              </label>
              <select
                value={selectedJobDescriptionId ?? ""}
                onChange={(event) => {
                  if (isLocked) {
                    return;
                  }
                  onSelectedJobDescriptionChange(event.target.value);
                }}
                disabled={isLocked}
                className="h-11 w-full rounded-xl border border-gray-700 bg-gray-900/80 px-4 text-sm text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#E84A3A]"
              >
                <option value="">No job description selected</option>
                {jobDescriptions.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-gray-800 bg-gray-900/70 px-3 py-3">
              <div>
                <p className="text-sm font-medium text-white">Saved job descriptions</p>
                <p className="text-xs text-gray-400">
                  Add one if you want the AI to tailor edits to a role.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isLocked) {
                    return;
                  }
                  setIsJobComposerOpen((current) => !current);
                }}
                disabled={isLocked}
              >
                {isJobComposerOpen ? "Hide" : "Add"}
              </Button>
            </div>

            {isJobComposerOpen ? (
              <Card className="border border-gray-800 bg-gray-900/60 p-4">
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
                    className="min-h-28 w-full rounded-xl border border-gray-700 bg-gray-800/60 px-3 py-3 text-sm text-white placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#E84A3A]"
                  />
                  <Button
                    size="sm"
                    isLoading={isSavingJobDescription}
                    onClick={async () => {
                      if (isLocked) {
                        return;
                      }
                      await onSaveJobDescription(jobDraft);
                      setJobDraft({
                        title: "",
                        company: "",
                        role: "",
                        content: "",
                      });
                      setIsJobComposerOpen(false);
                    }}
                    disabled={isLocked || !jobDraft.content.trim()}
                  >
                    Save Job Description
                  </Button>
                </div>
              </Card>
            ) : null}

            {chatDisabledReason ? (
              <p className="rounded-xl border border-gray-800 bg-gray-900/70 px-3 py-2 text-xs text-gray-400">
                {chatDisabledReason}
              </p>
            ) : null}

            {rateLimitMessage ? (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                {rateLimitMessage}
              </p>
            ) : null}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && !streamingText && !activeProcessLabel && !errorMessage ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/50 p-4">
                <p className="text-sm text-white">
                  Try prompts like:
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Review this resume for the top three improvements.",
                    "Rewrite my experience bullets to sound sharper but stay truthful.",
                    "Tailor this resume for a product engineer role.",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => {
                        if (isLocked) {
                          return;
                        }
                        onChatInputChange(prompt);
                      }}
                      disabled={isLocked}
                      className="rounded-full border border-gray-700 bg-gray-900 px-3 py-2 text-left text-xs text-gray-200 transition-colors hover:border-[#E84A3A]/40 hover:bg-[#E84A3A]/10"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <SidebarMessage
                  key={message.id}
                  message={message}
                  onUndoChangeSet={onUndoChangeSet}
                  applyingChangeSetId={applyingChangeSetId}
                  consumedUndoChangeSetIds={consumedUndoChangeSetIds}
                  changeSets={changeSets}
                  isLocked={isLocked}
                />
              ))}
              {activeProcessLabel ? (
                <div className="flex justify-start">
                  <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-gray-800 bg-gray-900/90 px-4 py-3 shadow-sm">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-gray-500">
                      <span>Resume AI</span>
                      <span className="text-gray-600">working</span>
                    </div>
                    <p className="text-sm leading-6 text-gray-100">
                      {activeProcessLabel}
                    </p>
                  </div>
                </div>
              ) : null}
              {streamingText ? <StreamingBubble streamingText={streamingText} /> : null}
              {errorMessage ? (
                <div className="flex justify-start">
                  <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-red-500/30 bg-red-500/10 px-4 py-3 shadow-sm">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-red-200/80">
                      <span>Resume AI</span>
                      <span className="text-red-200/60">error</span>
                    </div>
                    <p className="text-sm leading-6 text-red-100">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 bg-gray-950/90 px-4 py-4">
          <div className="rounded-3xl border border-gray-800 bg-gray-900/90 p-3 shadow-sm">
            <textarea
              value={chatInput}
              onChange={(event) => onChatInputChange(event.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder={
                chatDisabled
                  ? "Save this resume to start chatting with Resume AI."
                  : "Ask for feedback, tailoring, or changes to the current resume..."
              }
              disabled={chatDisabled || isStreaming}
              className="min-h-28 w-full resize-none bg-transparent px-1 py-1 text-sm leading-6 text-white placeholder:text-gray-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Press Enter to send, Shift+Enter for a new line.
              </p>
              <Button
                onClick={() => void onSendMessage(null)}
                disabled={!canSend}
                isLoading={isStreaming}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
