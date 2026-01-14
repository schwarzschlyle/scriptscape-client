import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import { useTheme, alpha } from "@mui/material/styles";

const CustomButton = (props: ButtonProps) => {
  const theme = useTheme();

  // Make auth buttons always readable (outlined secondary was too subtle on dark Paper).
  const isDark = theme.palette.mode === "dark";

  return (
    <Button
      fullWidth
      variant={props.variant ?? "contained"}
      color={props.color ?? "success"}
      sx={{
        mt: 1.5,
        fontWeight: 800,
        fontSize: 15,
        textTransform: "none",
        borderRadius: 1.5,
        py: 1.1,
        boxShadow: 0,
        ...(props.variant === "contained" || !props.variant
          ? {
              color: isDark ? "#0b0c0b" : theme.palette.getContrastText(theme.palette.success.main),
              "&:hover": {
                boxShadow: 0,
                backgroundColor: alpha(theme.palette.success.main, 0.92),
              },
            }
          : {}),
        ...props.sx,
      }}
      {...props}
    />
  );
};

export default CustomButton;
