# Blog playground design

For future posts with simple interactive playgrounds, follow the user-approved
tokenizer style in `assets/css/tokenizer.css` and
`layouts/shortcodes/tokenizer.html` unless the user requests a different design.

- Use a minimal white box in light mode, with a 1px border in the blog's `--soft`
  gray (`#8b8b8b`), 0.5rem rounded
  corners, and responsive padding (`clamp(0.85rem, 3vw, 1.25rem)`).
- Inherit the blog typography and content width. Keep the pink accent for focus
  and small interactive details; avoid decorative headers and heavy shadows.
- Use the blog's `--font-body` for Persian text everywhere in playgrounds,
  including inputs and generated results; avoid monospace overrides for Persian.
- Use a compact heading, simple inputs, and text-style example/reset buttons.
  Keep controls keyboard accessible with clear focus and adequate touch targets.
- Use the original soft pink, blue, green, and gold palette for colored results,
  with thin tinted borders and rounded corners, following the tokenizer reference.
  Keep token chips small and the surrounding results list borderless.
  Maintain readable text contrast in both themes.
  Put longer explanations in a native collapsible details section.
- Preserve readable dark-mode colors, mobile wrapping, accessible labels, and
  overflow protection for long text and code.
- Prefer reusable Hugo shortcodes with scoped CSS and JavaScript. Load assets
  only on posts using the component; lazy-load expensive dependencies when useful.
  Do not add a frontend framework for a simple playground.

The tokenizer can be reused with `{{< tokenizer >}}`; see `docs/tokenizer.md` for
its implementation and verification instructions. Adapt this visual style to each
new playground's purpose rather than copying tokenizer-specific controls or limits.
