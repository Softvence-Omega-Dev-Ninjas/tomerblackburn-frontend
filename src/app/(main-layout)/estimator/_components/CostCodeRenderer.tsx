import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Lightbulb, X as XIcon, ChevronDown, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CostCode {
  id: string;
  code: string;
  name: string;
  elies?: string;
  tips?: string[];
  description?: string;
  clientPrice: number;
  unitType: string;
  questionType: string;
  step: number;
  isIncludedInBase: boolean;
  requiresQuantity: boolean;
  isOptional: boolean;
  isActive: boolean;
  parentCostCodeId?: string;
  showWhenParentValue?: string;
  nestedInputType?: "QUANTITY" | "DROPDOWN" | "CUSTOM_PRICE" | "NONE";
  category?: { id: string; name: string };
  options?: Array<{
    id: string;
    optionName: string;
    optionValue?: string;
    priceModifier: string;
    isDefault: boolean;
    displayOrder: number;
  }>;
}

interface CostCodeSelection {
  costCodeId: string;
  costCodeName?: string;
  selectedOptionId?: string;
  quantity?: number;
  unitPrice: number;
  isEnabled?: boolean;
  userInputValue?: string;
  notes?: string;
}

interface CostCodeRendererProps {
  costCodes: CostCode[];
  selections: CostCodeSelection[];
  onSelectionChange: (
    costCodeId: string,
    selection: Partial<CostCodeSelection>,
  ) => void;
  onSelectionRemove: (costCodeId: string) => void;
}

// ─── TipsPopover ────────────────────────────────────────────────────────────
const TipsPopover: React.FC<{ tips: string[]; label: string }> = ({ tips, label }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const POPOVER_W = 272;

  const calcPos = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const scrollY = window.scrollY;

    let left = rect.left;
    // flip left if overflows right edge
    if (left + POPOVER_W > vw - 12) {
      left = Math.max(8, rect.right - POPOVER_W);
    }
    // clamp to viewport
    left = Math.max(8, Math.min(left, vw - POPOVER_W - 8));

    setPos({ top: rect.bottom + scrollY + 6, left });
  };

  const handleOpen = () => {
    calcPos();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    const reposition = () => calcPos();
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : handleOpen())}
        aria-label={`Tips for ${label}`}
        className={`relative flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 ${
          open
            ? "bg-[#283878] text-white shadow-lg shadow-[#283878]/40 scale-110"
            : "bg-[#283878]/10 text-[#283878] hover:bg-[#283878]/20 hover:scale-110"
        }`}
      >
        <Lightbulb className="w-3.5 h-3.5" />
        {!open && (
          <span className="absolute inset-0 rounded-full animate-ping bg-[#283878]/20 pointer-events-none" />
        )}
      </button>

      {open && typeof window !== "undefined" && createPortal(
        <div
          ref={popoverRef}
          style={{ position: "absolute", top: pos.top, left: pos.left, width: POPOVER_W, zIndex: 9999 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-xl overflow-hidden shadow-2xl shadow-[#283878]/20 border border-[#283878]/10"
          >
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#283878]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <Lightbulb className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-semibold text-white tracking-wide">Pro Tips</span>
                <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-medium">
                  {tips.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
                aria-label="Close tips"
              >
                <XIcon className="w-3 h-3 text-white" />
              </button>
            </div>
            <ul className="px-3.5 py-3 space-y-2.5 max-h-60 overflow-y-auto">
              {tips.map((tip, i) => (
                <li key={i} className="flex gap-2.5 items-start">
                  <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-[#283878] text-white text-[9px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-xs text-gray-600 leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
            <div className="h-0.5 bg-gradient-to-r from-[#283878] via-[#4064b8] to-transparent" />
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ─── AnimatedChildren ────────────────────────────────────────────────────────
const AnimatedChildren: React.FC<{
  show: boolean;
  children: React.ReactNode;
}> = ({ show, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">(0);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const observer = new ResizeObserver(() => setHeight(el.scrollHeight));
    observer.observe(el);
    setHeight(el.scrollHeight);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      initial={false}
      animate={{ height: show ? height : 0, opacity: show ? 1 : 0 }}
      onAnimationComplete={() => { if (show) setHeight("auto"); }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ overflow: "hidden" }}
    >
      <div ref={ref}>{children}</div>
    </motion.div>
  );
};

// ─── UpgradeLabel ────────────────────────────────────────────────────────────
const UpgradeLabel = ({ isIncludedInBase }: { isIncludedInBase: boolean }) => (
  <p className={`text-xs mt-1 ${isIncludedInBase ? "text-green-600 font-medium" : "text-[#283878]"}`}>
    {isIncludedInBase ? "✦ Included in Base Price" : "✦ Additional Upgrade"}
  </p>
);

// ─── Toggle ──────────────────────────────────────────────────────────────────
const Toggle = ({
  isEnabled,
  onToggle,
  label,
}: {
  isEnabled: boolean;
  onToggle: () => void;
  label: string;
}) => (
  <button
    type="button"
    onClick={onToggle}
    className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#283878] focus:ring-offset-2 ${isEnabled ? "bg-[#283878]" : "bg-gray-300"}`}
    role="switch"
    aria-checked={isEnabled ? "true" : "false"}
    aria-label={`Toggle ${label}`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${isEnabled ? "translate-x-5" : "translate-x-0.5"}`}
    />
  </button>
);

// ─── CategoryAccordion ───────────────────────────────────────────────────────
const CategoryAccordion: React.FC<{
  categoryName: string;
  isOpen: boolean;
  onToggle: () => void;
  selectionCount: number;
  children: React.ReactNode;
}> = ({ categoryName, isOpen, onToggle, selectionCount, children }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm overflow-hidden border transition-all duration-200 ${
        isOpen ? "border-[#283878]/20" : "border-transparent"
      }`}
    >
      {/* Accordion Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/80 transition-colors group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-gray-900 group-hover:text-[#283878] transition-colors">
            {categoryName}
          </h2>
          {selectionCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              {selectionCount} selected
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isOpen
              ? "bg-[#283878] text-white"
              : "bg-gray-100 text-gray-500 group-hover:bg-[#283878]/10 group-hover:text-[#283878]"
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Accordion Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-5 pb-5 space-y-2 border-t border-gray-100">
              <div className="pt-4 space-y-2">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── CostCodeRenderer ────────────────────────────────────────────────────────
export const CostCodeRenderer: React.FC<CostCodeRendererProps> = ({
  costCodes,
  selections,
  onSelectionChange,
  onSelectionRemove,
}) => {
  const autoAddedRef = useRef<Set<string>>(new Set());
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const initializedRef = useRef(false);

  // Group cost codes by category
  const groupedCostCodes = costCodes
    .filter((cc) => !cc.parentCostCodeId)
    .reduce(
      (acc, costCode) => {
        const categoryName = costCode.category?.name || "Other";
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(costCode);
        return acc;
      },
      {} as Record<string, CostCode[]>,
    );

  const categoryNames = Object.keys(groupedCostCodes);

  // Initialize: open first category by default
  useEffect(() => {
    if (initializedRef.current || categoryNames.length === 0) return;
    initializedRef.current = true;
    setOpenCategories(new Set([categoryNames[0]]));
  }, [categoryNames]);

  // Auto-open categories that have selections
  useEffect(() => {
    if (selections.length === 0) return;
    setOpenCategories((prev) => {
      const next = new Set(prev);
      categoryNames.forEach((catName) => {
        const catCodes = groupedCostCodes[catName] || [];
        const hasSelection = catCodes.some((cc) =>
          selections.find((s) => s.costCodeId === cc.id),
        );
        if (hasSelection) next.add(catName);
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections.length]);

  const toggleCategory = useCallback((categoryName: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  }, []);

  // Count active selections per category
  const getSelectionCount = (catCodes: CostCode[]) =>
    catCodes.filter((cc) =>
      selections.find(
        (s) =>
          s.costCodeId === cc.id &&
          (s.isEnabled || s.selectedOptionId || s.userInputValue),
      ),
    ).length;

  // ── Auto-add logic ──────────────────────────────────────────────────────
  useEffect(() => {
    costCodes.forEach((costCode) => {
      if (
        !selections.find((s) => s.costCodeId === costCode.id) &&
        !autoAddedRef.current.has(costCode.id)
      ) {
        if (
          costCode.questionType === "WHITE" &&
          !costCode.isIncludedInBase &&
          !costCode.parentCostCodeId
        ) {
          autoAddedRef.current.add(costCode.id);
          onSelectionChange(costCode.id, {
            costCodeName: costCode.elies || costCode.name,
            unitPrice: costCode.clientPrice,
            isEnabled: true,
            quantity: 1,
          });
        }
        if (costCode.questionType === "PURPLE" && costCode.parentCostCodeId) {
          const parentSelection = selections.find(
            (s) => s.costCodeId === costCode.parentCostCodeId,
          );
          const inheritedQty = parentSelection?.quantity ?? 1;
          if (parentSelection) {
            autoAddedRef.current.add(costCode.id);
            onSelectionChange(costCode.id, {
              costCodeName: costCode.elies || costCode.name,
              unitPrice: costCode.clientPrice,
              isEnabled: true,
              quantity: inheritedQty,
            });
          }
        }
      }
      // PURPLE: sync quantity if parent changed
      if (costCode.questionType === "PURPLE" && costCode.parentCostCodeId) {
        const existing = selections.find((s) => s.costCodeId === costCode.id);
        const parentSelection = selections.find(
          (s) => s.costCodeId === costCode.parentCostCodeId,
        );
        if (
          existing &&
          parentSelection &&
          existing.quantity !== parentSelection.quantity
        ) {
          onSelectionChange(costCode.id, { quantity: parentSelection.quantity });
        }
      }
    });
  }, [costCodes, selections, onSelectionChange]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const getSelection = (costCodeId: string) =>
    selections.find((s) => s.costCodeId === costCodeId);

  const getChildQuestions = (parentId: string) =>
    costCodes.filter((cc) => cc.parentCostCodeId === parentId);

  const shouldShowChild = (costCode: CostCode): boolean => {
    if (!costCode.parentCostCodeId) return true;
    const parentSelection = getSelection(costCode.parentCostCodeId);
    if (!parentSelection) return false;
    if (costCode.showWhenParentValue === "true")
      return parentSelection.isEnabled === true;
    if (costCode.showWhenParentValue === "ANY")
      return !!parentSelection.quantity || !!parentSelection.selectedOptionId;
    return parentSelection.selectedOptionId === costCode.showWhenParentValue;
  };

  const handleToggle = (costCode: CostCode, enabled: boolean) => {
    if (enabled) {
      onSelectionChange(costCode.id, {
        costCodeName: costCode.elies || costCode.name,
        unitPrice: costCode.clientPrice,
        isEnabled: true,
        quantity: costCode.requiresQuantity ? 1 : undefined,
      });
    } else {
      onSelectionRemove(costCode.id);
      getChildQuestions(costCode.id).forEach((child) =>
        onSelectionRemove(child.id),
      );
    }
  };

  const handleOptionChange = (costCode: CostCode, optionId: string) => {
    const option = costCode.options?.find((o) => o.id === optionId);
    if (option) {
      onSelectionChange(costCode.id, {
        costCodeName: costCode.elies || costCode.name,
        selectedOptionId: optionId,
        unitPrice: Number(option.priceModifier),
        isEnabled: true,
      });
    }
  };

  const handleQuantityInput = (
    costCode: CostCode,
    value: string,
    selection: CostCodeSelection | undefined,
  ) => {
    const numValue = Number(value);
    if (!value || numValue <= 0) {
      if (selection) onSelectionRemove(costCode.id);
      return;
    }
    if (!selection) {
      onSelectionChange(costCode.id, {
        costCodeName: costCode.elies || costCode.name,
        unitPrice: costCode.clientPrice,
        isEnabled: true,
        userInputValue: value,
        quantity: numValue,
      });
    } else {
      onSelectionChange(costCode.id, { userInputValue: value, quantity: numValue });
    }
  };

  const formatDescription = (description?: string) => {
    if (!description) return null;
    const lines = description
      .split(/\s*-\s+/)
      .filter((l) => l.trim())
      .map((l) => l.trim());
    if (lines.length <= 1)
      return <p className="text-xs text-gray-500 mt-1">{description}</p>;
    return (
      <div className="text-xs text-gray-500 space-y-0.5 mt-1">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-1">
            <span className="text-gray-400">•</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderChildren = (parentId: string, show: boolean) => {
    const children = getChildQuestions(parentId);
    if (!children.length) return null;
    return (
      <AnimatedChildren show={show}>
        <div className="mt-3 space-y-2">
          {children.map((child) =>
            shouldShowChild(child) ? renderCostCode(child, true) : null,
          )}
        </div>
      </AnimatedChildren>
    );
  };

  const renderCostCode = (costCode: CostCode, isNested = false) => {
    const selection = getSelection(costCode.id);
    const isEnabled = selection?.isEnabled || false;
    const bgColor = costCode.isIncludedInBase ? "bg-green-50" : "bg-blue-50";
    const sizeClass = isNested
      ? "p-3 rounded-lg border-l-4 border-[#283878] bg-white/80 ml-2"
      : "p-3 rounded-lg mb-2";

    if (costCode.questionType === "RED") return null;

    if (costCode.questionType === "WHITE") {
      return (
        <div key={costCode.id} className={`${bgColor} ${sizeClass}`}>
          <div className="flex items-start gap-1.5">
            <p className="text-sm font-semibold text-gray-800">{costCode.name}</p>
            {costCode.tips && costCode.tips.length > 0 && (
              <TipsPopover tips={costCode.tips} label={costCode.name} />
            )}
          </div>
          {formatDescription(costCode.description)}
          <UpgradeLabel isIncludedInBase={costCode.isIncludedInBase} />
          {renderChildren(costCode.id, true)}
        </div>
      );
    }

    if (costCode.questionType === "BLUE" || costCode.questionType === "YELLOW") {
      return (
        <div key={costCode.id} className={`${bgColor} ${sizeClass}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-1.5">
                <p className="text-sm font-semibold text-gray-800">{costCode.name}</p>
                {costCode.tips && costCode.tips.length > 0 && (
                  <TipsPopover tips={costCode.tips} label={costCode.name} />
                )}
              </div>
              {formatDescription(costCode.description)}
              <UpgradeLabel isIncludedInBase={costCode.isIncludedInBase} />
            </div>
            <Toggle
              isEnabled={isEnabled}
              onToggle={() => handleToggle(costCode, !isEnabled)}
              label={costCode.name}
            />
          </div>
          {renderChildren(costCode.id, isEnabled)}
        </div>
      );
    }

    if (costCode.questionType === "GREEN") {
      return (
        <div key={costCode.id} className={`${bgColor} ${sizeClass}`}>
          <div className="flex items-start gap-1.5 mb-1.5">
            <p className="text-sm font-semibold text-gray-800">{costCode.name}</p>
            {costCode.tips && costCode.tips.length > 0 && (
              <TipsPopover tips={costCode.tips} label={costCode.name} />
            )}
          </div>
          {formatDescription(costCode.description)}
          <UpgradeLabel isIncludedInBase={costCode.isIncludedInBase} />
          <div className="flex items-center gap-2 mt-1.5">
            <Input
              type="number"
              min="1"
              value={selection?.userInputValue || ""}
              onChange={(e) => handleQuantityInput(costCode, e.target.value, selection)}
              placeholder="Enter value"
              className="w-full sm:w-40 p-5 h-10 text-sm border-[#283878]/40 focus:border-[#283878] focus:ring-[#283878]"
            />
            <span className="text-xs text-gray-500">
              {costCode.unitType.replace("PER_", "per ").toLowerCase()}
            </span>
          </div>
          {renderChildren(costCode.id, !!selection?.userInputValue)}
        </div>
      );
    }

    if (costCode.questionType === "ORANGE" && costCode.options) {
      return (
        <div key={costCode.id} className={`${bgColor} ${sizeClass}`}>
          <div className="flex items-start gap-1.5 mb-1.5">
            <p className="text-sm font-semibold text-gray-800">{costCode.name}</p>
            {costCode.tips && costCode.tips.length > 0 && (
              <TipsPopover tips={costCode.tips} label={costCode.name} />
            )}
          </div>
          {formatDescription(costCode.description)}
          <UpgradeLabel isIncludedInBase={costCode.isIncludedInBase} />
          <select
            value={selection?.selectedOptionId || ""}
            onChange={(e) => {
              if (e.target.value) handleOptionChange(costCode, e.target.value);
              else onSelectionRemove(costCode.id);
            }}
            className="w-full rounded-lg border border-[#283878]/40 focus:border-[#283878] focus:ring-1 focus:ring-[#283878] p-2.5 text-sm mt-1 min-h-11 outline-none"
            aria-label={`Select ${costCode.name}`}
          >
            <option value="">Select option</option>
            {costCode.options
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((option) => (
                <option key={option.id} value={option.id}>
                  {option.optionName.replace(/_/g, " ")}
                </option>
              ))}
          </select>
          {renderChildren(costCode.id, !!selection?.selectedOptionId)}
        </div>
      );
    }

    if (costCode.questionType === "PURPLE") {
      return (
        <div key={costCode.id} className={`${bgColor} ${sizeClass}`}>
          <div className="flex items-start gap-1.5">
            <p className="text-sm font-semibold text-gray-800">{costCode.name}</p>
            {costCode.tips && costCode.tips.length > 0 && (
              <TipsPopover tips={costCode.tips} label={costCode.name} />
            )}
          </div>
          {formatDescription(costCode.description)}
          <UpgradeLabel isIncludedInBase={costCode.isIncludedInBase} />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-3">
      {categoryNames.map((categoryName) => {
        const catCodes = groupedCostCodes[categoryName];
        const isOpen = openCategories.has(categoryName);
        const selectionCount = getSelectionCount(catCodes);

        return (
          <CategoryAccordion
            key={categoryName}
            categoryName={categoryName}
            isOpen={isOpen}
            onToggle={() => toggleCategory(categoryName)}
            selectionCount={selectionCount}
          >
            {catCodes.map((cc) => renderCostCode(cc))}
          </CategoryAccordion>
        );
      })}
    </div>
  );
};
