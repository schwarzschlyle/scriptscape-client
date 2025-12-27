import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";

export interface CustomCardHeaderProps {
  title?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  editable?: boolean;
  editing?: boolean;
  onEditStart?: () => void;
  onEditEnd?: () => void;
  onTitleChange?: (value: string) => void;
  deleting?: boolean;
  onDelete?: () => void;
  dragAttributes?: React.HTMLAttributes<any>;
  dragListeners?: any;
  active?: boolean;
  children?: React.ReactNode;
  inputRef?: React.Ref<HTMLInputElement>;
  [key: string]: any;
}

const CustomCardHeader: React.FC<CustomCardHeaderProps> = ({
  title,
  icon,
  actions,
  editable = false,
  editing = false,
  onEditStart,
  onEditEnd,
  onTitleChange,
  deleting = false,
  onDelete,
  dragAttributes,
  dragListeners,
  active = false,
  children,
  inputRef,
  ...rest
}) => {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        px: 1,
        py: 1,
        userSelect: "none",
        background: "rgba(47,51,47,0.35)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottom: "1px solid #1f211f",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 2px 16px 0 rgba(0,0,0,0.08)",
        cursor: "default",
      }}
      tabIndex={0}
      onDoubleClick={editable && !editing ? onEditStart : undefined}
      {...rest}
    >
      {/* Dedicated drag handle */}
      {!editing && dragListeners && (
        <Box
          {...dragAttributes}
          {...dragListeners}
          sx={{
            width: 18,
            height: 18,
            mr: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "grab",
            color: "#888",
            opacity: 0.7,
            ":hover": { opacity: 1, color: "#73a32c" },
            userSelect: "none",
          }}
          tabIndex={-1}
          aria-label="Drag handle"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <circle cx="2" cy="2" r="1.2" />
            <circle cx="6" cy="2" r="1.2" />
            <circle cx="10" cy="2" r="1.2" />
            <circle cx="2" cy="6" r="1.2" />
            <circle cx="6" cy="6" r="1.2" />
            <circle cx="10" cy="6" r="1.2" />
            <circle cx="2" cy="10" r="1.2" />
            <circle cx="6" cy="10" r="1.2" />
            <circle cx="10" cy="10" r="1.2" />
          </svg>
        </Box>
      )}
      <Box sx={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
        {icon}
        {editable && editing && onTitleChange ? (
          <input
            ref={inputRef}
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            onBlur={onEditEnd}
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              color: "#73a32c",
              border: "none",
              outline: "none",
              fontWeight: 600,
              fontSize: 16,
              fontFamily: "inherit",
              paddingLeft: 8,
              paddingRight: 16,
              textAlign: "left",
            }}
            disabled={deleting}
            placeholder="Card Title"
          />
        ) : (
          <Typography
            variant="subtitle2"
            noWrap
            sx={{
              fontWeight: 600,
              color: "#73a32c",
              fontSize: 16,
              pl: 0,
              pr: 2,
              flex: 1,
              minWidth: 0,
              textAlign: "left",
              userSelect: editable ? "text" : "none",
              display: "inline-block",
              verticalAlign: "middle",
            }}
          >
            {title}
          </Typography>
        )}
        {children}
        {actions}
        {onDelete && (
          <IconButton
            size="small"
            onClick={onDelete}
            disabled={deleting}
            aria-label="Delete"
            sx={{ color: "#e53935" }}
            style={{ display: "inline-flex" }}
          >
            {deleting ? <CircularProgress size={18} /> : <span>&times;</span>}
          </IconButton>
        )}
      </Box>
      {/* Optionally, more children can be rendered here */}
    </Box>
  );
};

export default CustomCardHeader;
