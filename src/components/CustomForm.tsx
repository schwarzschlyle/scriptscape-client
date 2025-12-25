import Box from "@mui/material/Box";
import type { BoxProps } from "@mui/material/Box";

const CustomForm = ({ children, ...props }: BoxProps) => (
  <Box
    component="form"
    sx={{
      "& .MuiTextField-root": { m: 1, width: "100%" },
      display: "flex",
      flexDirection: "column",
      gap: 1,
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
