"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Gift,
  Layers3,
  Trophy,
  type LucideIcon
} from "lucide-react";
import type { PlanOption, OverlayType, ProofRecord, TaskCard, TaskDeck, TaskFlowState } from "@/lib/types";
import type { ReactNode } from "react";
import { useNextCardStore } from "@/store/useNextCardStore";
import { CompactPlanCatalog } from "@/components/deck/CompactPlanCatalog";

const overlayTitle: Record<OverlayType, { eyebrow: string; title: string }> = {
  guide: { eyebrow: "guide", title: "从目标到证据怎么走" },
  "task-node-detail": { eyebrow: "task node", title: "任务组详情" },
  "plan-catalog-detail": { eyebrow: "目录", title: "计划任务目录" },
  "deck-stack-detail": { eyebrow: "deck backend", title: "任务组后台" },
  "deck-card-detail": { eyebrow: "card review", title: "行动卡详情" },
  "evidence-review": { eyebrow: "review", title: "今日证据复盘" },
  "reward-review": { eyebrow: "review", title: "奖励卡复盘" },
  "freeze-review": { eyebrow: "review", title: "冰冻任务复盘" },
  "burn-review": { eyebrow: "review", title: "燃烧节奏复盘" },
  "burn-failed-review": { eyebrow: "review", title: "燃烧失败与风险" },
  "frozen-todo-review": { eyebrow: "review", title: "冰冻任务复盘" },
  "completed-review": { eyebrow: "review", title: "完成任务复盘" },
  "proof-excel-review": { eyebrow: "table", title: "大任务进度表" },
  "completion-receipt": { eyebrow: "proof saved", title: "完成收据" },
  "summary-review": { eyebrow: "summary", title: "完整复盘文档" },
  "proof-record-review": { eyebrow: "proof record", title: "单条证据详情" }
};

export function AppOverlayHost() {
  const { activeOverlay, closeOverlay, taskFlow, plans, proofs, deck, analysis, lastCompletion, openOverlay, openDeckCardDetail, openDeckCard, resetInputDraft, setMode } = useNextCardStore();

  if (!activeOverlay) {
    return null;
  }

  const meta = overlayTitle[activeOverlay.type];
  const activeDeck = deck.decks.find((item) => item.id === deck.activeDeckId);
  const selectedPlan = plans.options.find((option) => option.id === plans.selectedPlanId) ?? plans.options[0];
  const currentRecords = activeDeck ? proofs.records.filter((record) => record.deckId === activeDeck.id) : [];
  const currentRewardCount = activeDeck ? deck.rewardCards.filter((reward) => reward.deckId === activeDeck.id).length : 0;

  if (activeOverlay.type === "completion-receipt") {
    return (
      <div className="fixed inset-0 z-[80] grid justify-items-center bg-[#fbf1ea]">
        <section className="h-dvh w-full max-w-[430px] overflow-hidden bg-[#fff8f1] shadow-soft">
          <CompletionReceipt
            decks={deck.decks}
            records={proofs.records}
            taskFlow={taskFlow}
            lastCompletion={lastCompletion}
            onGoProof={() => {
              closeOverlay();
              setMode("proof");
            }}
            onNewGoal={() => {
              closeOverlay();
              resetInputDraft();
              setMode("input");
            }}
            onOpenProgress={() => openOverlay("proof-excel-review")}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] grid justify-items-center bg-[#fbf1ea]/96 backdrop-blur">
      <section className="flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#fff8f1] px-4 pb-4 pt-[max(env(safe-area-inset-top),0.85rem)] shadow-soft">
        <header className="flex items-center justify-between gap-3 border-b border-ink/10 pb-3">
          <button
            type="button"
            onClick={closeOverlay}
            className="flex h-10 items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-3 text-sm font-semibold text-ink"
          >
            <ArrowLeft size={16} />
            返回
          </button>
          <div className="min-w-0 text-right">
            <div className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-fern">{meta.eyebrow}</div>
            <h2 className="truncate font-editorial text-[1.45rem] leading-tight text-ink">{meta.title}</h2>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto py-4">
          {activeOverlay.type === "guide" && <GuideContent />}
          {activeOverlay.type === "task-node-detail" && (
            <TaskNodeDetail nodeId={activeOverlay.id} taskFlow={taskFlow} activeDeck={activeDeck} selectedPlan={selectedPlan} />
          )}
          {activeOverlay.type === "plan-catalog-detail" && (
            <PlanCatalogDetail
              taskFlow={taskFlow}
              activeDeck={activeDeck}
              currentCardId={deck.currentCardId}
              selectedPlan={selectedPlan}
              onOpenCard={openDeckCardDetail}
            />
          )}
          {activeOverlay.type === "deck-stack-detail" && <DeckStackReview decks={deck.decks} onOpenCard={openDeckCardDetail} />}
          {activeOverlay.type === "deck-card-detail" && (
            <DeckCardDetail
              decks={deck.decks}
              records={currentRecords}
              taskFlow={taskFlow}
              cardId={activeOverlay.id}
              onFocusCard={openDeckCard}
            />
          )}
          {activeOverlay.type === "evidence-review" && <EvidenceReview records={currentRecords} />}
          {activeOverlay.type === "reward-review" && <RewardReview records={currentRecords} rewardCount={currentRewardCount} />}
          {activeOverlay.type === "freeze-review" && <FrozenTodoReview records={proofs.records} decks={deck.decks} />}
          {activeOverlay.type === "burn-review" && <BurnFailedReview records={proofs.records} decks={deck.decks} />}
          {activeOverlay.type === "burn-failed-review" && <BurnFailedReview records={proofs.records} decks={deck.decks} />}
          {activeOverlay.type === "frozen-todo-review" && <FrozenTodoReview records={proofs.records} decks={deck.decks} />}
          {activeOverlay.type === "completed-review" && <CompletedDeckReview records={proofs.records} decks={deck.decks} />}
          {activeOverlay.type === "proof-excel-review" && (
            <ProofExcelReview decks={deck.decks} activeDeckId={deck.activeDeckId} records={proofs.records} />
          )}
          {activeOverlay.type === "summary-review" && <SummaryReview summary={makeCurrentSummary(currentRecords)} analysisTitle={analysis?.goalUnderstanding} />}
          {activeOverlay.type === "proof-record-review" && (
            <ProofRecordReview record={currentRecords.find((item) => item.id === activeOverlay.id) ?? proofs.records.find((item) => item.id === activeOverlay.id)} />
          )}
        </div>
      </section>
    </div>
  );
}

function makeCurrentSummary(records: ProofRecord[]) {
  const evidence = records.filter((record) => record.status === "completed" || record.status === "rewarded" || record.status === "frozen");

  if (evidence.length === 0) {
    return "今天 0 条证据。完成第一张卡后，这里会生成当前目标的复盘。";
  }

  const completed = evidence.filter((record) => record.status === "completed" || record.status === "rewarded").length;
  const frozen = evidence.filter((record) => record.status === "frozen").length;
  const burning = records.filter((record) => record.timeStatus === "burning-completed" || record.lastDamageEffect === "burn").length;

  return `当前目标已留下 ${evidence.length} 条证据，其中 ${completed} 条完成，${frozen} 条冰冻任务，${burning} 条使用燃烧节奏。`;
}

function CompletionReceipt({
  decks,
  records,
  taskFlow,
  lastCompletion,
  onGoProof,
  onNewGoal,
  onOpenProgress
}: {
  decks: TaskDeck[];
  records: ProofRecord[];
  taskFlow: TaskFlowState | null;
  lastCompletion?: { deckId: string; cardId: string; proofId: string };
  onGoProof: () => void;
  onNewGoal: () => void;
  onOpenProgress: () => void;
}) {
  const found = findCardWithDeck(decks, lastCompletion?.cardId);
  const record = records.find((item) => item.id === lastCompletion?.proofId);

  if (!found || !record || !lastCompletion) {
    return <EmptyOverlay message="还没有可展示的完成收据。" />;
  }

  const { deck, card } = found;
  const node = taskFlow?.nodes.find((item) => item.id === card.flowNodeId);
  const actualMinutes = deck.cards.reduce((sum, item) => sum + Math.ceil(item.elapsedSeconds / 60), 0);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden px-5 pb-5 pt-[max(env(safe-area-inset-top),1rem)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(255,255,255,0.92),transparent_18rem),linear-gradient(180deg,#fff8f1,#edf5ef_58%,#fff)]" aria-hidden />
      <div className="pointer-events-none absolute -right-16 top-12 size-52 rounded-full bg-moss/10 blur-2xl" aria-hidden />
      <div className="relative z-10 flex items-center justify-between">
        <div className="text-sm font-medium tracking-[0.01em] text-ink">Next Card</div>
        <span className="rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">proof saved</span>
      </div>

      <div className="relative z-10 mt-10">
        <div className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-fern">Mission complete</div>
        <h1 className="mt-3 font-editorial text-[2.6rem] leading-[0.98] text-ink">任务完成</h1>
        <p className="mt-4 max-w-[19rem] text-sm leading-6 text-ink/62">
          整组任务已保存为 proof。后台会按任务个体记录，不再展开单张卡。
        </p>
      </div>

      <article className="relative z-10 mt-8 overflow-hidden rounded-[1.65rem] border border-moss/16 bg-white/76 p-5 shadow-[0_24px_70px_rgba(31,81,53,0.16)] backdrop-blur">
        <div className="absolute inset-x-7 -bottom-8 h-24 rounded-full bg-moss/12 blur-2xl" aria-hidden />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-fern">完成卡片</div>
            <h2 className="mt-2 font-editorial text-[2rem] leading-tight text-ink">{deck.coverTitle}</h2>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink/62">{record.lastAction}</p>
          </div>
          <div className="grid size-14 shrink-0 place-items-center rounded-[1.1rem] bg-moss text-white shadow-[0_16px_30px_rgba(15,83,53,0.22)]">
            <CheckCircle2 size={26} />
          </div>
        </div>

        <div className="relative z-10 mt-5 grid grid-cols-3 gap-2">
          <ReceiptMetric label="卡片" value={`${deck.completedCards}/${deck.totalCards}`} />
          <ReceiptMetric label="用时" value={`${Math.max(record.actualMinutes, actualMinutes)}m`} />
          <ReceiptMetric label="进度" value={`${record.progress}%`} />
        </div>

        <div className="relative z-10 mt-5 h-2 overflow-hidden rounded-full bg-ink/8">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,#0d3b2a,#6f9b79)]" style={{ width: `${record.progress}%` }} />
        </div>
        <div className="relative z-10 mt-3 text-xs font-semibold text-ink/44">
          当前阶段：{node?.title ?? "任务收尾"}
        </div>
      </article>

      <div className="relative z-10 mt-auto grid gap-2">
        <button
          type="button"
          onClick={onGoProof}
          className="flex h-12 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white shadow-[0_16px_28px_rgba(6,63,39,0.18)]"
        >
          返回 Proof
        </button>
        <button
          type="button"
          onClick={onOpenProgress}
          className="flex h-12 items-center justify-center rounded-full border border-ink/10 bg-white/72 text-sm font-semibold text-ink"
        >
          查看任务记录
        </button>
        <button
          type="button"
          onClick={onNewGoal}
          className="flex h-12 items-center justify-center rounded-full border border-ink/10 bg-[#edf5ef] text-sm font-semibold text-ink"
        >
          开始新目标
        </button>
      </div>
    </div>
  );
}

function ReceiptMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-ink/8 bg-white/66 px-3 py-3">
      <div className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink/36">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-ink">{value}</div>
    </div>
  );
}

function GuideContent() {
  return (
    <div className="grid gap-3">
      <OverlayCard icon={BookOpen} title="Input：先把模糊目标压成方案">
        输入一句目标后，系统会先用方案一快速拆解；如果节奏不合适，可以在结果页切到方案二或方案三。
      </OverlayCard>
      <OverlayCard icon={Layers3} title="Deck：进入单卡执行">
        点击进入 deck 后，只面对当前最小行动卡。燃烧、冻结、完成都会写入 proof，而不是变成普通 Todo。
      </OverlayCard>
      <OverlayCard icon={Trophy} title="Proof：把行为变成证据">
        proof 首页只保留关键摘要。点击任一模块，可以展开全屏复盘，看完整原因、时间线和下一步。
      </OverlayCard>
    </div>
  );
}

function TaskNodeDetail({
  nodeId,
  taskFlow,
  activeDeck,
  selectedPlan
}: {
  nodeId?: string;
  taskFlow: TaskFlowState | null;
  activeDeck: TaskDeck | undefined;
  selectedPlan: PlanOption | undefined;
}) {
  const node = taskFlow?.nodes.find((item) => item.id === nodeId) ?? taskFlow?.nodes[0];
  const nodeCards = activeDeck?.cards.filter((card) => card.flowNodeId === node?.id) ?? [];
  const completed = nodeCards.filter((card) => card.status === "completed" || card.status === "rewarded").length;
  const frozen = nodeCards.filter((card) => card.status === "frozen" || card.damageEffect === "freeze").length;
  const failed = nodeCards.filter((card) => card.damageEffect === "burn" || card.urgencyStage === "expired").length;
  const totalMinutes = nodeCards.reduce((sum, card) => sum + card.estimatedMinutes, 0);

  if (!node) {
    return <EmptyOverlay message="还没有可复盘的任务节点。" />;
  }

  return (
    <div className="grid gap-3">
      <OverlayCard icon={Layers3} title={node.title}>
        这个节点是进入行动卡之前的压缩路标，帮助你知道现在推进的是哪一组小任务，而不是重新面对整个目标。
      </OverlayCard>
      <DetailGrid
        items={[
          ["时间压力", node.timeLabel],
          ["当前状态", node.status],
          ["推进度", `${node.progress}%`],
          ["方案节奏", selectedPlan?.name ?? "方案一"],
          ["包含卡片", `${nodeCards.length} 张`],
          ["预计时长", `${totalMinutes}m`]
        ]}
      />
      <OverlaySection title="任务组摘要">
        <MiniLine title="卡片数量" detail={`这一组包含 ${nodeCards.length} 张行动卡，后台只保留任务组记录。`} />
        <MiniLine title="完成情况" detail={`${completed}/${nodeCards.length} 已完成 · 冰冻 ${frozen} · 燃烧 ${failed}`} />
        <MiniLine title="展示规则" detail="详情默认不铺开单张卡，避免 proof 后台变成卡片流水账。" />
      </OverlaySection>
      <OverlaySection title="方案一/二/三怎么选">
        <MiniLine title="方案一" detail="适合先做最低可交付版本，快进 deck。" />
        <MiniLine title="方案二" detail="适合平衡速度和完整度，任务更稳。" />
        <MiniLine title="方案三" detail="适合低压力推进，给疲惫状态留余地。" />
      </OverlaySection>
    </div>
  );
}

function PlanCatalogDetail({
  taskFlow,
  activeDeck,
  currentCardId,
  selectedPlan,
  onOpenCard
}: {
  taskFlow: TaskFlowState | null;
  activeDeck: TaskDeck | undefined;
  currentCardId: string | null;
  selectedPlan: PlanOption | undefined;
  onOpenCard: (cardId: string) => void;
}) {
  if (!taskFlow || !activeDeck) {
    return <EmptyOverlay message="还没有可打开的计划目录。" />;
  }

  return (
    <CompactPlanCatalog
      deck={activeDeck}
      taskFlow={taskFlow}
      currentCardId={currentCardId ?? activeDeck.cards.find((card) => card.status === "active")?.id}
      selectedPlanName={selectedPlan?.name}
      onOpenCard={onOpenCard}
    />
  );
}

function EvidenceReview({ records }: { records: ProofRecord[] }) {
  const completed = records.filter((record) => record.status === "completed" || record.status === "rewarded").length;

  return (
    <ReviewFrame
      icon={Trophy}
      title={`${records.length} 条行动证据`}
      intro={`其中 ${completed} 条进入完成或奖励状态。证据不是打卡数量，而是目标被拆小后留下的行为线索。`}
      records={records.slice(0, 6)}
    />
  );
}

function RewardReview({ records, rewardCount }: { records: ProofRecord[]; rewardCount: number }) {
  const rewarded = records.filter((record) => record.status === "rewarded");

  return (
    <ReviewFrame
      icon={Gift}
      title={`${rewarded.length + rewardCount} 张奖励卡`}
      intro="奖励卡代表一个目标已经从想法变成可读证据。这里适合看完成路径和下一组 deck 的入口。"
      records={rewarded.slice(0, 6)}
    />
  );
}

function FrozenTodoReview({
  records,
  decks
}: {
  records: ProofRecord[];
  decks: TaskDeck[];
}) {
  const frozenDecks = decks.filter((deck) => deck.deckStatus === "frozen");
  const rows = frozenDecks.map((deck) => makeProofDeckRow(deck, records, false));

  if (rows.length === 0) {
    return <EmptyOverlay message="还没有冰冻任务。" />;
  }

  return (
    <div className="grid gap-3">
      <ProofDeckSummary title="冰冻任务" rows={rows} />
      <div className="grid gap-3">
        {rows.map((row) => (
          <ProofDeckProgressCard key={row.deck.id} row={row} />
        ))}
      </div>
    </div>
  );
}

function BurnFailedReview({
  records,
  decks
}: {
  records: ProofRecord[];
  decks: TaskDeck[];
}) {
  const failedDecks = decks.filter((deck) => deck.deckStatus === "failed");
  const rows = failedDecks.map((deck) => makeProofDeckRow(deck, records, false));

  if (rows.length === 0) {
    return <EmptyOverlay message="还没有燃烧任务。" />;
  }

  return (
    <div className="grid gap-3">
      <ProofDeckSummary title="燃烧任务" rows={rows} />
      <div className="grid gap-3">
        {rows.map((row) => (
          <ProofDeckProgressCard key={row.deck.id} row={row} />
        ))}
      </div>
    </div>
  );
}

function CompletedDeckReview({
  records,
  decks
}: {
  records: ProofRecord[];
  decks: TaskDeck[];
}) {
  const completedDecks = decks.filter((deck) => deck.deckStatus === "completed");
  const rows = completedDecks.map((deck) => makeProofDeckRow(deck, records, false));

  if (rows.length === 0) {
    return <EmptyOverlay message="还没有完成任务。" />;
  }

  return (
    <div className="grid gap-3">
      <ProofDeckSummary title="完成任务" rows={rows} />
      <div className="grid gap-3">
        {rows.map((row) => (
          <ProofDeckProgressCard key={row.deck.id} row={row} />
        ))}
      </div>
    </div>
  );
}

function DeckStackReview({ decks }: { decks: TaskDeck[]; onOpenCard: (cardId: string) => void }) {
  const taskRows = decks.map((deck) => {
    const completed = deck.cards.filter((card) => card.status === "completed" || card.status === "rewarded").length;
    const frozen = deck.deckStatus === "frozen" ? deck.totalCards - completed : 0;
    const failed = deck.deckStatus === "failed" ? deck.totalCards - completed : 0;
    const progress = deck.totalCards === 0 ? 0 : Math.round((completed / deck.totalCards) * 100);

    return {
      deck,
      completed,
      frozen,
      failed,
      progress,
      minutes: deck.cards.reduce((sum, card) => sum + card.estimatedMinutes, 0)
    };
  });
  const lockedCount = taskRows.filter((row) => row.deck.deckStatus === "frozen" || row.deck.deckStatus === "failed").length;

  return (
    <div className="grid gap-3">
      <OverlayCard icon={Layers3} title={`${taskRows.length} 个任务组`}>
        后台只按任务个体展示，不展开冻结卡或燃烧卡。冻结与失败会锁定整组任务。
      </OverlayCard>
      <DetailGrid
        items={[
          ["任务总数", taskRows.length.toString()],
          ["锁定任务", lockedCount.toString()],
          ["完成任务", taskRows.filter((row) => row.deck.deckStatus === "completed").length.toString()],
          ["进行任务", taskRows.filter((row) => row.deck.deckStatus === "active" || row.deck.deckStatus === "new").length.toString()]
        ]}
      />
      <OverlaySection title="任务组记录">
        {taskRows.length > 0 ? (
          taskRows.map((row) => (
            <TaskGroupLine
              key={row.deck.id}
              title={row.deck.coverTitle}
              status={row.deck.deckStatus}
              detail={`${row.deck.totalCards} 张卡 · ${row.completed}/${row.deck.totalCards} 已完成 · ${row.minutes}m`}
              progress={row.progress}
            />
          ))
        ) : (
          <p className="text-sm leading-6 text-ink/54">还没有任务组。</p>
        )}
      </OverlaySection>
    </div>
  );
}

function ProofExcelReview({
  decks,
  activeDeckId,
  records
}: {
  decks: TaskDeck[];
  activeDeckId: string | null;
  records: ProofRecord[];
}) {
  if (decks.length === 0) {
    return <EmptyOverlay message="还没有可展示的大任务进度。" />;
  }

  const rows = decks
    .filter((deck) => deck.deckStatus !== "completed" && deck.deckStatus !== "frozen" && deck.deckStatus !== "failed")
    .map((deck) => makeProofDeckRow(deck, records, deck.id === activeDeckId));

  if (rows.length === 0) {
    return <EmptyOverlay message="还没有可展示的大任务进度。" />;
  }

  return (
    <div className="grid gap-3">
      <ProofDeckSummary title="大任务进度表" rows={rows} />
      <div className="grid gap-3">
        {rows.map((row) => (
          <ProofDeckProgressCard key={row.deck.id} row={row} />
        ))}
      </div>
    </div>
  );
}

type ProofDeckStatus = "completed" | "frozen" | "failed" | "active" | "queued" | "needs-review";

type ProofDeckRowData = {
  deck: TaskDeck;
  status: ProofDeckStatus;
  completed: number;
  total: number;
  minutes: number;
  evidence: number;
  progress: number;
  active: boolean;
};

function ProofDeckSummary({ title, rows }: { title: string; rows: ProofDeckRowData[] }) {
  const completedDecks = rows.filter((row) => row.status === "completed").length;
  const totalCards = rows.reduce((sum, row) => sum + row.total, 0);
  const completedCards = rows.reduce((sum, row) => sum + row.completed, 0);
  const averageProgress = totalCards === 0 ? 0 : Math.round((completedCards / totalCards) * 100);

  return (
    <article className="rounded-[1.35rem] border border-ink/10 bg-white/70 p-4 shadow-sm">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-fern">{title}</div>
          <h3 className="mt-1 truncate font-editorial text-[1.6rem] leading-tight text-ink">任务组</h3>
          <p className="mt-1 truncate text-[0.72rem] font-semibold text-ink/48">
            {rows.length} 个任务 · {completedDecks} 个完成 · {completedCards}/{totalCards} 张卡
          </p>
        </div>
        <span className="grid size-14 shrink-0 place-items-center rounded-[1rem] bg-ink text-sm font-semibold text-white">{averageProgress}%</span>
      </div>
    </article>
  );
}

function makeProofDeckRow(deck: TaskDeck, records: ProofRecord[], active: boolean): ProofDeckRowData {
  const completed = deck.cards.filter((card) => card.status === "completed" || card.status === "rewarded").length;
  const total = deck.totalCards || deck.cards.length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  const evidence = records.filter((record) => record.deckId === deck.id).length;
  const minutes = deck.cards.reduce((sum, card) => sum + card.estimatedMinutes, 0);

  return {
    deck,
    status: getProofDeckStatus(deck, active),
    completed,
    total,
    minutes,
    evidence,
    progress,
    active
  };
}

function ProofDeckProgressCard({
  row,
  actionLabel,
  onAction
}: {
  row: ProofDeckRowData;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const tone = getProofDeckTone(row.status);

  return (
    <article
      aria-disabled={row.status === "failed" ? true : undefined}
      className={`min-h-[6.4rem] rounded-[1.35rem] border border-ink/10 px-4 py-4 shadow-sm ${tone.rowClass}`}
    >
      <div className="grid grid-cols-[4.3rem_minmax(0,1fr)_3.25rem] items-center gap-3">
        <span className={`grid h-7 place-items-center rounded-full text-[0.68rem] font-black ${tone.badgeClass}`}>
          {tone.label}
        </span>
        <div className="min-w-0">
          <h3 className={`line-clamp-2 font-editorial text-[1.45rem] leading-[1.05] ${tone.titleClass}`}>
            {row.deck.coverTitle}
          </h3>
          <p className={`mt-2 truncate text-[0.7rem] font-semibold ${tone.metaClass}`}>
            {row.completed}/{row.total} 完成 · {row.minutes}m · 证据 {row.evidence}
          </p>
        </div>
        <span className={`grid size-12 place-items-center rounded-[1rem] text-sm font-semibold ${tone.metricClass}`}>
          {row.progress}%
        </span>
      </div>
      {actionLabel && onAction && (
        <div className="mt-3 flex justify-end border-t border-ink/8 pt-3">
          <button
            type="button"
            onClick={onAction}
            className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </article>
  );
}

function getProofDeckStatus(deck: TaskDeck, active: boolean): ProofDeckStatus {
  if (deck.deckStatus === "completed") {
    return "completed";
  }

  if (deck.deckStatus === "frozen") {
    return "frozen";
  }

  if (deck.deckStatus === "failed") {
    return "failed";
  }

  if (deck.deckStatus === "needs-review") {
    return "needs-review";
  }

  if (active || deck.deckStatus === "active") {
    return "active";
  }

  return "queued";
}

function getProofDeckTone(status: ProofDeckStatus) {
  if (status === "completed") {
    return {
      label: "完成",
      rowClass: "bg-[#e7eee8] text-ink/50",
      badgeClass: "bg-white/55 text-ink/48",
      titleClass: "text-ink/42 line-through decoration-ink/34",
      metaClass: "text-ink/34",
      metricClass: "bg-white/50 text-ink/44"
    };
  }

  if (status === "frozen") {
    return {
      label: "冻结",
      rowClass: "bg-[#dff3f7] text-sky-950",
      badgeClass: "bg-white/58 text-sky-950",
      titleClass: "text-sky-950",
      metaClass: "text-sky-950/58",
      metricClass: "bg-white/52 text-sky-950"
    };
  }

  if (status === "failed") {
    return {
      label: "燃烧",
      rowClass: "bg-[#f7d8c8] text-[#9b3a20]/70",
      badgeClass: "bg-white/46 text-[#9b3a20]/62",
      titleClass: "text-[#9b3a20]/56",
      metaClass: "text-[#9b3a20]/48",
      metricClass: "bg-white/48 text-[#9b3a20]/58"
    };
  }

  if (status === "active") {
    return {
      label: "进行",
      rowClass: "bg-[#ffe08a] text-ink",
      badgeClass: "bg-white/60 text-ink",
      titleClass: "text-ink",
      metaClass: "text-ink/62",
      metricClass: "bg-white/56 text-ink"
    };
  }

  if (status === "needs-review") {
    return {
      label: "复盘",
      rowClass: "bg-[#f1efe6] text-ink",
      badgeClass: "bg-white/58 text-ink/70",
      titleClass: "text-ink/78",
      metaClass: "text-ink/48",
      metricClass: "bg-white/54 text-ink/62"
    };
  }

  return {
    label: "待做",
    rowClass: "bg-[#eaf5ed] text-ink",
    badgeClass: "bg-white/62 text-ink",
    titleClass: "text-ink/80",
    metaClass: "text-ink/50",
    metricClass: "bg-white/56 text-ink/70"
  };
}

function SummaryReview({ summary, analysisTitle }: { summary: string; analysisTitle?: string }) {
  return (
    <div className="grid gap-3">
      <OverlayCard icon={BookOpen} title={analysisTitle ?? "今日复盘"}>
        {summary}
      </OverlayCard>
      <OverlaySection title="AI 复盘建议">
        <MiniLine title="下一步" detail="优先选择 10 分钟内能完成的卡，避免重新理解目标。" />
        <MiniLine title="节奏" detail="如果燃烧记录变多，把任务提前进入方案二的平衡节奏。" />
        <MiniLine title="恢复" detail="冻结任务从 reschedule queue 恢复，不需要重写目标。" />
      </OverlaySection>
    </div>
  );
}

function ProofRecordReview({ record }: { record?: ProofRecord }) {
  if (!record) {
    return <EmptyOverlay message="还没有找到这条 proof 记录。" />;
  }

  return (
    <div className="grid gap-3">
      <OverlayCard icon={Clock3} title={record.goalTitle}>
        {record.lastAction}
      </OverlayCard>
      <DetailGrid
        items={[
          ["状态", record.status],
          ["完成度", `${record.progress}%`],
          ["实际用时", `${record.actualMinutes}m`],
          ["时间状态", record.timeStatus]
        ]}
      />
      <OverlaySection title="行动链路">
        {record.timeDamageEvents.map((event) => (
          <MiniLine key={event} title={event} detail={record.nextSuggestion} />
        ))}
      </OverlaySection>
    </div>
  );
}

function DeckCardDetail({
  decks,
  records,
  taskFlow,
  cardId,
  onFocusCard
}: {
  decks: TaskDeck[];
  records: ProofRecord[];
  taskFlow: TaskFlowState | null;
  cardId?: string;
  onFocusCard: (deckId: string, cardId: string) => void;
}) {
  const found = findCardWithDeck(decks, cardId);

  if (!found) {
    return <EmptyOverlay message="没有找到这张行动卡。" />;
  }

  const { deck, card } = found;
  const record = findRecordForCard(records, deck, card);
  const node = taskFlow?.nodes.find((item) => item.id === card.flowNodeId);
  const progress = getCardProgress(card);
  const tone = getCardTone(card);

  return (
    <div className="grid gap-3">
      <article className={`rounded-[1.35rem] p-4 shadow-sm ${tone.rowClass}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={`text-[0.66rem] font-semibold uppercase tracking-[0.18em] ${tone.mutedClass}`}>{deck.coverTitle}</div>
            <h3 className="mt-2 font-editorial text-[1.65rem] leading-tight">{card.title}</h3>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${tone.chipClass}`}>{tone.label}</span>
        </div>
        <p className={`mt-3 text-sm leading-6 ${tone.mutedClass}`}>{card.action}</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/26">
          <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
        </div>
      </article>
      <DetailGrid
        items={[
          ["完成度", `${progress}%`],
          ["状态", card.status],
          ["节点", node?.title ?? card.flowNodeId],
          ["时间", `${card.estimatedMinutes}m`]
        ]}
      />
      <OverlaySection title="时间事件">
        {(record?.timeDamageEvents ?? [card.cardBackNote]).map((event) => (
          <MiniLine key={event} title={event} detail={record?.nextSuggestion ?? card.encouragement} />
        ))}
      </OverlaySection>
      <OverlaySection title="下一步建议">
        <MiniLine title="回到 deck" detail={record?.nextSuggestion ?? "把这张卡设为当前卡，继续专注执行。"} />
        <button
          type="button"
          onClick={() => onFocusCard(deck.id, card.id)}
          className="mt-1 flex h-11 items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white"
        >
          在 deck 中打开
          <ArrowRight size={15} />
        </button>
      </OverlaySection>
    </div>
  );
}

function getCardProgress(card: TaskCard) {
  if (card.status === "completed" || card.status === "rewarded") {
    return 100;
  }

  if (card.status === "frozen") {
    return Math.max(20, card.damageProgress);
  }

  if (card.status === "active") {
    return Math.max(35, card.damageProgress);
  }

  return Math.max(0, card.damageProgress);
}

function getCardTone(card: TaskCard) {
  if (card.status === "completed" || card.status === "rewarded") {
    return {
      label: "完成",
      rowClass: "bg-emerald-700 text-white",
      chipClass: "bg-white/20 text-white",
      cellClass: "bg-white/10",
      mutedClass: "text-white/70"
    };
  }

  if (card.status === "frozen" || card.damageEffect === "freeze") {
    return {
      label: "冻结",
      rowClass: "bg-[#cdebf0] text-sky-950",
      chipClass: "bg-white/50 text-sky-950",
      cellClass: "bg-white/30",
      mutedClass: "text-sky-950/60"
    };
  }

  if (card.urgencyStage === "burning" || card.urgencyStage === "expired" || card.damageEffect === "burn") {
    return {
      label: "燃烧",
      rowClass: "bg-[#e7784b] text-white",
      chipClass: "bg-white/20 text-white",
      cellClass: "bg-white/10",
      mutedClass: "text-white/70"
    };
  }

  if (card.status === "active") {
    return {
      label: "进行中",
      rowClass: "bg-[#ffe08a] text-ink",
      chipClass: "bg-white/50 text-ink",
      cellClass: "bg-white/30",
      mutedClass: "text-ink/60"
    };
  }

  return {
    label: "待办",
    rowClass: "bg-[#edf5ef] text-ink",
    chipClass: "bg-white/60 text-ink",
    cellClass: "bg-white/40",
    mutedClass: "text-ink/50"
  };
}

function findCardWithDeck(decks: TaskDeck[], cardId?: string) {
  if (!cardId) {
    return null;
  }

  for (const deck of decks) {
    const card = deck.cards.find((item) => item.id === cardId);

    if (card) {
      return { deck, card };
    }
  }

  return null;
}

function findRecordForCard(records: ProofRecord[], deck: TaskDeck, card: TaskCard) {
  return records.find((record) =>
    record.cardId === card.id ||
    (
      record.deckId === deck.id &&
      (record.lastAction.includes(card.title) || record.timeDamageEvents.some((event) => event.includes(card.title)))
    )
  );
}

function TaskGroupLine({
  title,
  status,
  detail,
  progress
}: {
  title: string;
  status: TaskDeck["deckStatus"];
  detail: string;
  progress: number;
}) {
  const tone = getTaskGroupTone(status);

  return (
    <div className="rounded-[1.05rem] border border-ink/8 bg-white/70 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink">{title}</div>
          <div className="mt-1 truncate text-xs font-medium text-ink/54">{detail}</div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${tone.chipClass}`}>{tone.label}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/8">
        <div className={`h-full rounded-full ${tone.barClass}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function getTaskGroupTone(status: TaskDeck["deckStatus"]) {
  if (status === "completed") {
    return { label: "完成", chipClass: "bg-moss/10 text-moss", barClass: "bg-moss" };
  }

  if (status === "frozen") {
    return { label: "冰冻", chipClass: "bg-sky-100 text-sky-800", barClass: "bg-sky-300" };
  }

  if (status === "failed") {
    return { label: "燃烧", chipClass: "bg-[#fbe3d4] text-[#9b351a]", barClass: "bg-[#e7784b]" };
  }

  if (status === "active") {
    return { label: "进行", chipClass: "bg-amber-100 text-amber-800", barClass: "bg-amber-300" };
  }

  return { label: "待办", chipClass: "bg-ink/6 text-ink/64", barClass: "bg-ink/24" };
}

function ReviewFrame({
  icon: Icon,
  title,
  intro,
  records
}: {
  icon: LucideIcon;
  title: string;
  intro: string;
  records: ProofRecord[];
}) {
  return (
    <div className="grid gap-3">
      <OverlayCard icon={Icon} title={title}>
        {intro}
      </OverlayCard>
      <OverlaySection title="最近记录">
        {records.length > 0 ? (
          records.map((record) => (
            <MiniLine key={record.id} title={record.lastAction} detail={`${record.status} · ${record.actualMinutes}m`} />
          ))
        ) : (
          <p className="text-sm leading-6 text-ink/64">还没有对应记录。继续执行 deck 后，这里会自动形成复盘内容。</p>
        )}
      </OverlaySection>
    </div>
  );
}

function OverlayCard({
  icon: Icon,
  title,
  children
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-[1.35rem] border border-ink/10 bg-white/70 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-white">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <h3 className="font-editorial text-[1.45rem] leading-tight text-ink">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-ink/68">{children}</p>
        </div>
      </div>
    </article>
  );
}

function OverlaySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.25rem] border border-ink/10 bg-white/56 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-fern">{title}</h3>
      <div className="mt-3 grid gap-2">{children}</div>
    </section>
  );
}

function DetailGrid({ items }: { items: [string, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-[1rem] bg-white/66 px-3 py-3">
          <div className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink/38">{label}</div>
          <div className="mt-1 truncate text-sm font-semibold text-ink">{value}</div>
        </div>
      ))}
    </div>
  );
}

function MiniLine({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[1rem] bg-ink/[0.045] px-3 py-2">
      <div className="text-sm font-semibold leading-5 text-ink">{title}</div>
      <div className="mt-1 text-xs leading-5 text-ink/58">{detail}</div>
    </div>
  );
}

function EmptyOverlay({ message }: { message: string }) {
  return <div className="rounded-[1rem] bg-white/70 px-4 py-10 text-center text-sm text-ink/58">{message}</div>;
}
