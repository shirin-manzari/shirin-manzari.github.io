# How To Post

## 1. Create a new post file

Create a new Markdown file inside:

```text
content/en/blog/
```

Example:

```text
content/en/blog/my-new-post.md
```

You can also use Hugo:

```bash
hugo new blog/my-new-post.md
```

## 2. Add front matter

Put this at the top of the file:

```yaml
---
title: "My New Post"
date: 2026-09-17
description: "Short description for previews and SEO."
slug: my-new-post
tags:
  - Personal
  - Book
content_language: en
selected: false
draft: true
---
```

Use `draft: true` while writing.

Change it to this when the post is ready:

```yaml
draft: false
```

## 3. Write the post

Write your post below the front matter:

```markdown
This is the first paragraph of my post.

## A Section Title

More writing here.
```

## 4. Add images

Put images in:

```text
static/assets/images/
```

Use them like this:

```markdown
![Alt text](/assets/images/image-name.png)
```

## 5. Preview locally

Run:

```bash
hugo server
```

Open:

```text
http://localhost:1313/
```

To include draft posts in preview:

```bash
hugo server -D
```

## 6. Publish

When the post is ready:

```yaml
draft: false
```

Then commit and push your changes.

## External posts

For a post published on another site, create a normal post file with front matter like this:

```yaml
---
title: "My Post on Another Site"
date: 2026-09-17
description: "Short description."
slug: my-post-on-another-site
tags:
  - Personal
external_url: "https://example.com/my-post"
content_language: en
draft: false
---
```

This keeps the post in lists, archives, tags, and RSS, but the title links to the original site. If someone opens the local post URL directly, it redirects to `external_url`.
