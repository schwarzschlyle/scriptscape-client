import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material/styles";

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
  const theme = useTheme();

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
        background: theme.palette.card.headerBg,
        // In light mode, avoid translucent/glassy header which can look like an extra "card layer".
        backdropFilter: theme.palette.mode === "dark" ? "blur(16px)" : "none",
        WebkitBackdropFilter: theme.palette.mode === "dark" ? "blur(16px)" : "none",
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottom: `1px solid ${theme.palette.card.headerBorderBottom}`,
        // Avoid an extra "outline" around the header in light mode by not drawing a full border.
        border: "none",
        boxShadow: theme.palette.mode === "dark" ? "0 2px 16px 0 rgba(0,0,0,0.08)" : "none",
        cursor: !editing && dragListeners ? "grab" : "default",
      }}
      tabIndex={0}
      onDoubleClick={editable && !editing ? onEditStart : undefined}
      {...rest}
    >
      <Box sx={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0, gap: 0.75 }}>
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
                color: theme.palette.card.titleText,
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
                color: theme.palette.card.titleText,
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
              color:
                deleting || isSaving || deleteDisabled
                  ? theme.palette.text.disabled
                  : theme.palette.error.main,
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
