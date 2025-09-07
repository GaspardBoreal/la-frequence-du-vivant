# Contrast-Force Hierarchy Design System

## Overview
The **Contrast-Force Hierarchy** (Hiérarchie Contrastée Forcée) is a design system established for vignette components that ensures maximum readability and visual hierarchy across different variants.

## Core Principles

### 1. Adaptive Contrast
- **Dark/Medium backgrounds**: Use `!text-white` for secondary information
- **Light backgrounds**: Use `text-slate-900` for secondary information
- **Force assertion**: Use `!` prefix to override conflicting styles

### 2. Triple Hierarchy Structure
1. **Main Title**: Thematic color + `font-bold`
2. **Secondary Information**: Pure white + `italic` (scientific names, subtitles)
3. **Status/Meta Information**: Light complementary color + `font-bold`

### 3. Variant-Specific Color Palette

#### Species Variant (`'species'`)
- **Container**: Green gradient (`success/10` to `success/5`)
- **Title**: `text-success font-bold`
- **Secondary**: `!text-white italic`
- **Status**: `text-success-light font-bold`
- **Badge**: `bg-success/10 text-success border-success/30`

#### Vocabulary Variant (`'vocabulary'`)
- **Container**: Blue gradient (`info/10` to `info/5`)
- **Title**: `text-info font-bold`
- **Secondary**: `!text-white italic`
- **Status**: `text-blue-200 font-bold`
- **Badge**: `bg-info/10 text-info border-info/30`

#### Infrastructure Variant (`'infrastructure'`)
- **Container**: Orange gradient (`warning/10` to `warning/5`)
- **Title**: `text-warning font-bold`
- **Secondary**: `!text-white italic`
- **Status**: `text-orange-200 font-bold`
- **Badge**: `bg-warning/10 text-warning border-warning/30`

#### Agro Variant (`'agro'`)
- **Container**: Accent gradient (`accent/10` to `accent/5`)
- **Title**: `text-accent font-bold`
- **Secondary**: `!text-white italic`
- **Status**: `text-accent-light font-bold`
- **Badge**: `bg-accent/10 text-accent border-accent/30`

#### Technology Variant (`'technology'`)
- **Container**: Purple gradient (`primary/10` to `primary/5`)
- **Title**: `text-primary font-bold`
- **Secondary**: `!text-white italic`
- **Status**: `text-violet-200 font-bold`
- **Badge**: `bg-primary/10 text-primary border-primary/30`

## Usage

### Import the utility
```typescript
import { getVignetteStyles, type VignetteVariant } from '@/utils/vignetteStyleUtils';
```

### Apply in component
```typescript
const styles = getVignetteStyles(variant);

// Use styles object
<Card className={styles.container}>
  <CardTitle className={styles.title}>Title</CardTitle>
  <p className={styles.secondary}>Secondary info</p>
  <p className={styles.status}>Status</p>
  <Badge className={styles.badge}>Type</Badge>
</Card>
```

## Implementation Guidelines

### DO ✅
- Always use the utility function for consistent styling
- Apply `!text-white` for secondary information on colored backgrounds
- Use semantic color tokens from the design system
- Maintain the triple hierarchy structure
- Use `font-bold` for titles and status, `italic` for scientific names

### DON'T ❌
- Hard-code color values directly in components
- Mix different styling approaches within the same component
- Override the established hierarchy without reason
- Use non-semantic color tokens

## Future Maintenance
- When adding new variants, follow the established pattern
- Ensure all `-200` color variants are available in the design system
- Test readability across all variants before deployment
- Update this documentation when extending the system