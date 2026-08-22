"use client";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { CardImage } from "./CardImage";
import { useCardCatalog, normalizeCardName } from "./useCardIcons";

type CardPickerProps = {
  /** Currently picked card names (display names from the catalog). */
  value: string[];
  onChange: (next: string[]) => void;
  /** Hard cap on picks — 8 for a deck, 3 for meta-lab focus cards. */
  max: number;
  placeholder?: string;
  /** Class applied to the autocomplete's TextField, for per-page theming. */
  fieldClassName?: string;
  /** Render `max` empty slots even before anything is picked. */
  showEmptySlots?: boolean;
  disabled?: boolean;
};

/**
 * Autocomplete-driven card picker: type a name, hit enter, it lands in a slot
 * row rendered with real card art. Click a slot to drop that card.
 *
 * Shared by /deckai matchup mode (8 slots) and /meta-lab focus cards (3).
 */
export function CardPicker({
  value,
  onChange,
  max,
  placeholder = "Add a card…",
  fieldClassName,
  showEmptySlots = false,
  disabled = false,
}: CardPickerProps) {
  const { names, icons } = useCardCatalog();
  const [input, setInput] = useState("");

  const picked = new Set(value.map(normalizeCardName));
  const options = names.filter((n) => !picked.has(normalizeCardName(n)));
  const full = value.length >= max;

  function add(name: string | null) {
    if (!name) return;
    if (full || picked.has(normalizeCardName(name))) return;
    onChange([...value, name]);
    setInput("");
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  const emptyCount = showEmptySlots ? Math.max(0, max - value.length) : 0;

  return (
    <Box className="card-picker">
      <Autocomplete
        options={options}
        value={null}
        inputValue={input}
        onInputChange={(_, v, reason) => {
          if (reason !== "reset") setInput(v);
        }}
        onChange={(_, v) => add(v)}
        disabled={disabled || full}
        blurOnSelect
        clearOnBlur
        size="small"
        noOptionsText="no card matches"
        renderInput={(params) => (
          <TextField
            {...params}
            className={fieldClassName}
            placeholder={full ? `${max}/${max} picked` : placeholder}
          />
        )}
        renderOption={(props, option) => {
          const { key, ...rest } = props as { key?: string } & Record<string, unknown>;
          return (
            <Box
              component="li"
              key={key ?? option}
              {...rest}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <CardImage icons={icons} name={option} className="card-picker-option-img" />
              <span>{option}</span>
            </Box>
          );
        }}
      />

      {(value.length > 0 || emptyCount > 0) && (
        <Box className="card-picker-slots">
          {value.map((name, i) => (
            <Box
              component="button"
              type="button"
              key={`${name}-${i}`}
              className="card-picker-slot"
              onClick={() => remove(i)}
              title={`Remove ${name}`}
              aria-label={`Remove ${name}`}
              disabled={disabled}
            >
              <CardImage icons={icons} name={name} className="card-picker-slot-img" />
              <Typography className="card-picker-slot-name">{name}</Typography>
              <span className="card-picker-slot-x">×</span>
            </Box>
          ))}
          {Array.from({ length: emptyCount }).map((_, i) => (
            <Box key={`empty-${i}`} className="card-picker-slot card-picker-slot-empty">
              <span className="card-picker-slot-plus">+</span>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
