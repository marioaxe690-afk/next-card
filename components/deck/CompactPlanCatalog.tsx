"use client";

import { X } from "lucide-react";
import type { PlanOption, TaskCard, TaskDeck, TaskFlowState } from "@/lib/types";

type CompactPlanCatalogProps = {
  deck: TaskDeck;
  taskFlow?: TaskFlowState | null;
  currentCardId?: string | null;
  variant?: "groups" | "cards" | "document";
  planOptions?: PlanOption[];
  selectedPlanId?: string | null;
  selectedPlanName?: string;
  planSummary?: string;
  onSelectPlan?: (planId: PlanOption["id"]) => void;
  onClose?: () => void;
  onOpenCard?: (cardId: string) => void;
};

type CatalogGroup = {
  id: string;
  title: string;
  cards: TaskCard[];
  status: "completed" | "active" | "frozen" | "failed" | "queued";
};

export function CompactPlanCatalog({
  deck,
  taskFlow,
  currentCardId,
  variant = "groups",
  onClose,
  onOpenCard
}: CompactPlanCatalogProps) {
  const total = deck.cards.length || deck.totalCards;
  const groups = buildCatalogGroups(deck, taskFlow, currentCardId);
  const totalMinutes = deck.cards.reduce((sum, card) => sum + card.estimatedMinutes, 0);
  const completedCards = deck.cards.filter((card) => isCompletedCard(card)).length;
  const status = getDeckStatusCopy(deck.deckStatus);
  const visibleGroups = groups.slice(0, 4);
  const showCards = variant === "cards";
  const showDocument = variant === "document";
  const documentRows = showDocument ? deck.cards : [];

  return (
    <section className={`relative z-10 text-ink ${showDocument ? "flex h-full min-h-0 flex-col" : ""}`}>
      <header className={showDocument ? "shrink-0" : undefined}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.13em] text-ink/42">任务计划目录</div>
            <h2 className="mt-1.5 line-clamp-2 font-editorial text-[1.72rem] leading-[1.03] text-ink">{deck.coverTitle}</h2>
            <p className="mt-1 text-[0.8rem] font-semibold leading-5 text-ink/54">
              {showCards || showDocument ? `${total} 张任务卡 · 已完成 ${completedCards} 张 · ${totalMinutes} min` : `${groups.length} 个阶段 · ${total} 张卡 · ${totalMinutes} min`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ring-1 ${status.className}`}>
              {status.label}
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="grid size-8 place-items-center rounded-full border border-ink/8 bg-white/72 text-ink/58 transition hover:bg-white"
                aria-label="关闭计划目录"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </header>

      {showDocument ? (
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain border-y border-ink/[0.075] [scrollbar-color:rgba(6,63,39,0.28)_transparent] [scrollbar-width:thin]">
          <div className="divide-y divide-ink/[0.075]">
            {documentRows.map((card, index) => (
              <CatalogDocumentRow
                key={card.id}
                card={card}
                index={index}
                active={card.id === currentCardId || card.status === "active"}
                onOpenCard={onOpenCard}
              />
            ))}
          </div>
        </div>
      ) : showCards ? (
        <div className="mt-3 max-h-[14rem] overflow-y-auto overscroll-contain rounded-[1.45rem] border border-ink/[0.08] bg-white/28 p-2 pr-1 [scrollbar-color:rgba(6,63,39,0.32)_transparent] [scrollbar-width:thin]">
          <div className="divide-y divide-ink/[0.07]">
            {deck.cards.map((card, index) => (
              <CatalogCardRow
                key={card.id}
                card={card}
                index={index}
                active={card.id === currentCardId || card.status === "active"}
                onOpenCard={onOpenCard}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mt-3 divide-y divide-ink/[0.075] border-y border-ink/[0.075]">
            {visibleGroups.map((group, index) => (
              <CatalogGroupRow
                key={group.id}
                group={group}
                index={index}
                onOpenCard={onOpenCard}
              />
            ))}
          </div>

          {groups.length > visibleGroups.length && (
            <button
              type="button"
              className="mt-3 h-9 w-full rounded-full border border-ink/10 bg-white/42 text-xs font-semibold text-ink/50"
            >
              查看全部阶段
            </button>
          )}
        </>
      )}
    </section>
  );
}

function CatalogDocumentRow({
  card,
  index,
  active,
  onOpenCard
}: {
  card: TaskCard;
  index: number;
  active: boolean;
  onOpenCard?: (cardId: string) => void;
}) {
  const done = isCompletedCard(card);
  const tone = getCardTone(card, active);
  const content = (
    <>
      <span className={`font-editorial text-[1.06rem] leading-none ${tone.number}`}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="min-w-0">
        <span className={`line-clamp-2 text-[0.92rem] font-semibold leading-[1.2] ${tone.title}`}>
          {card.title}
        </span>
        <span className={`mt-0.5 block truncate text-[0.66rem] font-semibold ${tone.meta}`}>
          {tone.label}
        </span>
      </span>
      <span className={`justify-self-end text-right text-[0.72rem] font-semibold ${tone.time}`}>
        {card.estimatedMinutes}m
      </span>
    </>
  );

  if (onOpenCard) {
    return (
      <button
        type="button"
        onClick={() => onOpenCard(card.id)}
        className={`grid min-h-[52px] w-full grid-cols-[2.125rem_minmax(0,1fr)_2.625rem] items-center gap-2 border-l-2 py-2 pl-2 pr-1 text-left transition hover:bg-ink/[0.025] ${active && !done ? "border-ink/42" : "border-transparent"}`}
        aria-label={`${done ? "已完成 " : ""}${card.title}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`grid min-h-[52px] grid-cols-[2.125rem_minmax(0,1fr)_2.625rem] items-center gap-2 border-l-2 py-2 pl-2 pr-1 ${active && !done ? "border-ink/42" : "border-transparent"}`}>
      {content}
    </div>
  );
}

function CatalogCardRow({
  card,
  index,
  active,
  onOpenCard
}: {
  card: TaskCard;
  index: number;
  active: boolean;
  onOpenCard?: (cardId: string) => void;
}) {
  const done = isCompletedCard(card);
  const tone = getCardTone(card, active);
  const content = (
    <>
      <span className={`font-editorial text-[1.08rem] leading-none ${tone.number}`}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="min-w-0">
        <span className={`line-clamp-2 text-[0.9rem] font-semibold leading-[1.18] ${tone.title}`}>
          {card.title}
        </span>
        <span className={`mt-0.5 block truncate text-[0.66rem] font-semibold ${tone.meta}`}>
          {tone.label}
        </span>
      </span>
      <span className={`justify-self-end text-right text-[0.72rem] font-semibold ${tone.time}`}>
        {card.estimatedMinutes}m
      </span>
    </>
  );

  if (onOpenCard) {
    return (
      <button
        type="button"
        onClick={() => onOpenCard(card.id)}
        className={`grid min-h-[54px] w-full grid-cols-[2.125rem_minmax(0,1fr)_2.625rem] items-center gap-2 rounded-[1rem] px-3 text-left transition hover:bg-ink/[0.04] ${tone.row}`}
        aria-label={`${done ? "已完成 " : ""}${card.title}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`grid min-h-[54px] grid-cols-[2.125rem_minmax(0,1fr)_2.625rem] items-center gap-2 rounded-[1rem] px-3 ${tone.row}`}>
      {content}
    </div>
  );
}

function CatalogGroupRow({
  group,
  index,
  onOpenCard
}: {
  group: CatalogGroup;
  index: number;
  onOpenCard?: (cardId: string) => void;
}) {
  const tone = getGroupTone(group.status);
  const minutes = group.cards.reduce((sum, card) => sum + card.estimatedMinutes, 0);
  const cardId = group.cards[0]?.id;
  const content = (
    <>
      <span className={`font-editorial text-[1.08rem] leading-none ${tone.number}`}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="min-w-0">
        <span className={`line-clamp-2 text-[0.9rem] font-semibold leading-[1.18] ${tone.title}`}>{group.title}</span>
        <span className={`mt-0.5 block truncate text-[0.66rem] font-semibold ${tone.meta}`}>
          {tone.label}
        </span>
      </span>
      <span className="justify-self-end text-right text-[0.72rem] font-semibold text-ink/48">
        {minutes}m
      </span>
    </>
  );

  if (onOpenCard && cardId) {
    return (
      <button
        type="button"
        onClick={() => onOpenCard(cardId)}
        className={`grid min-h-[54px] w-full grid-cols-[2.125rem_minmax(0,1fr)_2.625rem] items-center gap-2 px-3 text-left transition hover:bg-ink/[0.04] ${tone.row}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`grid min-h-[54px] grid-cols-[2.125rem_minmax(0,1fr)_2.625rem] items-center gap-2 px-3 ${tone.row}`}>
      {content}
    </div>
  );
}

function buildCatalogGroups(deck: TaskDeck, taskFlow?: TaskFlowState | null, currentCardId?: string | null): CatalogGroup[] {
  if (!taskFlow?.nodes.length) {
    return [{
      id: deck.id,
      title: deck.coverTitle,
      cards: deck.cards,
      status: getGroupStatus(deck, deck.cards, currentCardId)
    }];
  }

  return taskFlow.nodes
    .map((node) => {
      const cards = deck.cards.filter((card) => card.flowNodeId === node.id);

      return {
        id: node.id,
        title: node.title,
        cards,
        status: getGroupStatus(deck, cards, currentCardId)
      };
    })
    .filter((group) => group.cards.length > 0);
}

function getGroupStatus(deck: TaskDeck, cards: TaskCard[], currentCardId?: string | null): CatalogGroup["status"] {
  if (deck.deckStatus === "failed") {
    return "failed";
  }

  if (deck.deckStatus === "frozen") {
    return "frozen";
  }

  if (cards.length > 0 && cards.every((card) => card.status === "completed" || card.status === "rewarded")) {
    return "completed";
  }

  if (cards.some((card) => card.id === currentCardId || card.status === "active")) {
    return "active";
  }

  return "queued";
}

function getDeckStatusCopy(status: TaskDeck["deckStatus"]) {
  if (status === "completed") {
    return { label: "已完成", className: "bg-moss/10 text-moss ring-moss/15" };
  }

  if (status === "frozen") {
    return { label: "冰冻任务", className: "bg-sky-50 text-sky-900 ring-sky-200/70" };
  }

  if (status === "failed") {
    return { label: "燃烧", className: "bg-[#fff1e8] text-ember ring-ember/18" };
  }

  return { label: "进行中", className: "bg-ink/[0.055] text-ink/62 ring-ink/8" };
}

function isCompletedCard(card: TaskCard) {
  return card.status === "completed" || card.status === "rewarded";
}

function getCardTone(card: TaskCard, active: boolean) {
  if (isCompletedCard(card)) {
    return {
      label: "已完成",
      row: "bg-transparent",
      number: "text-ink/24",
      title: "text-ink/34 line-through decoration-ink/32",
      meta: "text-ink/26",
      time: "text-ink/28"
    };
  }

  if (card.status === "frozen" || card.damageEffect === "freeze") {
    return {
      label: "冰冻任务",
      row: "bg-[linear-gradient(90deg,rgba(240,251,255,0.58),transparent)]",
      number: "text-sky-700/62",
      title: "text-sky-950",
      meta: "text-sky-800/54",
      time: "text-sky-800/56"
    };
  }

  if (card.damageEffect === "burn" || card.urgencyStage === "burning" || card.urgencyStage === "expired") {
    return {
      label: "燃烧",
      row: "bg-[linear-gradient(90deg,rgba(255,241,232,0.62),transparent)]",
      number: "text-ember/60",
      title: "text-ember",
      meta: "text-ember/58",
      time: "text-ember/58"
    };
  }

  if (active) {
    return {
      label: "当前任务",
      row: "bg-mist/50",
      number: "text-ink/46",
      title: "text-ink",
      meta: "text-ink/46",
      time: "text-ink/54"
    };
  }

  return {
    label: "待开始",
    row: "bg-transparent",
    number: "text-ink/34",
    title: "text-ink/78",
    meta: "text-ink/36",
    time: "text-ink/44"
  };
}

function getGroupTone(status: CatalogGroup["status"]) {
  if (status === "completed") {
    return {
      label: "已完成",
      row: "bg-transparent",
      number: "text-moss/70",
      title: "text-ink/62 line-through",
      meta: "text-moss/54"
    };
  }

  if (status === "frozen") {
    return {
      label: "冰冻任务",
      row: "bg-[linear-gradient(90deg,rgba(240,251,255,0.58),transparent)]",
      number: "text-sky-700/62",
      title: "text-sky-950",
      meta: "text-sky-800/54"
    };
  }

  if (status === "failed") {
    return {
      label: "燃烧",
      row: "bg-[linear-gradient(90deg,rgba(255,241,232,0.62),transparent)]",
      number: "text-ember/60",
      title: "text-ember",
      meta: "text-ember/58"
    };
  }

  if (status === "active") {
    return {
      label: "当前阶段",
      row: "rounded-[1rem] bg-mist/46",
      number: "text-ink/42",
      title: "text-ink",
      meta: "text-ink/42"
    };
  }

  return {
    label: "待开始",
    row: "bg-transparent",
    number: "text-ink/34",
    title: "text-ink/78",
    meta: "text-ink/36"
  };
}
