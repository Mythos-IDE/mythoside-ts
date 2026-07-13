/**
 * @file icons.tsx
 * @input Uses lucide-react icon components, IconRegistry type
 * @output Exports neutralIconRegistry for the neutral theme
 * @position Icon configuration for the neutral theme; consumed by index.ts
 *
 * Maps semantic icon names to Lucide icon components.
 * These icons are bundled with the theme, not with @astryxdesign/core.
 */

import { createElement } from "react";
import type { IconRegistry } from "@astryxdesign/core/Icon";

import {
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  ExternalLink,
  Menu,
  MoreHorizontal,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  EyeOff,
  Columns,
  Copy,
  CheckCheck,
  Wrench,
  Square,
  Mic,
} from "lucide-react";

const iconProps = {
  size: "1em",
  "aria-hidden": true as const,
};

// Uses createElement() rather than JSX syntax: `astryx theme build` loads
// this file in a plain Node/esbuild context that doesn't apply this
// project's automatic JSX runtime, so bare `<X />` fails with "React is not
// defined" there even though it works fine in the Vite app build.
export const neutralIconRegistry: IconRegistry = {
  close: createElement(X, iconProps),
  chevronDown: createElement(ChevronDown, iconProps),
  chevronLeft: createElement(ChevronLeft, iconProps),
  chevronRight: createElement(ChevronRight, iconProps),
  check: createElement(Check, iconProps),
  success: createElement(CheckCircle, iconProps),
  error: createElement(XCircle, iconProps),
  warning: createElement(AlertTriangle, iconProps),
  info: createElement(Info, iconProps),
  calendar: createElement(Calendar, iconProps),
  clock: createElement(Clock, iconProps),
  externalLink: createElement(ExternalLink, iconProps),
  menu: createElement(Menu, iconProps),
  moreHorizontal: createElement(MoreHorizontal, iconProps),
  search: createElement(Search, iconProps),
  arrowUp: createElement(ArrowUp, iconProps),
  arrowDown: createElement(ArrowDown, iconProps),
  arrowsUpDown: createElement(ArrowUpDown, iconProps),
  funnel: createElement(Filter, iconProps),
  eyeSlash: createElement(EyeOff, iconProps),
  viewColumns: createElement(Columns, iconProps),
  copy: createElement(Copy, iconProps),
  checkDouble: createElement(CheckCheck, iconProps),
  wrench: createElement(Wrench, iconProps),
  stop: createElement(Square, iconProps),
  microphone: createElement(Mic, iconProps),
};
