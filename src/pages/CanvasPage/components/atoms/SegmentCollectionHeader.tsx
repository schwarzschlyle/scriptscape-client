import React from "react";
import CustomCardHeader from "../../../../components/CustomCardHeader";

interface SegmentCollectionHeaderProps {
  name: string;
  onNameChange?: (value: string) => void;
  deleting?: boolean;
  onDelete?: () => void;
  dragAttributes?: React.HTMLAttributes<any>;
  dragListeners?: any;
  active?: boolean;
  editable?: boolean;
}

const SegmentCollectionHeader: React.FC<SegmentCollectionHeaderProps> = ({
  name,
  onNameChange,
  deleting,
  onDelete,
  dragAttributes,
  dragListeners,
  active = false,
  editable = false,
}) => {
  const [editing, setEditing] = React.useState(false);
  const [localName, setLocalName] = React.useState(name || "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Keep localName in sync with prop when not editing
  React.useEffect(() => {
    if (!editing) setLocalName(name || "");
  }, [name, editing]);

  // Only exit editing on blur or Enter
  const handleBlur = () => {
    setEditing(false);
    if (localName !== name && onNameChange) {
      onNameChange(localName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setEditing(false);
      if (localName !== name && onNameChange) {
        onNameChange(localName);
      }
    }
  };

  // Allow double-click to start editing
  const handleDoubleClick = () => {
    if (editable) setEditing(true);
  };

  return (
    <div onDoubleClick={handleDoubleClick}>
      <CustomCardHeader
        title={
          editing
            ? ( // Cast input as React.ReactNode to satisfy type
                <input
                  ref={inputRef}
                  value={localName}
                  onChange={e => setLocalName(e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    background: "transparent",
                    color: "#fff",
                    border: "1px solid #444",
                    borderRadius: 4,
                    padding: "2px 8px",
                    width: "90%",
                  }}
                  autoFocus
                /> as unknown as React.ReactNode
              )
            : (localName || "Untitled Segment Collection")
        }
        icon={null}
        editable={editable}
        editing={editing}
        onEditStart={() => setEditing(true)}
        onEditEnd={() => setEditing(false)}
        deleting={deleting}
        onDelete={onDelete}
        dragAttributes={dragAttributes}
        dragListeners={dragListeners}
        active={active}
        inputRef={inputRef}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: active ? "#abf43e" : "#6a6967",
                marginRight: 8,
                border: "1.5px solid #232523",
              }}
            />
          </div>
        }
      />
    </div>
  );
};

export default SegmentCollectionHeader;
