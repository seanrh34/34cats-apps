"use client";

import {
  Fragment,
  KeyboardEvent,
  useLayoutEffect,
  ReactNode,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AI_LINE_BREAK_TOKEN,
  normalizeAiMessageContent,
} from "@/lib/ai/resumeow/utils";
import {
  ResumeAiMessage,
  ResumeAiProcessPhase,
  ResumeChangeSet,
  ResumeJobDescription,
  ResumeProfile,
} from "@/lib/types/resume";

type ProcessUpdate = {
  phase: ResumeAiProcessPhase;
  label: string;
};

interface ResumeAiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  resumeId?: string;
  scrollToLatestSignal?: number;
  isStreaming: boolean;
  chatDisabled: boolean;
  chatDisabledReason?: string;
  onSendMessage: (
    messageText?: string,
    actionHint?: "review" | "edit" | null
  ) => Promise<void>;
  messages: ResumeAiMessage[];
  streamingText: string;
  changeSets: ResumeChangeSet[];
  onUndoChangeSet: (changeSetId: string) => Promise<void>;
  applyingChangeSetId?: string | null;
  consumedUndoChangeSetIds?: string[];
  profile: ResumeProfile | null;
  onOpenProfile: () => void;
  onOpenJobDescriptionManager: () => void;
  jobDescriptions: ResumeJobDescription[];
  selectedJobDescriptionId?: string | null;
  onSelectedJobDescriptionChange: (value: string) => void;
  rateLimitMessage?: string | null;
  activeProcessLabel?: string | null;
  processUpdates?: ProcessUpdate[];
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

const PROCESS_PHASE_STYLES: Record<
  ResumeAiProcessPhase,
  {
    badge: string;
    activeDot: string;
    idleDot: string;
    activeText: string;
    idleText: string;
    label: string;
  }
> = {
  planning: {
    badge: "border-sky-500/30 bg-sky-500/10 text-sky-200",
    activeDot: "bg-sky-400",
    idleDot: "bg-sky-900/80",
    activeText: "text-sky-100",
    idleText: "text-sky-200/70",
    label: "PLAN",
  },
  context: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    activeDot: "bg-emerald-400",
    idleDot: "bg-emerald-900/80",
    activeText: "text-emerald-100",
    idleText: "text-emerald-200/70",
    label: "CTX",
  },
  reasoning: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    activeDot: "bg-amber-400",
    idleDot: "bg-amber-900/80",
    activeText: "text-amber-100",
    idleText: "text-amber-200/70",
    label: "RSN",
  },
  apply: {
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-200",
    activeDot: "bg-rose-400",
    idleDot: "bg-rose-900/80",
    activeText: "text-rose-100",
    idleText: "text-rose-200/70",
    label: "APY",
  },
};

function renderLineBreakTokens(node: ReactNode): ReactNode {
  if (typeof node === "string") {
    const parts = node.split(AI_LINE_BREAK_TOKEN);
    if (parts.length === 1) {
      return node;
    }

    return parts.flatMap((part, index) =>
      index === 0 ? [part] : [<br key={`br-${index}`} />, part]
    );
  }

  if (Array.isArray(node)) {
    return node.map((child, index) => (
      <Fragment key={index}>{renderLineBreakTokens(child)}</Fragment>
    ));
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return cloneElement(node, {
      children: renderLineBreakTokens(node.props.children),
    });
  }

  return node;
}

function MarkdownMessage({ content }: { content: string }) {
  const normalizedContent = normalizeAiMessageContent(content);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-2 whitespace-pre-wrap text-sm leading-6 text-gray-100 last:mb-0">
            {renderLineBreakTokens(children)}
          </p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-white">
            {renderLineBreakTokens(children)}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-gray-100">{renderLineBreakTokens(children)}</em>
        ),
        ul: ({ children }) => (
          <ul className="mb-2 list-disc space-y-1 pl-5 text-sm text-gray-100 last:mb-0">
            {renderLineBreakTokens(children)}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal space-y-1 pl-5 text-sm text-gray-100 last:mb-0">
            {renderLineBreakTokens(children)}
          </ol>
        ),
        li: ({ children }) => (
          <li className="leading-6">{renderLineBreakTokens(children)}</li>
        ),
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
        thead: ({ children }) => (
          <thead className="bg-gray-800/80">{renderLineBreakTokens(children)}</thead>
        ),
        tbody: ({ children }) => <tbody>{renderLineBreakTokens(children)}</tbody>,
        tr: ({ children }) => (
          <tr className="border-b border-gray-800">{renderLineBreakTokens(children)}</tr>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 font-semibold text-white">
            {renderLineBreakTokens(children)}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 align-top">{renderLineBreakTokens(children)}</td>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-[#E84A3A] underline decoration-[#E84A3A]/60 underline-offset-2"
          >
            {renderLineBreakTokens(children)}
          </a>
        ),
      }}
    >
      {normalizedContent}
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
                : "Resumeow AI"}
          </span>
          <span className={isUser ? "text-white/50" : "text-gray-600"}>
            {new Date(message.created_at).toLocaleTimeString()}
          </span>
        </div>

        {isTool && Array.isArray(metadata.findings) ? (
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
                        {renderLineBreakTokens(finding.title)}
                      </p>
                      <span className="rounded-full bg-gray-800 px-2 py-1 text-[10px] uppercase tracking-wide text-gray-300">
                        {finding.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-gray-300">
                      {renderLineBreakTokens(finding.recommendation)}
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
                {normalizeAiMessageContent(message.content)}
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
          <span>Resumeow AI</span>
          <span className="text-gray-600">typing</span>
        </div>
        <MarkdownMessage content={streamingText} />
      </div>
    </div>
  );
}

function ResumeAiSettingsModal({
  open,
  onClose,
  isLocked,
  jobDescriptions,
  selectedJobDescriptionId,
  onSelectedJobDescriptionChange,
  onOpenManage,
}: {
  open: boolean;
  onClose: () => void;
  isLocked: boolean;
  jobDescriptions: ResumeJobDescription[];
  selectedJobDescriptionId?: string | null;
  onSelectedJobDescriptionChange: (value: string) => void;
  onOpenManage: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
        <div className="border-b border-gray-800 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">Settings</h3>
              <p className="mt-1 text-xs text-gray-400">
                Manage Resumeow AI customizations to tailor feedback and edits to your needs.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="max-h-[75vh] space-y-4 overflow-y-auto px-5 py-4">
          <Card className="border border-gray-800 bg-gray-900/60 p-4">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-white">Specific Job Description</h4>
              <p className="mt-1 text-xs text-gray-400">
                Add a specific job description to use as context for Resumeow AI. This can help tailor feedback and edits to a particular role you&apos;re targeting.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Selected Job Description
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
                  <p className="text-sm font-medium text-white">
                    Saved job descriptions
                  </p>
                  <p className="text-xs text-gray-400">
                    Add, edit, or remove job contexts used by Resume AI.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isLocked) {
                      return;
                    }
                    onClose();
                    onOpenManage();
                  }}
                  disabled={isLocked}
                >
                  Manage
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ChatComposer({
  chatDisabled,
  isStreaming,
  initialDraftText,
  onSendMessage,
}: {
  chatDisabled: boolean;
  isStreaming: boolean;
  initialDraftText: string;
  onSendMessage: (
    messageText?: string,
    actionHint?: "review" | "edit" | null
  ) => Promise<void>;
}) {
  const [draftInput, setDraftInput] = useState(initialDraftText);

  const canSend = !chatDisabled && !isStreaming && Boolean(draftInput.trim());

  const handleSend = async (actionHint?: "review" | "edit" | null) => {
    const outgoingText = draftInput.trim();
    if (!outgoingText && !actionHint) {
      return;
    }

    setDraftInput("");
    await onSendMessage(outgoingText, actionHint ?? null);
  };

  const handleChatKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        void handleSend(null);
      }
    }
  };

  return (
    <div className="border-t border-gray-800 bg-gray-950/90 px-4 py-4">
      <div className="rounded-3xl border border-gray-800 bg-gray-900/90 p-3 shadow-sm">
        <textarea
          value={draftInput}
          onChange={(event) => setDraftInput(event.target.value)}
          onKeyDown={handleChatKeyDown}
          placeholder={
            chatDisabled
              ? "Save this resume to start chatting with Resumeow AI."
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
            onClick={() => void handleSend(null)}
            disabled={!canSend}
            isLoading={isStreaming}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ResumeAiSidebar({
  isOpen,
  onClose,
  resumeId,
  scrollToLatestSignal = 0,
  isStreaming,
  chatDisabled,
  chatDisabledReason,
  onSendMessage,
  messages,
  streamingText,
  changeSets,
  onUndoChangeSet,
  applyingChangeSetId,
  consumedUndoChangeSetIds,
  profile,
  onOpenProfile,
  onOpenJobDescriptionManager,
  jobDescriptions,
  selectedJobDescriptionId,
  onSelectedJobDescriptionChange,
  rateLimitMessage,
  activeProcessLabel,
  processUpdates = [],
  errorMessage,
  isLocked = false,
}: ResumeAiSidebarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [prefillRequest, setPrefillRequest] = useState({
    id: 0,
    text: "",
  });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const previousMessageCountRef = useRef(messages.length);
  const previousLastMessageIdRef = useRef(messages[messages.length - 1]?.id ?? null);
  const previousChangeSetCountRef = useRef(changeSets.length);
  const previousResumeIdRef = useRef<string | undefined>(resumeId);

  const performScrollToLatest = (behavior: ScrollBehavior = "smooth") => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }

    node.scrollTo({
      top: node.scrollHeight,
      behavior,
    });
    shouldAutoScrollRef.current = true;
  };

  const scrollToLatest = (behavior: ScrollBehavior = "smooth") => {
    performScrollToLatest(behavior);
    setShowJumpToLatest(false);
  };

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }

    const handleScroll = () => {
      const distanceFromBottom =
        node.scrollHeight - node.scrollTop - node.clientHeight;
      const isNearBottom = distanceFromBottom <= 80;
      shouldAutoScrollRef.current = isNearBottom;
      setShowJumpToLatest(!isNearBottom);
    };

    handleScroll();
    node.addEventListener("scroll", handleScroll);

    return () => {
      node.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useLayoutEffect(() => {
    if (!scrollToLatestSignal) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        performScrollToLatest("auto");
      });
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [scrollToLatestSignal]);

  useLayoutEffect(() => {
    const messagesReadyForResume =
      !resumeId ||
      messages.length === 0 ||
      messages.every((message) => message.resume_id === resumeId);
    const changeSetsReadyForResume =
      !resumeId ||
      changeSets.length === 0 ||
      changeSets.every((changeSet) => changeSet.resume_id === resumeId);

    if (!messagesReadyForResume || !changeSetsReadyForResume) {
      return;
    }

    const hasResumeChanged = previousResumeIdRef.current !== resumeId;
    const latestMessageId = messages[messages.length - 1]?.id ?? null;
    const hasNewMessage =
      messages.length !== previousMessageCountRef.current ||
      latestMessageId !== previousLastMessageIdRef.current;
    const hasNewChangeSet = changeSets.length !== previousChangeSetCountRef.current;
    const shouldAutoScroll =
      hasResumeChanged ||
      Boolean(streamingText) ||
      ((hasNewMessage || hasNewChangeSet) && shouldAutoScrollRef.current);

    previousResumeIdRef.current = resumeId;
    previousMessageCountRef.current = messages.length;
    previousLastMessageIdRef.current = latestMessageId;
    previousChangeSetCountRef.current = changeSets.length;

    if (!shouldAutoScroll) {
      return;
    }

    performScrollToLatest(hasResumeChanged ? "auto" : "smooth");
  }, [resumeId, messages, streamingText, changeSets]);

  const containerClassName = isOpen
    ? "fixed inset-y-0 right-0 z-40 w-full max-w-md translate-x-0 border-l border-gray-800 bg-gray-950/95 shadow-2xl shadow-black/30 backdrop-blur transition-transform lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:w-auto lg:max-w-none lg:translate-x-0 lg:overflow-hidden lg:rounded-3xl lg:border"
    : "fixed inset-y-0 right-0 z-40 w-full max-w-md translate-x-full border-l border-gray-800 bg-gray-950/95 shadow-2xl shadow-black/30 backdrop-blur transition-transform lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:w-auto lg:max-w-none lg:translate-x-0 lg:overflow-hidden lg:rounded-3xl lg:border";

  return (
    <aside className={containerClassName}>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="border-b border-gray-800 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Resumeow AI</h2>
              <p className="mt-1 text-xs leading-5 text-gray-400">
                Chat naturally. I&apos;ll interpret your prompt, review the current
                resume, and draft grounded changes when needed.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenProfile}
                  disabled={isLocked}
                >
                  {profile ? "Profile" : "Set Up"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (isLocked) {
                      return;
                    }
                    setIsSettingsOpen(true);
                  }}
                  disabled={isLocked}
                >
                  Settings
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden">
                Close
              </Button>
            </div>
          </div>
        </div>

        <div className="relative min-h-0 flex-1">
          <div ref={scrollRef} className="h-full overflow-y-auto px-4 py-4">
            <div className="space-y-4">
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

            {messages.length === 0 && !streamingText && !activeProcessLabel && !errorMessage ? (
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
                        setPrefillRequest((current) => ({
                          id: current.id + 1,
                          text: prompt,
                        }));
                      }}
                      disabled={isLocked}
                      className="rounded-full border border-gray-700 bg-gray-900 px-3 py-2 text-left text-xs text-gray-200 transition-colors hover:border-[#E84A3A]/40 hover:bg-[#E84A3A]/10"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
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
                        <span>Resumeow AI</span>
                        <span className="text-gray-600">working</span>
                      </div>
                      {processUpdates.length > 0 ? (
                        <div className="space-y-2">
                          {processUpdates.map((update, index) => {
                            const isLatest = index === processUpdates.length - 1;
                            const phaseStyle = PROCESS_PHASE_STYLES[update.phase];

                            return (
                              <div
                                key={`${update.phase}-${update.label}-${index}`}
                                className={`flex items-start gap-2 rounded-xl border px-2.5 py-2 text-sm leading-6 ${
                                  isLatest
                                    ? "border-gray-700 bg-black/20"
                                    : "border-transparent bg-transparent"
                                }`}
                              >
                                <span
                                  className={`mt-0.5 inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] ${phaseStyle.badge}`}
                                >
                                  {phaseStyle.label}
                                </span>
                                <span
                                  className={`mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                                    isLatest
                                      ? `${phaseStyle.activeDot} animate-pulse`
                                      : phaseStyle.idleDot
                                  }`}
                                />
                                <span
                                  className={
                                    isLatest
                                      ? phaseStyle.activeText
                                      : phaseStyle.idleText
                                  }
                                >
                                  {update.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm leading-6 text-gray-100">
                          {activeProcessLabel}
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
                {streamingText ? <StreamingBubble streamingText={streamingText} /> : null}
                {errorMessage ? (
                  <div className="flex justify-start">
                    <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-red-500/30 bg-red-500/10 px-4 py-3 shadow-sm">
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-red-200/80">
                        <span>Resumeow AI</span>
                        <span className="text-red-200/60">error</span>
                      </div>
                      <p className="text-sm leading-6 text-red-100">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                ) : null}
              </>
            )}
            </div>
          </div>
          {showJumpToLatest ? (
            <button
              type="button"
              onClick={() => scrollToLatest("smooth")}
              className="absolute bottom-4 right-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-700 bg-gray-900/95 text-white shadow-lg transition-colors hover:border-[#E84A3A]/60 hover:bg-gray-800"
              aria-label="Jump to latest chat"
              title="Jump to latest chat"
            >
              <span className="text-lg leading-none">↓</span>
            </button>
          ) : null}
        </div>

        <ChatComposer
          key={`${resumeId ?? "unsaved"}:${prefillRequest.id}`}
          chatDisabled={chatDisabled}
          isStreaming={isStreaming}
          initialDraftText={prefillRequest.text}
          onSendMessage={onSendMessage}
        />
      </div>

      <ResumeAiSettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isLocked={isLocked}
        jobDescriptions={jobDescriptions}
        selectedJobDescriptionId={selectedJobDescriptionId}
        onSelectedJobDescriptionChange={onSelectedJobDescriptionChange}
        onOpenManage={onOpenJobDescriptionManager}
      />
    </aside>
  );
}
