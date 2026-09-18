# MAIN Writing UI decisions

Applied canonical `ysu-ai-core/docs/SMALL_PROJECT_UI_STANDARD.md` v1.0 at Core revision `7a11fa58253cbd2e1587a97e01af15e054aec442`.

Preserve MAIN's existing blue accent, dark/light system preference, native HTML and Product layout. Writing adds a semantic editorial card in the same grid. Header spacing is compact (28px top, 24px below hero); owner Arrange is explicit and is the only place with drag guidance. Grips use 44px hit targets in Arrange mode.

Reader: native modal dialog, 52% black backdrop and 18px blur; 90% main surface and 86–90% reading panel with 20px blur. The paragraph measure is approximately 720px, 18px Georgia/serif with 1.85 line height. Interface text remains the system sans font. At 700px and below, reader and index become separate full-width states with Back to Articles. Desktop/tablet retain independently scrollable index and reader. The empty state is honest, without fabricated covers or articles.

Semantic colors reuse `--text`, `--text-dim`, `--accent`, `--card-border`; light-mode Writing links use #2469a8 for contrast. Avoid faint color for new body/date/control text. Native modal focus, Escape, focus return, scroll lock and reduced-motion overrides are maintained. Media has alt text and an explicit failure placeholder. No new fonts, UI framework, runtime package, or icon service.
