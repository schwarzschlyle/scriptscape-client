import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";

export interface CustomCardHeaderProps {
  title?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  actionsLeft?: React.ReactNode;
  editable?: boolean;
  editing?: boolean;
  onEditStart?: () => void;
  onEditEnd?: () => void;
  onTitleChange?: (value: string) => void;
  deleting?: boolean;
  isSaving?: boolean;
  deleteDisabled?: boolean;
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
  actionsLeft,
  editable = false,
  editing = false,
  onEditStart,
  onEditEnd,
  onTitleChange,
  deleting = false,
  isSaving = false,
  deleteDisabled = false,
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
      // Entire header acts as drag handle (except title + delete button areas)
      {...(!editing && dragListeners ? { ...dragAttributes, ...dragListeners } : {})}
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        px: 1,
        py: 0.5,
        userSelect: "none",
        background: "rgba(47,51,47,0.35)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottom: "1px solid #1f211f",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 2px 16px 0 rgba(0,0,0,0.08)",
        cursor: !editing && dragListeners ? "grab" : "default",
      }}
      tabIndex={0}
      onDoubleClick={editable && !editing ? onEditStart : undefined}
      {...rest}
    >
      <Box sx={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
        {icon}
        <Box
          // Title area should NOT initiate drag (to avoid conflicts with editing/selection)
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          sx={{ flex: 1, minWidth: 0, display: "flex" }}
        >
          {editable && editing && onTitleChange ? (
            <input
              ref={inputRef}
              value={typeof title === "string" ? title : ""}
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
        </Box>
        {children}
        {actionsLeft}
        {actions}
        {onDelete && (
          <IconButton
            size="small"
            onClick={deleting || isSaving || deleteDisabled ? undefined : onDelete}
            disabled={deleting || isSaving || deleteDisabled}
            aria-label="Delete"
            // Delete button must not initiate drag.
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            sx={{
              color: deleting || isSaving || deleteDisabled ? "#bdbdbd" : "#e53935",
              cursor: deleting || isSaving || deleteDisabled ? "not-allowed" : "pointer",
            }}
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
