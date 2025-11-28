# Research Notes: Modern UI/UX Patterns for Data Visualization and Analysis Tools

## Executive Summary

Modern canvas-based data visualization tools universally favor **left sidebar + top toolbar combinations** with **progressive disclosure** patterns to balance feature richness with clean interfaces. The 2024-2025 trend emphasizes **flexible, collapsible panels**, **context-aware UI**, and **bottom-mounted timeline controls** for video/temporal data. Professional tools prioritize workspace over chrome, using **resizable panels that auto-hide** and **single primary actions per context** to maintain focus.

## Version Information

- **Research Date**: 2024-2025 (sources from late 2024 - early 2025)
- **Key Tools Analyzed**: Figma UI3 (2024), Miro Canvas SDK (2024), Power BI (2024), Tableau, DaVinci Resolve, PostHog, Amplitude, Mixpanel
- **Primary Sources**: 60+ authoritative articles from Nielsen Norman Group, Microsoft Learn, product documentation, UX research firms

## Navigation Patterns: Sidebar vs Top Nav

### When to Use Left Sidebar

**Best for:**

- Multi-section applications requiring persistent navigation
- Tools with hierarchical content organization
- Applications with 5+ distinct navigation items
- Desktop-first experiences

**Real-world examples:**

- **Canva**: Left sidebar categorizes design elements (templates, photos, text) that expand with many options when clicked
- **Notion**: Expandable sidebar sections that reveal only when needed, allowing users to focus on relevant content
- **Slack**: Accordion-style sidebar where sections expand only when selected to reduce visual clutter
- **Asana**: Collapsible project settings (Permissions, Integrations, Notifications) in sidebar format

**Key characteristics:**

- Vertical navigation provides straightforward access to different sections
- Fixed sidebars work best for desktop-heavy experiences
- Collapsible sidebars better for mobile-first or minimalistic UIs
- Sidebar navigation with clear task status views enhances workflow efficiency

**Sources:**

- [Dashboard UI Design Best Practices](https://www.transcenda.com/insights/data-visualization-ui-best-practices-and-winning-approaches)
- [Best Sidebar Menu Design Examples 2025](https://www.navbar.gallery/blog/best-side-bar-navigation-menu-design-examples)
- [Accordion UI Best Practices](https://www.eleken.co/blog-posts/accordion-ui)

### When to Use Top Navigation

**Best for:**

- Single-page applications with few top-level sections
- Horizontal workflows (e.g., multi-step processes)
- Applications emphasizing broad overview vs deep hierarchy
- Mobile-responsive designs where vertical space is premium

**Key characteristics:**

- Provides bird's-eye view of options
- Works well for 3-7 top-level navigation items
- Often combined with secondary navigation patterns

**Sources:**

- [Dashboard Design Patterns](https://www.justinmind.com/ui-design/dashboard-design-best-practices-ux)
- [Power BI Navigation Patterns](https://www.aufaitux.com/blog/power-bi-dashboard-design-best-practices/)

### Hybrid Approach (Left Sidebar + Top Toolbar) - RECOMMENDED FOR CANVAS TOOLS

**The winning pattern for canvas-based tools:**

- **Left sidebar**: Primary navigation, tool palette, feature access
- **Top toolbar**: Global actions, view controls, user settings
- **Bottom toolbar**: Timeline/playback controls (for temporal data)

**Real-world examples:**

- **Figma UI3 (2024 redesign)**: Moved design tools to bottom toolbar, freeing top space. Resizable panels with slim toolbar create roomier canvas feel. Panels auto-hide, appearing only when needed. "Focus the canvas less on the UI and more on your work"
- **Miro**: Infinite canvas with left-side tool access, top navigation for collaboration features, context-sensitive toolbars
- **DaVinci Resolve**: 7 dedicated "Pages" (workspaces) accessible via bottom tabs, each with specialized tools. Timeline at bottom with controls above it. Panels can show/hide via buttons above timeline
- **Power BI/Tableau**: Combination of vertical sidebar for data/field selection + top toolbar for visualization controls

**Canvas-based UI architecture (3-4 layer model):**

1. **Canvas layer**: Infinite workspace with grid/guides, zoom/pan controls
2. **Fixed UI ("chrome")**: Top-level access to specialized tools, shape libraries, data tools
3. **Contextual UI**: Appears near selected objects, context-dependent
4. **Modal UI**: Windows, modals, pop-ups on top of everything

**Sources:**

- [Figma UI3 Redesign Behind the Scenes](https://www.figma.com/blog/behind-our-redesign-ui3/)
- [Navigating Figma's New UI](https://help.figma.com/hc/en-us/articles/23954856027159-Navigating-UI3-Figma-s-new-UI)
- [Design for Canvas-Based Applications](https://lucid.co/techblog/2023/08/25/design-for-canvas-based-applications)
- [DaVinci Resolve Interface](https://2pop.calarts.edu/technicalsupport/davinci-resolve-interface/)

## Tool Palettes and Toolbars

### Best Practices for Tool Organization

**Positioning strategy:**

- **Left side**: Tool palette with icons (drawing tools, selection tools, shape tools)
- **Top**: Global actions (File, Edit, View), document-level controls
- **Bottom**: Timeline/playback controls for video/temporal tools, context-switching tabs (like Resolve's Pages)
- **Right side**: Properties panel, inspector, contextual settings for selected object

**Progressive disclosure for tools:**

- Show essential tools by default (select, draw, text)
- Advanced tools hidden in secondary menus or expandable sections
- Hover invitations and tooltips to indicate functionality
- Keyboard shortcuts for power users

**Key features (2024 standards):**

- **Expandable sections**: Accordions and dropdowns for scalability
- **Iconography**: Enhances readability and visual appeal
- **Responsiveness**: Works seamlessly across screen sizes
- **Context-aware design**: Adjusts based on page or user action
- **Snapping and guides**: Grid overlay, smart guides for alignment (toggleable)

**Sources:**

- [Canvas-Based UI Control Organization](https://lucid.co/techblog/2023/08/25/design-for-canvas-based-applications)
- [Power Apps Modernization 2024](https://www.microsoft.com/en-us/power-platform/blog/power-apps/march-2024-updates-for-modernization-and-theming-in-power-apps/)
- [UI/UX Design Principles](https://learn.microsoft.com/en-us/dynamics365/guidance/develop/ui-ux-design-principles)

## Timeline and Playback Controls

### Optimal Placement

**Bottom-mounted timeline (industry standard):**

- All professional video tools use bottom placement for timeline
- Editor timelines are universally left-to-right (even in RTL languages)
- Timeline positioned below main viewport/canvas
- Playback controls integrated directly into or above timeline

**Real-world implementations:**

**SyncSketch:**

- Timeline with frame-precise scrubbing (arrow keys nudge by one frame)
- Thumb controls for varying precision levels
- Annotations/comments associated with specific frames, clicking jumps to that frame
- Home/End keys jump to first/last frames

**Nuke Studio (Foundry):**

- Playhead indicator shows current frame in viewer
- Top half of timecode scale controls playhead, bottom half controls In/Out markers
- Playback Mode button toggles direction/repeat modes

**Mobile Video Editing (IMG.LY research):**

- Snapping to clips, playhead, start/end with animated dotted lines
- Haptic feedback for snapping events
- Timecode always rounds seconds down (if between seconds, show lower until crossing higher)
- Clear visual hierarchy: timeline, then playback controls, then editing tools

**X/Twitter video player (2024 update):**

- Transparent engagement buttons on lower playback window
- Metrics fade out during watching for clean full-screen experience
- Playback speed and volume controls integrated into player

**Sources:**

- [SyncSketch Timeline Controls](https://support.syncsketch.com/hc/en-us/articles/32393850754196-Timeline-Navigation-and-Playback-Controls)
- [Foundry Nuke Playback Tools](https://learn.foundry.com/nuke/content/timeline_environment/usingviewer/playback_tools.html)
- [Designing Timeline for Mobile Video Editing](https://img.ly/blog/designing-a-timeline-for-mobile-video-editing/)
- [X Video Playback UI Update](https://www.socialmediatoday.com/news/x-formerly-twitter-tests-updated-video-ui/745949/)

## Settings Organization Patterns

### Modal vs Sidebar vs Dedicated Page

**When to use MODALS:**

- Require immediate attention and action before proceeding
- Interrupt current task to catch full attention
- Simple, focused tasks (login, confirmation, quick form)
- **NOT recommended for**: Excessive content, multiple steps, mobile devices, settings management

**Characteristics:**

- Block primary screen (user cannot do anything else)
- Can be initiated by application
- Intrusive by design
- Poor mobile experience (take up screen space)

**When to use SIDEBAR/SLIDEOUT:**

- Non-urgent settings and preferences
- Maintaining context while showing additional info
- Presenting deeper content without breaking flow
- Consistent sizing requirements

**Characteristics:**

- Less intrusive, do not require immediate attention
- Can be initiated by user
- Consistent height/size vs modals with variable dimensions
- Do not require space all around like modals
- Better mobile experience than modals

**When to use DEDICATED PAGE:**

- Excessive content or settings
- Multiple steps or complex workflows
- Settings requiring persistent navigation across levels
- Deep hierarchical content

**RECOMMENDED for IGS-type tools:**
**Sidebar/slideout for settings** because:

- Maintains canvas context
- Non-blocking for user workflow
- Can show/hide as needed
- Consistent with canvas-based tool patterns

**Additional best practices:**

- Use persistent sidebar or tabs for main settings categories
- Implement breadcrumbs for deep navigation
- Highlight active section for clear position indication
- Test with users to determine optimal pattern

**Sources:**

- [Modal UX Design Patterns](https://blog.logrocket.com/ux-design/modal-ux-design-patterns-examples-best-practices/)
- [Sidebar Modal Pros & Cons](https://ux.stackexchange.com/questions/126274/sidebar-modal-pros-cons)
- [Modals, Sidebars, and Tooltips](https://betterprogramming.pub/modals-sidebars-tooltips-oh-my-36573209282c)
- [App Settings UI Design](https://www.setproduct.com/blog/settings-ui-design)

## Collapsible/Expandable Panels

### Design Patterns

**Collapsible Panels vs Accordions:**

- **Collapsible panels**: Multiple sections can be open simultaneously (more flexible)
- **Accordions**: Typically one section open at a time (more restrictive)
- Collapsible panels are "very space efficient as they are no larger than they have to be"

**Default state considerations:**

- Requires insight into user needs
- FAQ sections: Start collapsed (users can scan questions)
- Navigation menus: Expanded on desktop, collapsed on mobile
- Context determines optimal default

**Implementation features (2024 standards):**

- Smooth animations for expand/collapse
- ChevronRight indicators rotating on expand
- Border visual threading connecting parent to children
- Built with modern frameworks (React, shadcn/ui, Radix UI)
- TypeScript + Tailwind CSS for styling

**Real-world examples:**

- **Notion**: Sidebar sections expand only when needed
- **Slack**: Accordion menu sections expand only when selected
- **Asana**: Project settings (Permissions, Integrations, Notifications) collapsible

**Sources:**

- [Best Sidebar Menu Design Examples](https://www.navbar.gallery/blog/best-side-bar-navigation-menu-design-examples)
- [Collapsible Panels Pattern](http://www.welie.com/patterns/showPattern.php?patternID=collapsible-panels)
- [Accordion UI Examples](https://www.eleken.co/blog-posts/accordion-ui)
- [shadcn/ui Collapsible](https://ui.shadcn.com/docs/components/collapsible)

## Balancing Feature Discoverability with Clean UI

### The Core Tension

**Key insight:** 88% of users less likely to return after bad UX. Yet 70% of online businesses fail due to bad usability. Every $1 in UX brings $100 return (9,900% ROI).

**The challenge:**

- Discoverability: How easily users find features/functions
- Clean UI: Avoiding clutter, reducing cognitive load
- These are often in direct conflict

### Progressive Disclosure: The Primary Solution

**Definition:** "Initially, show users only a few of the most important options. Offer a larger set of specialized options upon request."

**Benefits:**

- Defers advanced/rarely used features to secondary screens
- Reduces cognitive load on current task
- Makes application easier to learn
- Less error-prone due to fewer distractions
- Lowers learning curve for new users

**Common UI patterns implementing progressive disclosure:**

1. **Accordions**: Collapsible sections, click header to expand/collapse
2. **Tabs**: Organize content across different panels
3. **Dropdown menus**: Appear on interaction with button/link
4. **Scrolling**: Users move through content at own pace
5. **Dialog boxes & popups**: Small windows on top of content
6. **Hover controls**: Hide nonessential info until hover
7. **"Show More" / "Advanced options"**: Explicit user request for additional features

**Real-world examples:**

**Airbnb:**

- Keeps search filters minimal at first
- Advanced options under "More filters"

**Adobe Photoshop:**

- Initial UI focuses on basic functionality
- Primary tools on left, selection controls at top, main panel on right
- Advanced features in secondary menus/windows
- Manages complexity while allowing new users easier grasp

**Google:**

- Minimalist homepage focusing on search bar
- Quick, distraction-free experience
- Primary feature gets full attention

**Print dialog:**

- Classic example: Small set of choices upfront (copies, printer)
- Advanced options hidden behind "More options" or similar

**Sources:**

- [Progressive Disclosure Definition](https://www.interaction-design.org/literature/topics/progressive-disclosure)
- [Nielsen Norman Group on Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [Discoverability UX Patterns](https://procreator.design/blog/optimized-discoverability-ux-patterns/)
- [Progressive Disclosure in Complex UI](https://medium.com/@marketingtd64/how-progressive-disclosure-simplifies-complex-ui-design-e799c76cfced)

### Potential Risks of Progressive Disclosure

**Lack of discoverability:**

- Users may assume if they can't see it, it doesn't exist
- Users may not hover/click if not seeing what they need
- Risk: users might not click "More options"

**Over-hiding:**

- Burying important features too deeply
- Interface appears too bare
- Fails purpose if essential insights are obscured

**Mitigation strategies:**

1. **Invitation patterns**:

   - Cursor invitation: Cue that object is interactive
   - Drop invitation: Indicate valid drop sites during drag-drop
   - Hover invitation: Cue what happens on click
   - Tooltip invitation: Explain action on hover

2. **Strategic balance**:

   - Prioritize what's initially presented vs hidden
   - Consider user needs and behavior patterns
   - Structure interfaces to facilitate exploration while maintaining clarity

3. **Staged disclosure (variant)**:
   - Step through linear sequence of options
   - Subset displayed at each step
   - Wizards are classic example

**Sources:**

- [Progressive Disclosure Risks](https://www.webfx.com/blog/web-design/progressive-disclosure-in-user-interfaces/)
- [Techniques for Optimized Discoverability](https://codewave.com/insights/techniques-in-ux-design/)

## Primary vs Secondary Actions Organization

### Button Hierarchy (2024 Standards)

**Classification:**

- **Primary buttons**: Highest emphasis, most important actions
- **Secondary buttons**: Medium emphasis, alternative actions
- **Tertiary buttons**: Lowest emphasis, less important actions

**Visual characteristics:**

**Primary:**

- Solid fill container
- Designed to draw attention
- One per view (unless multiple actions equally important)
- Guides users toward main action
- User most likely to select this option

**Secondary:**

- Outlined style (or lighter fill)
- Alternative or complementary options
- Important but not critical
- Work well alongside filled buttons
- Example: "Create account" on sign-in page

**Tertiary:**

- Filled tonal or text buttons
- No visible container in default state
- Appear in cards, dialogs, snack bars
- Don't distract from surrounding content
- Multiple options acceptable

### Positioning Best Practice

**Left-to-right priority:**

- Primary action FIRST (left position)
- Secondary actions to the right
- "Position items in context of use, from most likely to least likely"

**Visual differentiation:**

- Maintain 3:1 contrast ratio for buttons (minimum)
- 4.5:1 contrast for text (accessibility)
- Size, color, placement signal priority
- Consistent patterns across all screens

**Sources:**

- [Button Hierarchy Design](https://cieden.com/book/atoms/button/how-to-create-button-hierarchy)
- [Primary vs Secondary Buttons](https://www.acil.in/primary-secondary-action-buttons/)
- [Button Design Best Practices](https://balsamiq.com/learn/articles/button-design-best-practices/)
- [Primary vs Secondary CTA](https://designcourse.com/blog/post/primary-vs-secondary-cta-buttons-in-ui-design)

## Additional UI/UX Principles for Data Visualization Tools

### Consistency

- Icons, graph axes, colors always mean same thing
- Quick and simple visual navigation
- Consistent patterns for navigation, data labels, interaction states
- Improves usability and reduces confusion

### Avoid Clutter

- Remove features that don't serve purpose
- Every piece of screen real estate should contribute to clear visual logic
- Cluttered UI obscures essential insights
- Present complex data without creating cluttered interface

### Navigation Best Practices

**General principles:**

- Keep menu items clear, logically grouped, accessible
- Use fixed sidebar or top nav (users always know where they are)
- Minimize dropdowns and nested items
- Use breadcrumbs to help users retrace steps
- Smart categorization for complex dashboards
- "Navigation as a map: the more intuitive, the faster users reach destination"

**Filtering approaches:**

**Option 1: Full-page filter sidebar/bar**

- Affects entire page, all charts at once
- Keep filters always accessible
- Consider fixed header for easy initiation

**Option 2: Module-level filters**

- Smaller filter options inside each section
- Users can be specific per visualization
- Different filters per section (location, date range, etc.)

### Mobile Responsiveness

- Mobile design makes discoverability more challenging (limited screen real estate)
- Fixed sidebars don't work on mobile
- Collapsible navigation essential
- Progressive disclosure even more critical

**Sources:**

- [Data Visualization UI Best Practices](https://www.transcenda.com/insights/data-visualization-ui-best-practices-and-winning-approaches)
- [Dashboard Design Principles](https://www.justinmind.com/ui-design/dashboard-design-best-practices-ux)
- [Dashboard UX Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)

## Analytics Tools Comparison: PostHog vs Amplitude vs Mixpanel

### UI/UX Approach Differences

**Amplitude:**

- Comprehensive product analytics with detailed insights
- UI/toolset more geared toward marketing use cases
- Designed for non-technical users to self-serve analytics
- Behavioral Reports, Cohort Analysis, Retention Tracking
- Pathfinder visualizes user journeys
- Benefits: Reduces load on data science teams

**Mixpanel:**

- Focus on product analytics (deprecated A/B testing to specialize)
- Reporting emphasizes speed and accessibility
- Custom reports using JQL (JavaScript Query Language)
- Powerful funnel analysis with drop-off visualization
- Impact Reports show feature changes affecting behavior in real-time
- Simple conversion path measurement

**PostHog:**

- Ultimate developer platform, all customer data in one place
- Combines: Product analytics, Web analytics, Session replay, Feature flags, Error tracking, LLM analytics
- PostHog toolbar: View clickmaps, heatmaps, scrollmaps
- Custom SQL insights for power users
- Best for engineering-led companies
- Favors engineering and product teams over marketing

**Target audiences:**

- Amplitude: Large enterprises, marketing/growth teams
- Mixpanel: Mid-market, product teams focused on conversion
- PostHog: Engineering-focused startups/scale-ups, developer teams

**Sources:**

- [Amplitude vs Mixpanel vs PostHog](https://www.brainforge.ai/resources/amplitude-vs-mixpanel-vs-posthog)
- [PostHog vs Amplitude Comparison](https://posthog.com/blog/posthog-vs-amplitude)
- [PostHog vs Mixpanel Comparison](https://posthog.com/blog/posthog-vs-mixpanel)
- [Best Product Analytics Tools 2024](https://sequel.sh/blog/best-product-analytics-tools)

## Actionable Recommendations for IGS

Based on research into Figma, Miro, DaVinci Resolve, Power BI, and modern canvas-based tools:

### 1. Navigation Architecture

**Recommendation: Hybrid Left Sidebar + Top Toolbar + Bottom Timeline**

**Left Sidebar:**

- Primary feature access (Data Upload, Visualization Settings, Export)
- Collapsible sections using accordion pattern
- Tool palette for drawing/annotation tools (if applicable)
- File/project navigation
- Can collapse to icons-only for maximum canvas space

**Top Toolbar:**

- Global actions (File, Edit, View, Help)
- View controls (Zoom, Pan, Grid toggle)
- User account/settings
- Collaboration features (if any)
- Breadcrumbs for navigation context

**Bottom Timeline:**

- Playback controls integrated with timeline
- Frame-precise scrubbing
- Play/pause, speed controls
- Current timecode display
- In/Out markers for range selection

**Right Panel (Properties/Inspector):**

- Context-sensitive to selected object/user
- User details when user selected
- Datapoint properties when point selected
- Visualization settings when nothing selected
- Collapsible/hideable for full canvas view

### 2. Control Organization Strategy

**Primary actions (solid, prominent):**

- Upload Data
- Play/Pause animation
- Export visualization

**Secondary actions (outlined, less prominent):**

- Adjust animation speed
- Toggle display options (trails, labels, etc.)
- Filter data

**Tertiary actions (text/minimal):**

- Help/documentation
- Advanced settings
- Reset view

### 3. Settings Implementation

**Use slideout sidebar (NOT modal) for settings:**

- Maintains canvas context
- Non-blocking for workflow
- Slides in from right side
- Organized into collapsible sections:
  - Animation Settings (rate, smoothing)
  - Display Options (trails, labels, colors)
  - Video Sync
  - Export Settings

**Default states:**

- Commonly used settings expanded (Animation, Display)
- Advanced settings collapsed (Export options, Performance)
- Last user state can be remembered in localStorage

### 4. Progressive Disclosure Implementation

**Level 1 (Always visible):**

- Essential playback controls (play, pause, timeline scrubbing)
- Primary data view (movement visualization)
- Basic user controls

**Level 2 (One click away):**

- Animation speed adjustment
- Display toggles (show/hide trails, labels, floorplan)
- User filtering

**Level 3 (Advanced/rarely used):**

- CSV parsing options
- Performance tuning
- Advanced export settings
- Debug options

**Invitation patterns:**

- Tooltips on all controls (hover to see description)
- "Show more" expandable for advanced features
- Subtle visual cues (icons, chevrons) for expandable sections

### 5. Mobile/Responsive Considerations

**Desktop-first BUT responsive:**

- Sidebars become top/bottom slide-ins on mobile
- Timeline controls remain bottom-mounted
- Touch-friendly hit targets (min 44x44px)
- Simplified control set on mobile (progressive disclosure even more aggressive)

### 6. Specific UI Patterns to Adopt

**From Figma UI3:**

- Resizable panels that can be hidden entirely
- Slim toolbars that free up workspace
- Auto-hiding UI (only appears when needed)
- Focus on work, not chrome

**From DaVinci Resolve:**

- Page/mode switching for different workflows
- Timeline at bottom with integrated controls
- Panel toggle buttons for show/hide

**From Miro:**

- Infinite canvas feel with smooth zoom/pan
- Context-sensitive toolbars
- Grid/guides toggleable

**From Notion/Slack:**

- Expandable sidebar sections
- Clean accordion patterns
- Visual hierarchy with indentation

### 7. Timeline-Specific Recommendations

**Based on professional video tools:**

- Bottom-mounted (industry standard)
- Left-to-right progression
- Frame-precise scrubbing with keyboard shortcuts:
  - Left/Right arrows: Previous/next frame
  - Space: Play/pause
  - Home/End: Jump to start/end
- Snapping with visual/haptic feedback
- Timecode always visible, rounded down
- Markers for important events (conversation starts, etc.)
- Zoom controls for timeline (see more/less temporal detail)

### 8. Accessibility Considerations

**Contrast:**

- 3:1 minimum for UI controls
- 4.5:1 minimum for text
- Test with color blindness simulators

**Keyboard navigation:**

- All features accessible via keyboard
- Clear focus indicators
- Logical tab order

**Screen readers:**

- Proper ARIA labels
- Semantic HTML
- Alt text for icons

## Research Metadata

- **Date**: November 27, 2024
- **Sources Consulted**: 60+
- **Confidence Level**: High
- **Key Frameworks/Tools Analyzed**: Figma UI3, Miro, Canva, Power BI, Tableau, DaVinci Resolve, Premiere Pro, PostHog, Amplitude, Mixpanel, SyncSketch, Notion, Slack, Asana, Airbnb, Adobe Photoshop
- **Primary Research Sources**: Nielsen Norman Group (NN/g), Microsoft Learn, Interaction Design Foundation, product documentation, UX research firms, academic papers

## Additional Resources

### Official Documentation

- [Figma UI3 Redesign](https://www.figma.com/blog/behind-our-redesign-ui3/)
- [Miro Canvas SDK](https://outwitly.com/blog/miro-new-features-updates-ai-intelligent-canvas-innovation/)
- [Power BI Dashboard Design](https://www.aufaitux.com/blog/power-bi-dashboard-design-best-practices/)
- [DaVinci Resolve Interface](https://2pop.calarts.edu/technicalsupport/davinci-resolve-interface/)

### UX Research & Patterns

- [Nielsen Norman Group - Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [Interaction Design Foundation - Discoverability](https://www.interaction-design.org/literature/topics/discoverability)
- [Canvas-Based Application Design](https://lucid.co/techblog/2023/08/25/design-for-canvas-based-applications)

### Design Systems & Components

- [shadcn/ui Collapsible Components](https://ui.shadcn.com/docs/components/collapsible)
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/components/collapsible)
- [Microsoft Power Apps UI/UX Guidance](https://learn.microsoft.com/en-us/dynamics365/guidance/develop/ui-ux-design-principles)

### Best Practices Guides

- [Dashboard Design UX Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)
- [Button Hierarchy Design](https://cieden.com/book/atoms/button/how-to-create-button-hierarchy)
- [Modal UX Design Patterns](https://blog.logrocket.com/ux-design/modal-ux-design-patterns-examples-best-practices/)
- [Mobile Timeline Design](https://img.ly/blog/designing-a-timeline-for-mobile-video-editing/)

## Notes and Caveats

- Canvas-based tools universally prioritize workspace over UI chrome
- Progressive disclosure is the dominant pattern for managing complexity
- Bottom-mounted timeline is industry standard (not negotiable for video/temporal tools)
- Left sidebar + top toolbar is the de facto standard for professional tools
- Mobile responsiveness requires aggressive simplification of desktop patterns
- User testing should validate default expanded/collapsed states
- Accessibility cannot be an afterthought (build in from start)
- Performance critical for smooth animations and large datasets
- Consider implementing keyboard shortcuts for power users from day one
