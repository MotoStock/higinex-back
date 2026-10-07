/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Transform } from 'class-transformer';

type StringTransformOptions = {
  emptyToUndefined?: boolean;
};

function toUndefinedIfEmpty(value: unknown) {
  return typeof value === 'string' && value.length === 0 ? undefined : value;
}

export function Trim(options: StringTransformOptions = {}) {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;

    const trimmed = value.trim();
    const out = options.emptyToUndefined
      ? toUndefinedIfEmpty(trimmed)
      : trimmed;

    return out;
  });
}

export function LowerTrim(options: StringTransformOptions = {}) {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;

    const normalized = value.trim().toLowerCase();
    const out = options.emptyToUndefined
      ? toUndefinedIfEmpty(normalized)
      : normalized;

    return out;
  });
}
