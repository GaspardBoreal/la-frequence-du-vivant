

# Fix desktop/tablet layout without touching mobile

## Problem

On desktop and tablet, the sticky tab bar is positioned at `top-[88px]` but the actual header height is only ~52px. This 36px mismatch causes:
- Content to scroll behind the tab bar and become unreadable
- The top of each tab's content to be partially hidden under the overlapping sticky elements

## Root cause

| Element | Current | Should be |
|---------|---------|-----------|
| Header | `sticky top-0`, actual height ~52px | No change needed |
| Tab bar | `sticky top-[88px]` | `sticky top-[52px]` (match real header height) |
| Main content padding | No specific top offset for desktop | Needs none — sticky elements don't consume extra space |

The `top-[88px]` was likely set for a taller header that has since been condensed to a single compact line.

## Fix — single file edit

**File: `src/components/community/MonEspaceTabBar.tsx`** (line 69)

Change `top-[88px]` to `top-[52px]` to match the actual header height (py-2 = 16px + content ~36px).

This only affects the desktop/tablet `return` branch — mobile uses the fixed bottom nav and is untouched.

