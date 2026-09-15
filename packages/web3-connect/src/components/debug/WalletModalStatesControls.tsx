import { useMemo, useState } from "react"

import {
  closeWalletModal,
  getWalletModalStatePresets,
  resetWalletModalState,
  WalletModalStatePreset,
} from "@/components/debug/walletModalStatePresets"

const buttonStyle = {
  display: "block",
  width: "100%",
  textAlign: "left" as const,
  padding: "8px 12px",
  border: "1px solid #333",
  borderRadius: 6,
  background: "#161b22",
  color: "#e6edf3",
  cursor: "pointer",
  font: "inherit",
}

const disabledButtonStyle = {
  ...buttonStyle,
  opacity: 0.45,
  cursor: "not-allowed",
}

const actionButtonStyle = {
  ...buttonStyle,
  width: "auto",
  textAlign: "center" as const,
}

type WalletModalStatesControlsProps = {
  readonly compact?: boolean
}

const PresetButton: React.FC<{
  readonly preset: WalletModalStatePreset
  readonly activeId: string | null
  readonly onSelect: (preset: WalletModalStatePreset) => void
}> = ({ preset, activeId, onSelect }) => {
  const isActive = activeId === preset.id
  const isDisabled = preset.disabled

  return (
    <button
      type="button"
      disabled={isDisabled}
      title={isDisabled ? preset.disabledReason : undefined}
      style={{
        ...(isDisabled ? disabledButtonStyle : buttonStyle),
        borderColor: isActive ? "#58a6ff" : "#333",
        background: isActive ? "#1f2937" : "#161b22",
      }}
      onClick={() => onSelect(preset)}
    >
      <strong>{preset.label}</strong>
      <div style={{ opacity: 0.65, marginTop: 4, lineHeight: 1.4 }}>
        {preset.description}
      </div>
      {isDisabled && preset.disabledReason && (
        <div style={{ color: "#f85149", marginTop: 4 }}>
          {preset.disabledReason}
        </div>
      )}
    </button>
  )
}

export const WalletModalStatesControls: React.FC<
  WalletModalStatesControlsProps
> = ({ compact = false }) => {
  const presets = useMemo(() => getWalletModalStatePresets(), [])
  const [activeId, setActiveId] = useState<string | null>(null)

  const handleSelect = (preset: WalletModalStatePreset) => {
    if (preset.disabled) return
    preset.apply()
    setActiveId(preset.id)
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: compact ? 8 : 12,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <button
          type="button"
          style={actionButtonStyle}
          onClick={() => closeWalletModal()}
        >
          Close modal
        </button>
        <button
          type="button"
          style={actionButtonStyle}
          onClick={() => {
            resetWalletModalState()
            setActiveId(null)
          }}
        >
          Reset store
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: compact
            ? "1fr"
            : "repeat(auto-fill, minmax(280px, 1fr))",
          gap: compact ? 8 : 12,
        }}
      >
        {presets.map((preset) => (
          <PresetButton
            key={preset.id}
            preset={preset}
            activeId={activeId}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  )
}
