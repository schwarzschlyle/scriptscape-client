import CustomButton from "@components/CustomButton";

interface LogoutButtonProps {
  onClick: () => void;
  children?: React.ReactNode;
}

const LogoutButton = ({ onClick, children }: LogoutButtonProps) => (
  <CustomButton
    onClick={onClick}
    sx={{
      minWidth: 100,
      ml: { xs: 0, sm: 2 },
      color: "#fff",
      borderColor: "#fff",
    }}
  >
    {children || "Log Out"}
  </CustomButton>
);

export default LogoutButton;
