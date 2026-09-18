# MAIN Writing UI decisions

Applied canonical ysu-ai-core SMALL_PROJECT_UI_STANDARD v1.0, revision7a11fa58253cbd2e1587a97e01af15e054aec442.

Preserve MAIN blue identity, system sans font, light/dark semantic tokens and unchanged Product grid. Current Tracker, UMS and Capture live headers were inspected: left alignment, compact hierarchy and close subtitle spacing inform MAIN without copying their palettes. Header uses32px maximum title,14px subtitle,17px statistics and24px top padding. Home owner controls contain only Arrange cards.

Desktop native dialog: width min(880px,100vw -80px),86dvh height, centered18px radius. At1440x1000 the grid is1032px wide and dialog880x860 atx280/y70, leaving76px of each grid edge plus70px above/below. Background45% black with8px blur; actual QA found16px blur obscured background cards too heavily. Shell68% opacity with20px blur, index24%, reader88%. Sidebar170px; reader text measured~651px, max700px. System-sans body18px/1.65, paragraphs1em, title26–32px/1.22, metadata13px. No ebook serif or extra fonts.

At768px dialog688px wide with independent index/reader scrolling. At<=700px panel100vw/100dvh, separate list/reader, body17px/1.65, title27px. Owner editor shares reader,44px controls, labelled Markdown/metadata fields, collapsible body preview and inline/cover replacement. No rich-text CMS or homepage settings link.

Semantic colors reuse --text,--text-dim,--accent,--card-border; light Writing links#2469a8. Native Escape/focus return/scroll lock and reduced-motion support remain. Image alt/failure placeholders, no overflow and guest/logout controls were checked. Tests validate card count singular/plural and typography bounds; actual browser checks establish dimensions and appearance.

Writing v1.2 applies UI Standard1.0 at fresh Core57a69136b7473718dfcf26311ae801f033696f05. Body default18px/1.62 at all widths; controlled article sizes17/18/19/20 use1.65/1.62/1.6/1.58 respectively. This supersedes the old automatic17px mobile body rule. Compact44px B/I/H2/H3/Quote/Link controls wrap naturally; a labelled native17–20px selector controls the body only. Reuses fixed font, tokens, focus borders and existing expanded preview. No new dependencies.
