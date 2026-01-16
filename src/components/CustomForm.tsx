import Box from "@mui/material/Box";
import type { BoxProps } from "@mui/material/Box";

const CustomForm = ({ children, ...props }: BoxProps) => (
  <Box
    component="form"
    sx={{
      // Legacy: keep MUI TextField spacing sane if some forms still use it.
      "& .MuiTextField-root": { m: 0, width: "100%" },
      display: "flex",
      flexDirection: "column",
      gap: 1.5,
      ...props.sx,
    }}
    noValidate
    autoComplete="off"
    {...props}
  >
    {children}
  </Box>
);

export default CustomForm;
