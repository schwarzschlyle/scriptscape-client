import { useState, useCallback, useRef, useEffect } from "react";

/**
 * useEditableField
 * A reusable hook for managing local editing state for a field (e.g. name, text).
 * Handles value, editing state, focus, and commit/cancel logic.
 */
export function useEditableField<T extends string>(
  initialValue: T,
  onCommit?: (value: T) => void
) {
  const [value, setValue] = useState<T>(initialValue);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep value in sync with initialValue when not editing
  useEffect(() => {
    if (!editing) setValue(initialValue);
  }, [initialValue, editing]);

  // Focus input when editing starts
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEditing = useCallback(() => setEditing(true), []);
  const stopEditing = useCallback(() => setEditing(false), []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value as T);
  }, []);

  const handleBlur = useCallback(() => {
    setEditing(false);
    if (value !== initialValue && onCommit) {
      onCommit(value);
    }
  }, [value, initialValue, onCommit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        setEditing(false);
        if (value !== initialValue && onCommit) {
          onCommit(value);
        }
      }
    },
    [value, initialValue, onCommit]
  );

  return {
    value,
    setValue,
    editing,
    setEditing,
    inputRef,
    startEditing,
    stopEditing,
    handleChange,
    handleBlur,
    handleKeyDown,
  };
}
