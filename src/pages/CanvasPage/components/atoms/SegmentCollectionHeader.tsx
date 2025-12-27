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
  const [editingTitle, setEditingTitle] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTitle]);

  React.useEffect(() => {
    if (!active && editingTitle) {
      setEditingTitle(false);
      if (inputRef.current) inputRef.current.blur();
    }
  }, [active, editingTitle]);

  return (
    <CustomCardHeader
      title={name || "Untitled Segment Collection"}
      icon={null}
      editable={editable}
      editing={editingTitle}
      onEditStart={() => setEditingTitle(true)}
      onEditEnd={() => setEditingTitle(false)}
      onTitleChange={onNameChange}
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
  );
};

export default SegmentCollectionHeader;
