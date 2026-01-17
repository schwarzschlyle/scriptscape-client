import React from "react";
import AiPromptIcon from "../../../../assets/ai-prompt-icon.svg";

export interface AiCornerButtonProps {
  /** For now, no logic; keep click-stopping for aesthetics only. */
  ariaLabel?: string;
}

const AiCornerButton: React.FC<AiCornerButtonProps> = ({ ariaLabel = "AI (inactive)" }) => {
  return (
    <button
      type="button"
      style={{
        position: "absolute",
        right: 10,
        bottom: 10,
        width: 28,
        height: 28,
        borderRadius: 10,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "default",
        opacity: 0.85,
        padding: 0,
        margin: 0,
        outline: "none",
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      aria-label={ariaLabel}
    >
      <img src={AiPromptIcon} alt="AI" style={{ width: 18, height: 18, display: "block" }} />
    </button>
  );
};

export default AiCornerButton;

