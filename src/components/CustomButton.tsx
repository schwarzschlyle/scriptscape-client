import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";

const CustomButton = (props: ButtonProps) => {
  return (
    <Button
      fullWidth
      variant="outlined"
      color="secondary"
      sx={{
        mt: 1.5,
        fontWeight: 1600,
        fontSize: "16px",
        ...props.sx,
      }}
      {...props}
    />
  );
};

export default CustomButton;
