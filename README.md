# Shirin Manzari

Personal website and blog built with Hugo.

## Local Development

```bash
hugo server
```

The English site is served at `/`; Persian content is served under `/fa/`.

## Production Build

```bash
hugo --gc --minify --cleanDestinationDir
```

The generated site is written to `public/`. Do not commit `public/`; GitHub Actions builds and deploys it.

## Creating A Post

English posts live in `content/en/blog/`.

Persian posts live in `content/fa/blog/`.

Example:

```yaml
---
title: "Post title"
date: 2026-06-04
description: "Short page description for SEO and listings."
slug: post-title
tags:
  - Personal
content_language: en
selected: false
draft: false
---
```

Use `content_language: fa` for Persian posts. Persian pages automatically render as RTL under `/fa/blog/`.

Set `selected: true` to show a post on the homepage under “Selected Posts”.

## Images

For global images, add files under `static/assets/images/` and reference them as:

```markdown
![Alt text](/assets/images/example.png)
```

For post-specific images, a Hugo page bundle is also fine:

```text
content/en/blog/my-post/
├── index.md
└── image.png
```

Then reference `image.png` from the post.

## Site Metadata And Links

Edit `hugo.yaml` for:

- site title and `baseURL`
- author name and email
- social links
- navigation menus
- language settings
- default descriptions and Open Graph image

## URL Compatibility

Legacy URLs are handled with Hugo aliases, including:

- `/blog.html`
- `/posts/why-you-wont-find-me-on-linkedin.html`
- `/posts/klidar-review.html`
- `/why-you-wont-find-me-on-linkedin/`

## Deployment

GitHub Pages deployment is configured in `.github/workflows/hugo.yaml`.

The workflow runs on pushes to `main` and on manual `workflow_dispatch`, builds with:

```bash
hugo --gc --minify --cleanDestinationDir --environment production
```

and deploys `./public` using GitHub Pages actions.

In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.
