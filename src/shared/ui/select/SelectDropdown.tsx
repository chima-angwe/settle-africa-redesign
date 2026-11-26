import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/shared/ui/icon";
import {
  normalizeSelectOption,
  type SelectOptionInput,
} from "./select.types";

export interface SelectDropdownProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  options: readonly SelectOptionInput[];
  value: string;
  onSelect: (value: string) => void;
  ariaLabel?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  align?: "left" | "right";
  minWidth?: number;
}

interface MenuPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "bottom" | "top";
}

const VIEWPORT_PADDING = 12;
const MENU_GAP = 6;
const MAX_MENU_HEIGHT = 280;

export function SelectDropdown({
  open,
  onClose,
  anchorRef,
  options,
  value,
  onSelect,
  ariaLabel = "Options",
  searchable,
  searchPlaceholder = "Search...",
  emptyMessage = "No matching options.",
  align = "left",
  minWidth = 180,
}: SelectDropdownProps) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const normalizedOptions = useMemo(
    () => options.map(normalizeSelectOption),
    [options],
  );

  const isSearchable = searchable ?? normalizedOptions.length > 6;

  const filteredOptions = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) {
      return normalizedOptions;
    }
    return normalizedOptions.filter((option) => {
      const target =
        `${option.label} ${option.value} ${option.badge ?? ""} ${option.description ?? ""} ${option.searchText ?? ""}`.toLowerCase();
      return target.includes(clean);
    });
  }, [normalizedOptions, query]);

  const handleClose = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const desiredWidth = Math.min(
      Math.max(rect.width, minWidth),
      viewportWidth - VIEWPORT_PADDING * 2,
    );

    let left = align === "right" ? rect.right - desiredWidth : rect.left;
    if (left + desiredWidth > viewportWidth - VIEWPORT_PADDING) {
      left = viewportWidth - VIEWPORT_PADDING - desiredWidth;
    }
    if (left < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING;
    }

    const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_PADDING - MENU_GAP;
    const spaceAbove = rect.top - VIEWPORT_PADDING - MENU_GAP;
    const openUpward = spaceBelow < 190 && spaceAbove > spaceBelow;

    if (openUpward) {
      setPosition({
        bottom: viewportHeight - rect.top + MENU_GAP,
        left,
        width: desiredWidth,
        maxHeight: Math.max(120, Math.min(MAX_MENU_HEIGHT, spaceAbove)),
        placement: "top",
      });
    } else {
      setPosition({
        top: rect.bottom + MENU_GAP,
        left,
        width: desiredWidth,
        maxHeight: Math.max(120, Math.min(MAX_MENU_HEIGHT, spaceBelow)),
        placement: "bottom",
      });
    }
  }, [align, anchorRef, minWidth]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      ) {
        return;
      }
      handleClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    const handleViewportChange = () => {
      updatePosition();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, anchorRef, handleClose, updatePosition]);

  if (!open || typeof document === "undefined" || !position) {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        width: position.width,
        maxHeight: position.maxHeight,
      }}
      className="select-dropdown-card z-[9998] flex flex-col overflow-hidden rounded-xl border border-line bg-paper text-ink shadow-card dark:shadow-card-dark"
    >
      {isSearchable && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-line bg-soft shrink-0">
          <Icon name="search" size={14} className="text-muted shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent border-0 outline-none text-xs text-ink placeholder:text-subtle"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="text-muted hover:text-ink cursor-pointer"
            >
              <Icon name="close" size={12} />
            </button>
          )}
        </div>
      )}

      <div
        role="listbox"
        aria-label={ariaLabel}
        className="flex-1 overflow-y-auto p-1.5 space-y-0.5"
      >
        {filteredOptions.map((option) => {
          const isSelected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={isSelected}
              disabled={option.disabled}
              onClick={() => {
                onSelect(option.value);
                handleClose();
              }}
              className={`flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                isSelected
                  ? "bg-soft font-semibold text-ink"
                  : "text-ink hover:bg-soft"
              }`}
            >
              <span className="flex items-center gap-2 min-w-0 flex-1">
                {option.icon && <span className="shrink-0">{option.icon}</span>}
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{option.label}</span>
                  {option.description && (
                    <span className="block text-[11px] font-normal text-muted truncate mt-0.5">
                      {option.description}
                    </span>
                  )}
                </span>
              </span>

              <span className="flex items-center gap-1.5 shrink-0">
                {option.badge && (
                  <span className="font-mono text-[11px] text-muted">
                    {option.badge}
                  </span>
                )}
                {isSelected && (
                  <Icon name="check" size={14} className="text-ink shrink-0" />
                )}
              </span>
            </button>
          );
        })}

        {filteredOptions.length === 0 && (
          <div className="py-5 px-3 text-center text-xs text-muted">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
