import { useState } from "react";

export interface EditableListItem<T> {
  value: T;
  editing: boolean;
}

export function useEditableList<T extends { [key: string]: any }>(
  initialItems: T[]
) {
  const [items, setItems] = useState(initialItems.map((item) => ({ value: item, editing: false })));

  const setItemValue = (index: number, newValue: T) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, value: newValue } : item
      )
    );
  };

  const startEditing = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, editing: true } : { ...item, editing: false }
      )
    );
  };

  const stopEditing = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, editing: false } : item
      )
    );
  };

  const reset = (newItems: T[]) => {
    setItems(newItems.map((item) => ({ value: item, editing: false })));
  };

  return {
    items,
    setItemValue,
    startEditing,
    stopEditing,
    reset,
  };
}
