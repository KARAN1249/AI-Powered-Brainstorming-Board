# AI-Powered Brainstorming Board - Design Guidelines

## Design Approach

**Reference-Based Approach** drawing from Notion and Trello's clean, productivity-focused interfaces with modern AI-enhanced elements. The design balances familiar kanban patterns with intelligent visual cues for AI features.

**Core Principle:** Create a calm, focused environment for brainstorming where AI features enhance rather than distract from the creative process.

---

## Color Palette

**Dark Mode (Primary):**
- Background: 220 15% 12% (deep slate)
- Surface: 220 15% 18% (card backgrounds)
- Surface Elevated: 220 15% 22% (elevated cards, modals)
- Primary: 210 100% 60% (bright blue for CTAs, active states)
- Primary Muted: 210 70% 50% (hover states)
- AI Accent: 270 75% 65% (purple for AI features, suggestions)
- Success: 142 71% 45% (clustering, confirmations)
- Text Primary: 220 15% 95%
- Text Secondary: 220 10% 70%
- Border: 220 15% 28%

**Light Mode:**
- Background: 220 20% 98%
- Surface: 0 0% 100%
- Surface Elevated: 220 15% 96%
- Primary: 210 100% 50%
- AI Accent: 270 65% 55%
- Text Primary: 220 25% 15%
- Text Secondary: 220 15% 45%
- Border: 220 15% 88%

**Cluster Colors (for AI grouping):**
- Cluster 1: 340 75% 60% (coral)
- Cluster 2: 195 85% 55% (cyan)
- Cluster 3: 280 70% 60% (purple)
- Cluster 4: 150 60% 50% (green)
- Cluster 5: 35 90% 60% (amber)

---

## Typography

**Font Stack:**
- Primary: 'Inter', system-ui, sans-serif (body text, UI)
- Mono: 'JetBrains Mono', 'Courier New', monospace (AI responses, technical text)

**Type Scale:**
- Hero/Board Title: text-3xl font-bold (30px)
- Section Headers: text-xl font-semibold (20px)
- Card Title: text-base font-medium (16px)
- Body Text: text-sm (14px)
- Meta/Helper: text-xs (12px)
- AI Suggestions: text-sm font-normal

---

## Layout System

**Spacing Units:** Standardized to 4, 8, 16, 24, 32, 48 (p-1, p-2, p-4, p-6, p-8, p-12)

**Grid Structure:**
- Three-column layout: Left Toolbar (280px) | Main Board (flex-1) | Right AI Panel (360px)
- Mobile: Stacked with collapsible panels
- Cards: min-w-[280px] max-w-[320px]
- Consistent gap-4 between columns, gap-3 between cards

**Container Constraints:**
- Max board width: No constraint (allows infinite horizontal scroll)
- Panel padding: p-6 for desktop, p-4 for mobile
- Card padding: p-4

---

## Component Library

### Left Toolbar
- Fixed width sidebar with subtle border-right
- Primary action button (Add Card) with icon at top
- Secondary actions (Cluster Ideas, Summarize) stacked below
- Visual hierarchy: Primary button elevated with primary color, secondary buttons outline style
- Dividers between action groups (border-t with subtle color)

### Main Board Area
- Horizontal scrolling kanban layout
- Columns: flex flex-col with min-w-[320px]
- Column headers: Sticky with background blur, clear title + card count
- Drag handles: Subtle grip icons, visible on hover
- Empty states: Centered illustrations with helpful text
- Drop zones: Dashed borders on drag-over (border-dashed border-2 border-primary/50)

### Card Components
**Base Card:**
- Rounded corners (rounded-lg), subtle shadow (shadow-sm)
- Hover state: Lift effect (shadow-md transform -translate-y-0.5)
- Border-left accent (4px) when clustered with cluster color
- Card header with grab handle (cursor-grab, active:cursor-grabbing)

**AI Suggestion Cards:**
- Distinguished with AI accent color border-left (border-l-4 border-ai-accent)
- Sparkle icon prefix
- "Add to board" button inline
- Subtle shimmer animation on appearance

**Clustered Cards:**
- Color-coded left border matching cluster
- Small cluster badge (pill shape) with cluster name
- Group visual indicator when viewing cluster mode

### Right AI Panel
- Sticky panel with overflow-y-auto
- Tabbed interface: "Summary" | "Suggestions" | "Insights"
- Summary display: Markdown-style with clear headings
- Suggestion queue: Chronological list with timestamp
- Loading states: Skeleton screens with shimmer effect

### Modals & Overlays
- Card edit modal: Centered with backdrop blur
- Confirmation dialogs: Simple with clear primary/secondary actions
- Toast notifications: Top-right position, auto-dismiss
- AI processing indicator: Subtle pulse animation on AI accent color

### Navigation & Controls
- Top app bar: Thin (h-14) with board title center, user menu right
- Search: Cmd+K accessible with subtle animation
- Keyboard shortcuts: Tooltip hints on hover
- Undo/Redo: Ghost buttons in top bar

---

## AI Visual Language

**AI Feature Indicators:**
- Sparkle icon (✨) prefix for AI-generated content
- Purple accent color (270 75% 65%) for all AI touchpoints
- Subtle gradient backgrounds for AI panels (from AI accent to transparent)
- Pulsing dot indicator when AI is processing
- Smooth fade-in animations (300ms) for AI suggestions

**Clustering Visualization:**
- Color-coded left borders on cards (4px solid)
- Cluster legend in collapsible section of right panel
- Optional: Connect cards in same cluster with subtle dotted lines
- Cluster tags with matching background color (10% opacity)

**Loading & Processing States:**
- Skeleton screens for content loading
- Circular progress for AI operations
- Micro-animations: Gentle pulse on AI processing
- Success states: Brief checkmark animation

---

## Interaction Patterns

**Drag & Drop:**
- Smooth transitions (150ms ease-out)
- Ghost card preview during drag
- Drop zone highlights with dashed border + color
- Haptic feedback-style animation on successful drop

**Hover States:**
- Cards: Subtle lift (2px) + increased shadow
- Buttons: Background opacity change (hover:bg-opacity-90)
- AI suggestions: Border glow effect

**Click/Tap Feedback:**
- Ripple effect on buttons (150ms)
- Active state: Slight scale down (scale-95)
- Success animations: Subtle bounce or checkmark

---

## Responsive Behavior

**Desktop (lg+):** Three-column layout as specified
**Tablet (md):** Collapsible left toolbar, board takes priority, right panel toggleable
**Mobile (sm):** 
- Single column view
- Bottom sheet for AI panel
- Floating action button for Add Card
- Simplified horizontal scroll for columns

---

## Images

**No hero images required.** This is a utility-focused application.

**Icon Usage:**
- Heroicons for UI elements (via CDN)
- Sparkle/AI indicators for AI features
- Drag handle icon (grip-vertical) for cards
- Cluster icons for visual grouping

**Illustration Needs:**
- Empty state illustration: Simple line art for "No cards yet"
- AI processing animation: Subtle animated dots or spinner
- Success states: Checkmark or confetti micro-animation

---

## Accessibility & Polish

- Consistent dark mode across all inputs and text fields
- Focus visible states with primary color ring (ring-2 ring-primary)
- ARIA labels for drag-drop operations
- Keyboard navigation: Arrow keys between cards, Enter to edit
- Reduced motion respect: Disable animations when prefers-reduced-motion is set
- Color contrast: All text meets WCAG AA standards (4.5:1 minimum)

---

## Animation Philosophy

**Use Sparingly:**
- Card transitions: Only during drag/drop (150ms)
- AI appearance: Gentle fade-in for suggestions (300ms)
- Panel toggles: Slide animation (200ms ease-out)
- Success states: Brief checkmark or pulse (400ms)
- **No:** Continuous animations, parallax, or distracting effects

**Performance:**
- Use transform and opacity for animations
- GPU acceleration with will-change for drag operations
- Debounce AI requests to prevent overloading