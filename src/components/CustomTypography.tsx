import Typography from "@mui/material/Typography";
import type { TypographyProps } from "@mui/material/Typography";

const CustomTypography = (props: TypographyProps) => (
  <Typography
    fontFamily="'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif"
    color="text.primary"
    sx={{
      fontWeight: 500,
      letterSpacing: 0.01,
      ...props.sx,
    }}
    {...props}
  />
);

export default CustomTypography;
