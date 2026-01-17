import React from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import CustomCard from "@components/CustomCard";
import CustomCardHeader from "@components/CustomCardHeader";
import CardFooter from "@components/CardFooter";
import CardStatusDot from "../atoms/CardStatusDot";
import CardTypography from "./CardTypography";
import { useTheme } from "@mui/material/styles";

export interface CardStyleModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  /** Optional icon shown before the title (SVG img etc). */
  titleIcon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Defaults to 340 to match canvas cards. */
  width?: number;
  /** Fixed modal height; content scrolls inside. Defaults to 440. */
  heightPx?: number;
}

const CardStyleModal: React.FC<CardStyleModalProps> = ({
  open,
  onClose,
  title,
  titleIcon,
  children,
  footer,
  width = 340,
  heightPx = 440,
}) => {
  const theme = useTheme();
  // Use dynamic viewport units so mobile browsers (Safari/Chrome) don't
  // mis-center due to URL bars changing the visible viewport.
  // We keep a stable max height while allowing smaller screens to fit.
  const modalHeight = `min(${heightPx}px, 80dvh)`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(0,0,0,0.55)"
                : "rgba(17,24,39,0.35)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          },
        },
      }}
    >
      <Box
        sx={{
          position: "fixed" as const,
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, sm: 0 },
          outline: "none",
        }}
      >
        <Box
          sx={{
            width: { xs: "min(92vw, 420px)", sm: width },
            height: { xs: "min(86dvh, 560px)", sm: modalHeight },
            // Subtle extra depth vs canvas cards.
            filter:
              theme.palette.mode === "dark"
                ? "drop-shadow(0 18px 50px rgba(0,0,0,0.55))"
                : "drop-shadow(0 18px 50px rgba(0,0,0,0.18))",
          }}
        >
          <CustomCard
            sx={{
            // Glassy overlay without changing existing palette tokens.
            backgroundImage:
              theme.palette.mode === "dark"
                ? "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)"
                : "linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.62) 100%)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: theme.palette.mode === "dark" ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(17,24,39,0.10)",
            }}
            header={
            <CustomCardHeader
              // Header should not be editable, expandable, closable, or draggable.
              editable={false}
              title={
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    paddingTop: 2,
                    paddingBottom: 2,
                  }}
                >
                  {titleIcon ? (
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 6,
                        background:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(17,24,39,0.06)",
                      }}
                    >
                      {titleIcon}
                    </span>
                  ) : null}
                  <CardTypography variant="cardType" style={{ fontWeight: 650, fontSize: 15 }}>
                    {title}
                  </CardTypography>
                </span>
              }
              actions={
                <Box sx={{ display: "flex", alignItems: "center", gap: "1px", marginLeft: "auto" }}>
                  {/* Always green; no logic */}
                  <CardStatusDot status="active" size={10} />
                </Box>
              }
            />
          }
          body={
            <>
              <Box
                sx={{
                  flex: 1,
                  overflow: "hidden",
                  overflowX: "hidden",
                  // Provide a consistent “form padding” similar to other cards.
                  px: 2,
                  pt: 2,
                  pb: 1,
                }}
              >
                {children}
              </Box>

              {/* Footer area should match card styling; content is provided by the modal. */}
              <CardFooter left={null} center={null} right={footer ?? null} height={40} />
            </>
            }
            // Card should fill the responsive container.
            height="100%"
          />
        </Box>
      </Box>
    </Modal>
  );
};

export default CardStyleModal;
