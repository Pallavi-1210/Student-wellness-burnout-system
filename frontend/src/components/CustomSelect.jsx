import { useState, useRef, useEffect, useId } from "react";
import { FiChevronDown, FiCheck } from "react-icons/fi";

/**
 * CustomSelect - Accessible, styled dropdown selector matching the
 * Student Wellness palette (Cream, Sage Green, Forest Green).
 *
 * Eliminates native OS blue option highlights and provides consistent
 * styling, hover feedback, active checkmarks, and full keyboard navigation.
 */
function CustomSelect({
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  hasError = false,
  required = false,
  ariaLabelledBy,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const listboxRef = useRef(null);
  const uniqueId = useId();

  const selectId = id || `custom-select-${name}-${uniqueId}`;
  const listboxId = `listbox-${selectId}`;

  // Find currently selected option
  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const openSelect = () => {
    if (disabled) return;
    const idx = options.findIndex((opt) => String(opt.value) === String(value));
    setHighlightedIndex(idx >= 0 ? idx : 0);
    setIsOpen(true);
  };

  const closeSelect = () => {
    setIsOpen(false);
  };

  const toggleSelect = () => {
    if (disabled) return;
    if (isOpen) {
      closeSelect();
    } else {
      openSelect();
    }
  };

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && listboxRef.current && highlightedIndex >= 0) {
      const items = listboxRef.current.querySelectorAll(".custom-select-option");
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (optValue) => {
    if (disabled) return;
    onChange({
      target: {
        name,
        value: optValue,
      },
    });
    closeSelect();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        if (isOpen) {
          if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            handleSelect(options[highlightedIndex].value);
          }
        } else {
          openSelect();
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          openSelect();
        } else {
          setHighlightedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : 0
          );
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (!isOpen) {
          openSelect();
        } else {
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : options.length - 1
          );
        }
        break;

      case "Escape":
      case "Tab":
        if (isOpen) {
          if (e.key === "Escape") e.preventDefault();
          closeSelect();
        }
        break;

      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${isOpen ? "open" : ""} ${
        hasError ? "has-error" : ""
      } ${disabled ? "disabled" : ""}`}
    >
      {/* Trigger Button (Closed/Active Dropdown State) */}
      <button
        type="button"
        id={selectId}
        className={`custom-select-trigger ${
          selectedOption && selectedOption.value !== "" ? "has-value" : "placeholder"
        }`}
        onClick={toggleSelect}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-labelledby={ariaLabelledBy}
        aria-required={required}
        disabled={disabled}
      >
        <span className="custom-select-label">
          {selectedOption && selectedOption.value !== ""
            ? selectedOption.label
            : placeholder}
        </span>
        <span className={`custom-select-chevron ${isOpen ? "rotated" : ""}`}>
          <FiChevronDown />
        </span>
      </button>

      {/* Hidden input to ensure native form serialization and accessibility query support */}
      <input
        type="hidden"
        name={name}
        value={value ?? ""}
        required={required}
      />

      {/* Dropdown Menu (Opened Dropdown State) */}
      {isOpen && (
        <div
          ref={listboxRef}
          id={listboxId}
          className="custom-select-menu fade-in-down"
          role="listbox"
          aria-labelledby={ariaLabelledBy}
          tabIndex={-1}
        >
          {options.map((option, idx) => {
            const isSelected = String(option.value) === String(value);
            const isHighlighted = idx === highlightedIndex;
            const isPlaceholderOption = option.value === "";

            return (
              <div
                key={option.value || idx}
                role="option"
                id={`${selectId}-opt-${idx}`}
                aria-selected={isSelected}
                className={`custom-select-option ${
                  isSelected ? "selected" : ""
                } ${isHighlighted ? "highlighted" : ""} ${
                  isPlaceholderOption ? "option-placeholder" : ""
                }`}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setHighlightedIndex(idx)}
              >
                <span className="option-label-text">{option.label}</span>
                {isSelected && !isPlaceholderOption && (
                  <span className="option-check-icon">
                    <FiCheck />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
