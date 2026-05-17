"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  ImagePlus,
  Loader2,
  Menu,
  Paperclip,
  RefreshCcw,
  RotateCcw,
  Send,
  Sparkles,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import type { ChatMessage, ClarifyingQuestion, InputsState, PlanOption, TaskDeck, TaskFlowState } from "@/lib/types";
import { PlanOptionCard } from "@/components/input/PlanOptionCard";
import { useNextCardStore } from "@/store/useNextCardStore";
import { CompactPlanCatalog } from "@/components/deck/CompactPlanCatalog";

const examples = ["去高数课", "今晚 20:00 前交一页课程分析", "把明天早八课表变成提醒卡"];
const planLabels: Record<PlanOption["style"], string> = {
  urgent: "快速",
  balanced: "稳妥",
  gentle: "低压"
};

export function InputComposer() {
  const {
    inputs,
    analysis,
    analysisStatus,
    messages,
    isAiResponding,
    aiFallback,
    clarifyingQuestion,
    clarificationAnswer,
    taskFlow,
    deck,
    plans,
    setInputText,
    addDocumentUpload,
    addImageUpload,
    removeImageUpload,
    removeInputAttachment,
    submitInputForUnderstanding,
    sendChatMessage,
    answerClarifyingQuestion,
    generatePlansFromClarification,
    resetInputDraft,
    regeneratePlans,
    openDeck,
    selectPlan,
    openOverlay
  } = useNextCardStore();

  const canSubmit = useMemo(
    () => Boolean(inputs.text.trim() || inputs.attachments.length > 0 || inputs.imageSchedule),
    [inputs]
  );
  const activeDeck = deck.decks.find((item) => item.id === deck.activeDeckId);
  const recommendedCard = activeDeck?.cards.find((card) => card.id === deck.currentCardId) ??
    activeDeck?.cards.find((card) => card.status === "active") ??
    activeDeck?.cards.find((card) => card.status === "queued") ??
    activeDeck?.cards[0];
  const hasSelectedPlan = Boolean(taskFlow && analysis && activeDeck && plans.selectedPlanId);
  const selectedPlan = plans.options.find((option) => option.id === plans.selectedPlanId) ?? plans.options[0];

  const showInputBar = !hasSelectedPlan && analysisStatus === "idle";
  const showWelcome = analysisStatus === "idle" && !hasSelectedPlan;
  const showThinking = analysisStatus === "thinking";
  const showAsking = analysisStatus === "asking";
  const showGenerating = analysisStatus === "generating";
  const showPlans = analysisStatus === "ready" && !hasSelectedPlan && plans.options.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    submitInputForUnderstanding();
  };

  return (
    <section className="phone-shell grain flex h-full min-h-0 w-full flex-col overflow-hidden px-4 pb-4 pt-4">
      <div className="relative z-10 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => openOverlay("guide")}
          className="grid size-8 place-items-center rounded-full bg-[#ece5d7] text-ink transition hover:scale-95"
          aria-label="menu"
        >
          <Menu size={15} />
        </button>
        <div className="text-sm font-medium tracking-[0.01em] text-ink">Next Card</div>
        <span className="size-8" aria-hidden />
      </div>

      <div className="relative z-10 mt-5 min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {showWelcome && <WelcomePanel key="welcome" onExample={setInputText} />}

          {showThinking && (
            <ChatPanel
              key="thinking"
              title="AI 正在理解"
              tagline="thinking"
              messages={messages}
              isAiResponding={isAiResponding}
              aiFallback={aiFallback}
              onSend={sendChatMessage}
              onReset={resetInputDraft}
            />
          )}

          {showAsking && (
            <ClarifyingPanel
              key="clarifying"
              messages={messages}
              isAiResponding={isAiResponding}
              aiFallback={aiFallback}
              question={clarifyingQuestion}
              answerId={clarificationAnswer?.optionId}
              onAnswer={answerClarifyingQuestion}
              onDefault={generatePlansFromClarification}
              onSend={sendChatMessage}
              onReset={resetInputDraft}
            />
          )}

          {showGenerating && (
            <GeneratingPanel
              key="generating"
              answerLabel={clarificationAnswer?.label}
              analysisTitle={analysis?.goalUnderstanding}
              messages={messages}
              isAiResponding={isAiResponding}
              onReset={resetInputDraft}
            />
          )}

          {showPlans && (
            <PlanChoicePanel
              key="plans"
              analysisTitle={analysis?.goalUnderstanding}
              answerLabel={clarificationAnswer?.label}
              messages={messages}
              isAiResponding={isAiResponding}
              regenerateCount={plans.regenerateCount}
              onRegenerate={regeneratePlans}
              onSend={sendChatMessage}
              onReset={resetInputDraft}
            />
          )}

          {hasSelectedPlan && (
            <ResultPanel
              key="result"
              activeDeck={activeDeck}
              taskFlow={taskFlow}
              currentCardId={recommendedCard?.id ?? deck.currentCardId}
              selectedPlan={selectedPlan}
              options={plans.options}
              selectedPlanId={plans.selectedPlanId}
              onSelectPlan={selectPlan}
              onOpenDeck={openDeck}
              onOpenCard={(cardId) => openOverlay("deck-card-detail", cardId)}
              onReset={resetInputDraft}
            />
          )}
        </AnimatePresence>
      </div>

      {showInputBar && (
        <WelcomeInputBar
          inputs={inputs}
          canSubmit={canSubmit}
          onChangeText={setInputText}
          onSubmit={handleSubmit}
          onAddImage={addImageUpload}
          onAddDocument={addDocumentUpload}
          onRemoveImage={removeImageUpload}
          onRemoveAttachment={removeInputAttachment}
        />
      )}
    </section>
  );
}

function WelcomeInputBar({
  inputs,
  canSubmit,
  onChangeText,
  onSubmit,
  onAddImage,
  onAddDocument,
  onRemoveImage,
  onRemoveAttachment
}: {
  inputs: InputsState;
  canSubmit: boolean;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onAddImage: (file: File) => void;
  onAddDocument: (file: File) => void;
  onRemoveImage: (id?: string) => void;
  onRemoveAttachment: (id: string) => void;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) onAddImage(file);
    event.currentTarget.value = "";
  };
  const handleDocumentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) onAddDocument(file);
    event.currentTarget.value = "";
  };

  return (
    <div className="relative z-10 space-y-2">
      {(inputs.attachments.length > 0 || inputs.imageSchedule) && (
        <div className="flex flex-wrap gap-1.5">
          {inputs.imageSchedule && (
            <AttachmentChip
              label={inputs.imageSchedule.name || "已添加图片"}
              tone="image"
              onRemove={() => onRemoveImage(inputs.imageSchedule?.id)}
            />
          )}
          {inputs.attachments.map((attachment) => (
            <AttachmentChip
              key={attachment.id}
              label={attachment.name}
              tone="document"
              onRemove={() => onRemoveAttachment(attachment.id)}
            />
          ))}
        </div>
      )}

      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown"
        className="hidden"
        onChange={handleDocumentChange}
      />

      <div className="flex items-end gap-1.5 rounded-[1.7rem] border border-ink/10 bg-white/82 p-2 shadow-sm">
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="mb-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-ink/[0.055] text-ink/64 transition hover:bg-ink/[0.09]"
          aria-label="添加图片"
        >
          <ImagePlus size={17} />
        </button>
        <button
          type="button"
          onClick={() => documentInputRef.current?.click()}
          className="mb-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-ink/[0.055] text-ink/64 transition hover:bg-ink/[0.09]"
          aria-label="添加文档"
        >
          <FileText size={17} />
        </button>
        <textarea
          value={inputs.text}
          onChange={(event) => onChangeText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              onSubmit();
            }
          }}
          placeholder="What's your next card?"
          className="min-h-12 flex-1 bg-transparent px-1.5 py-2 text-[0.95rem] leading-5 text-ink outline-none placeholder:text-ink/34"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="mb-0.5 flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-ink px-3 text-xs font-semibold text-white transition hover:scale-[0.98] disabled:cursor-not-allowed disabled:bg-ink/26"
        >
          <span>生成</span>
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

function AttachmentChip({
  label,
  tone,
  onRemove
}: {
  label: string;
  tone: "image" | "document";
  onRemove: () => void;
}) {
  const Icon = tone === "image" ? ImagePlus : FileText;

  return (
    <span className="flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-ink/10 bg-white/68 py-1 pl-2.5 pr-1 text-xs font-semibold text-ink/66 shadow-sm">
      <Icon size={13} className="shrink-0" />
      <span className="max-w-[12rem] truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="grid size-5 shrink-0 place-items-center rounded-full bg-ink/[0.06] text-ink/54"
        aria-label={`移除 ${label}`}
      >
        <X size={12} />
      </button>
    </span>
  );
}

function WelcomePanel({ onExample }: { onExample: (text: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex h-full flex-col"
    >
      <div className="font-editorial text-[1.92rem] leading-[1.08] text-ink">
        现在，
        <br />
        只做一张卡。
      </div>
      <p className="mt-4 max-w-[18rem] text-[0.9rem] leading-6 text-ink/64">
        输入目标，先让 AI 思考、再反问、然后给你三套执行方案。
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onExample(example)}
            className="rounded-full border border-ink/10 bg-white/55 px-3 py-2 text-xs text-ink/76 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
          >
            {example}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function ChatPanel({
  title,
  tagline,
  messages,
  isAiResponding,
  aiFallback,
  onSend,
  onReset
}: {
  title: string;
  tagline: string;
  messages: ChatMessage[];
  isAiResponding: boolean;
  aiFallback: boolean;
  onSend: (text: string) => Promise<void>;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-fern">
            <Sparkles size={14} />
            {tagline}
          </div>
          <h1 className="mt-1 font-editorial text-[1.72rem] leading-tight text-ink">{title}</h1>
          {aiFallback && (
            <p className="mt-2 text-[0.7rem] leading-4 text-ink/48">连不上 AI 服务,先按本地理解继续。</p>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="grid size-9 shrink-0 place-items-center rounded-full border border-ink/10 bg-white/62 text-ink"
          aria-label="重新输入"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      <ChatStream messages={messages} isAiResponding={isAiResponding} />

      <ChatInputBar onSend={onSend} disabled={isAiResponding} placeholder="再补一句,或直接说想要什么" />
    </motion.div>
  );
}

function ChatStream({
  messages,
  isAiResponding,
  cap
}: {
  messages: ChatMessage[];
  isAiResponding: boolean;
  cap?: number;
}) {
  const visible = cap && cap > 0 ? messages.slice(-cap) : messages;
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages.length, isAiResponding]);

  return (
    <div ref={containerRef} className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
      <div className="space-y-3">
        {visible.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isAiResponding && <TypingBubble />}
      </div>
    </div>
  );
}

function ChatInputBar({
  onSend,
  disabled,
  placeholder
}: {
  onSend: (text: string) => Promise<void>;
  disabled: boolean;
  placeholder: string;
}) {
  const { inputs, addImageUpload, addDocumentUpload, removeImageUpload, removeInputAttachment } = useNextCardStore();
  const [draft, setDraft] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || disabled) {
      return;
    }
    setDraft("");
    await onSend(trimmed);
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) addImageUpload(file);
    event.currentTarget.value = "";
  };
  const handleDocumentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) addDocumentUpload(file);
    event.currentTarget.value = "";
  };

  return (
    <div className="mt-3 space-y-2">
      {(inputs.attachments.length > 0 || inputs.imageSchedule) && (
        <div className="flex flex-wrap gap-1.5">
          {inputs.imageSchedule && (
            <AttachmentChip
              label={inputs.imageSchedule.name || "已添加图片"}
              tone="image"
              onRemove={() => removeImageUpload(inputs.imageSchedule?.id)}
            />
          )}
          {inputs.attachments.map((attachment) => (
            <AttachmentChip
              key={attachment.id}
              label={attachment.name}
              tone="document"
              onRemove={() => removeInputAttachment(attachment.id)}
            />
          ))}
        </div>
      )}

      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown"
        className="hidden"
        onChange={handleDocumentChange}
      />

      <div className="flex items-end gap-1.5 rounded-[1.4rem] border border-ink/10 bg-white/82 p-2 shadow-sm">
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="mb-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-ink/[0.055] text-ink/64 transition hover:bg-ink/[0.09]"
          aria-label="添加图片"
        >
          <ImagePlus size={15} />
        </button>
        <button
          type="button"
          onClick={() => documentInputRef.current?.click()}
          className="mb-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-ink/[0.055] text-ink/64 transition hover:bg-ink/[0.09]"
          aria-label="添加文档"
        >
          <Paperclip size={15} />
        </button>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void handleSend();
            }
          }}
          placeholder={placeholder}
          rows={1}
          className="min-h-10 flex-1 resize-none bg-transparent px-1.5 py-2 text-[0.9rem] leading-5 text-ink outline-none placeholder:text-ink/34"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={disabled || !draft.trim()}
          className="mb-0.5 flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-ink px-3 text-xs font-semibold text-white transition hover:scale-[0.98] disabled:cursor-not-allowed disabled:bg-ink/26"
        >
          <span>发送</span>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

function ClarifyingPanel({
  messages,
  isAiResponding,
  aiFallback,
  question,
  answerId,
  onAnswer,
  onDefault,
  onSend,
  onReset
}: {
  messages: ChatMessage[];
  isAiResponding: boolean;
  aiFallback: boolean;
  question: ClarifyingQuestion | null;
  answerId?: string;
  onAnswer: (optionId: string) => void;
  onDefault: () => void;
  onSend: (text: string) => Promise<void>;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-fern">
            <Sparkles size={14} />
            one question
          </div>
          <h1 className="mt-1 font-editorial text-[1.72rem] leading-tight text-ink">先理解，再出卡</h1>
          {aiFallback && (
            <p className="mt-2 text-[0.7rem] leading-4 text-ink/48">连不上 AI 服务,先按本地理解继续。</p>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="grid size-9 shrink-0 place-items-center rounded-full border border-ink/10 bg-white/62 text-ink"
          aria-label="重新输入"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-3">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isAiResponding && <TypingBubble />}
        </div>

        {question && !isAiResponding && (
          <div className="mt-5 rounded-[1.35rem] border border-ink/10 bg-white/68 p-4 shadow-sm">
            <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-fern">one question</div>
            <h2 className="mt-2 text-base font-semibold leading-6 text-ink">{question.question}</h2>
            <div className="mt-4 grid gap-2">
              {question.options.map((option) => {
                const selected = answerId === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onAnswer(option.id)}
                    className={`rounded-[1.05rem] border px-3 py-3 text-left transition ${
                      selected
                        ? "border-ink bg-ink text-white"
                        : "border-ink/10 bg-[#fff8f1]/82 text-ink hover:border-ink/24"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className={`mt-1 block text-xs leading-5 ${selected ? "text-white/70" : "text-ink/55"}`}>
                      {option.effect}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onDefault}
              className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-ink/8 text-xs font-semibold text-ink/72 hover:bg-ink/12"
            >
              按默认理解直接生成方案
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      <ChatInputBar
        onSend={onSend}
        disabled={isAiResponding}
        placeholder="不想选就直接说,比如「时间紧,直接给方案」"
      />
    </motion.div>
  );
}

function GeneratingPanel({
  answerLabel,
  analysisTitle,
  messages,
  isAiResponding,
  onReset
}: {
  answerLabel?: string;
  analysisTitle?: string;
  messages: ChatMessage[];
  isAiResponding: boolean;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-fern">
            <Sparkles size={14} />
            generating
          </div>
          <h1 className="mt-1 font-editorial text-[1.72rem] leading-tight text-ink">正在生成三套方案</h1>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-ink/58">
            {answerLabel ? `已按「${answerLabel}」理解。` : "已按当前理解生成方案。"}
            {analysisTitle ? ` ${analysisTitle}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="grid size-9 shrink-0 place-items-center rounded-full border border-ink/10 bg-white/62 text-ink"
          aria-label="重新输入"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      <ChatStream messages={messages} isAiResponding={isAiResponding} cap={4} />

      <div className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-ink/10 bg-white/62 text-sm font-medium text-ink/64">
        <Loader2 size={16} className="animate-spin" />
        正在生成方案…
      </div>
    </motion.div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[86%] whitespace-pre-wrap rounded-[1.2rem] px-4 py-3 text-sm leading-6 shadow-sm ${
          isUser
            ? "rounded-br-md bg-ink text-white"
            : message.tone === "uncertainty"
              ? "rounded-bl-md border border-ice bg-[#f1fbfb] text-ink"
              : message.tone === "confirmation"
                ? "rounded-bl-md border border-gold/28 bg-[#fff6d9] text-ink"
                : "rounded-bl-md border border-ink/8 bg-white/70 text-ink/80"
        }`}
      >
        {message.text}
      </div>
    </motion.div>
  );
}

function TypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="flex max-w-[60%] items-center gap-1 rounded-[1.2rem] rounded-bl-md border border-ink/8 bg-white/70 px-4 py-3 shadow-sm">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="block size-1.5 rounded-full bg-ink/50"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.18 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function PlanChoicePanel({
  analysisTitle,
  answerLabel,
  messages,
  isAiResponding,
  regenerateCount,
  onRegenerate,
  onSend,
  onReset
}: {
  analysisTitle?: string;
  answerLabel?: string;
  messages: ChatMessage[];
  isAiResponding: boolean;
  regenerateCount: number;
  onRegenerate: () => void;
  onSend: (text: string) => Promise<void>;
  onReset: () => void;
}) {
  const { plans, selectPlan } = useNextCardStore();
  const lastAi = [...messages].reverse().find((message) => message.role === "ai");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-fern">choose plan</div>
          <h1 className="mt-1 font-editorial text-[1.58rem] leading-tight text-ink">选择这次的执行节奏</h1>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-ink/58">
            {answerLabel ? `已按「${answerLabel}」理解。` : "已按当前理解生成方案。"}
            {analysisTitle ? ` ${analysisTitle}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="grid size-9 shrink-0 place-items-center rounded-full border border-ink/10 bg-white/62 text-ink"
          aria-label="重新输入"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {lastAi && (
        <div className="mt-3">
          <MessageBubble message={lastAi} />
        </div>
      )}

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid gap-3">
          {plans.options.map((option, index) => (
            <PlanOptionCard
              key={`${option.id}-${regenerateCount}`}
              option={option}
              selected={plans.selectedPlanId === option.id}
              buttonLabel={`执行方案${["一", "二", "三"][index]}`}
              onSelect={selectPlan}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onRegenerate}
        disabled={isAiResponding}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-ink/12 bg-white/70 text-sm font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCcw size={15} />
        都不太对，让 AI 再换一组
      </button>

      <ChatInputBar
        onSend={onSend}
        disabled={isAiResponding}
        placeholder="想调整方向就直接说,比如「再低压一点」"
      />
    </motion.div>
  );
}

function ResultPanel({
  activeDeck,
  taskFlow,
  currentCardId,
  selectedPlan,
  options,
  selectedPlanId,
  onSelectPlan,
  onOpenDeck,
  onOpenCard,
  onReset
}: {
  activeDeck?: TaskDeck;
  taskFlow: TaskFlowState | null;
  currentCardId?: string | null;
  selectedPlan?: PlanOption;
  options: PlanOption[];
  selectedPlanId: string | null;
  onSelectPlan: (id: PlanOption["id"]) => void;
  onOpenDeck: (deckId: string) => void;
  onOpenCard: (cardId: string) => void;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex h-full min-h-0 flex-col px-2"
    >
      <div className="shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 pt-0.5">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-fern">行动计划</div>
            <h1 className="mt-1.5 line-clamp-2 font-editorial text-[1.98rem] leading-[0.98] text-ink">
              {taskFlow?.title ?? activeDeck?.coverTitle}
            </h1>
            <p className="mt-2 line-clamp-1 text-[0.84rem] leading-5 text-ink/58">
              先看目录，再开始执行。
            </p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="mt-1 grid size-9 shrink-0 place-items-center rounded-full border border-ink/10 bg-white/54 text-ink/64 transition hover:bg-white"
            aria-label="重新输入"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {options.length > 0 && (
        <PlanChoiceBar
          options={options}
          selectedPlanId={selectedPlanId}
          onSelectPlan={onSelectPlan}
        />
      )}

      <div className="mt-3 shrink-0">
        {activeDeck && (
          <CompactPlanCatalog
            deck={activeDeck}
            taskFlow={taskFlow}
            variant="cards"
            currentCardId={currentCardId}
            selectedPlanName={selectedPlan?.name}
            planSummary={selectedPlan?.summary}
            onOpenCard={onOpenCard}
          />
        )}
      </div>

      {activeDeck && (
        <div className="mt-auto shrink-0 pt-5">
          <button
            type="button"
            onClick={() => onOpenDeck(activeDeck.id)}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white shadow-[0_14px_28px_rgba(6,63,39,0.18)]"
          >
            开始行动
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

function PlanChoiceBar({
  options,
  selectedPlanId,
  onSelectPlan
}: {
  options: PlanOption[];
  selectedPlanId: string | null;
  onSelectPlan: (id: PlanOption["id"]) => void;
}) {
  return (
    <section className="mt-3">
      <div className="grid grid-cols-[4.4rem_minmax(0,1fr)] items-center gap-2">
        <div className="text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-ink/42">
          选择
          <br />
          节奏
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-full border border-ink/10 bg-white/54 p-1 shadow-sm">
          {options.map((option) => {
            const selected = option.id === selectedPlanId;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectPlan(option.id)}
                className={`h-11 min-w-0 rounded-full px-3 py-1.5 text-left transition ${
                  selected
                    ? "bg-ink text-white shadow-[0_10px_22px_rgba(6,63,39,0.18)]"
                    : "text-ink hover:bg-white/58"
                }`}
                aria-pressed={selected}
              >
                <span className="block truncate text-sm font-semibold leading-4">{planLabels[option.style] ?? option.name}</span>
                <span className={`mt-1 block truncate text-[0.66rem] font-semibold ${selected ? "text-white/66" : "text-ink/48"}`}>
                  {option.estimatedTime}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
