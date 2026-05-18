const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const contentDir = path.join(rootDir, "content", "posts");
const postsDir = path.join(rootDir, "posts");

const site = {
  author: "Shirin Manzari",
  email: "shirin.manzari@gmail.com",
  title: "The Grimoire🍀",
  intro:
    "A growing tome of knowledge, spells, and strange discoveries from a tiefling druid exploring the digital wilds.",
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function markdownInlineToHtml(value) {
  return escapeHtml(value).replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_match, label, href) =>
      `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`
  );
}

function markdownImageToHtml(value) {
  const markdownMatch = value.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);

  if (markdownMatch) {
    const alt = escapeHtml(markdownMatch[1]);
    const src = escapeHtml(markdownMatch[2]);
    return `<figure><img src="${src}" alt="${alt}"></figure>`;
  }

  const obsidianMatch = value.match(/^!\[\[([^\]]+)\]\]$/);

  if (obsidianMatch) {
    const fileName = obsidianMatch[1].trim();
    const alt = escapeHtml(path.parse(fileName).name);
    const src = escapeHtml(`../assets/images/posts/${fileName}`);
    return `<figure><img src="${src}" alt="${alt}"></figure>`;
  }

  return null;
}

function parseFrontMatter(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

  if (!match) {
    throw new Error(`${file} is missing front matter`);
  }

  const data = {};
  match[1].split(/\r?\n/).forEach((line) => {
    const separator = line.indexOf(":");

    if (separator === -1) {
      return;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    data[key] = value;
  });

  return { data, body: match[2].trim() };
}

function markdownToHtml(markdown) {
  const html = [];
  let paragraphLines = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) {
      return;
    }

    html.push(`<p>${markdownInlineToHtml(paragraphLines.join(" "))}</p>`);
    paragraphLines = [];
  };

  markdown.split(/\r?\n/).forEach((line) => {
    const text = line.trim();

    if (!text) {
      flushParagraph();
      return;
    }

    const imageHtml = markdownImageToHtml(text);

    if (imageHtml) {
      flushParagraph();
      html.push(imageHtml);
      return;
    }

    if (text.startsWith("### ")) {
      flushParagraph();
      html.push(`<h3>${markdownInlineToHtml(text.slice(4))}</h3>`);
      return;
    }

    if (text.startsWith("## ")) {
      flushParagraph();
      html.push(`<h2>${markdownInlineToHtml(text.slice(3))}</h2>`);
      return;
    }

    if (text.startsWith("# ")) {
      flushParagraph();
      html.push(`<h2>${markdownInlineToHtml(text.slice(2))}</h2>`);
      return;
    }

    paragraphLines.push(text);
  });

  flushParagraph();

  return html.join("\n        ");
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function readPosts() {
  return fs
    .readdirSync(contentDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const fullPath = path.join(contentDir, file);
      const { data, body } = parseFrontMatter(
        fs.readFileSync(fullPath, "utf8"),
        file
      );
      const required = ["title", "slug", "date", "description", "excerpt", "tags"];

      required.forEach((key) => {
        if (!data[key]) {
          throw new Error(`${file} is missing "${key}"`);
        }
      });

      const tags = data.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
      const lang = data.lang || "en";

      return {
        ...data,
        tags,
        lang,
        isRtl: lang === "fa",
        bodyHtml: markdownToHtml(body),
        url: `posts/${data.slug}.html`,
        fileName: `${data.slug}.html`,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

function header(prefix = "", current = "blog") {
  return `<header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="${prefix}index.html" aria-label="Home">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>${site.author}</span>
      </a>
      <nav class="site-nav" aria-label="Main navigation">
        <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="main-nav">Menu</button>
        <ul class="nav-list" id="main-nav" data-nav-list>
          <li><a href="${prefix}index.html"${current === "home" ? ' aria-current="page"' : ""}>Home</a></li>
          <li><a href="${prefix}blog.html"${current === "blog" ? ' aria-current="page"' : ""}>Blog</a></li>
          <li><a href="${prefix}resume.html">Resume</a></li>
          <li><a href="mailto:${site.email}">Email</a></li>
        </ul>
      </nav>
    </div>
  </header>`;
}

function footer(prefix = "") {
  return `<footer class="site-footer">
    <div class="container footer-inner">
      <p>© <span data-current-year></span> ${site.author}</p>
    </div>
  </footer>

  <script src="${prefix}assets/js/main.js"></script>`;
}

function renderBlog(posts) {
  const cards = posts
    .map((post) => {
      const cardClass = post.isRtl ? "post-card post-card-rtl" : "post-card";
      const attrs = post.isRtl ? ' lang="fa" dir="rtl"' : "";
      const readMore = post.isRtl ? "ادامه مطلب" : "Read more";

      return `<article class="${cardClass}"${attrs} data-post-tags="${escapeHtml(post.tags.join(", "))}">
              <p class="post-meta"><time datetime="${post.date}">${formatDate(post.date)}</time></p>
              <h3 class="post-title"><a href="${post.url}">${escapeHtml(post.title)}</a></h3>
              <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
              <a class="post-link" href="${post.url}">${readMore}</a>
            </article>`;
    })
    .join("\n\n            ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(site.intro)}">
  <title>Blog — ${site.author}</title>
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>

  ${header()}

  <main id="main" class="page">
    <div class="container-wide">
      <header class="page-header">
        <h1 class="page-title" data-blog-title>${site.title}</h1>
        <p class="page-intro" data-blog-intro>${site.intro}</p>
      </header>

      <div class="blog-layout">
        <section>
          <div class="post-list">
            ${cards}
          </div>
          <nav class="pagination" data-pagination aria-label="Blog pagination"></nav>
        </section>

        <aside class="sidebar" aria-label="Blog sidebar">
          <section class="side-box" aria-labelledby="archive-title">
            <h2 class="side-title" id="archive-title">Grimoire Archives</h2>
            <ul class="side-list" data-archive-list>
            </ul>
          </section>

          <section class="side-box" aria-labelledby="links-title">
            <h2 class="side-title" id="links-title">Mystic Paths</h2>
            <ul class="side-list">
              <li><a class="meta-link" target="_blank" href="https://nooshdaroo.ir/tag/زنان-و-فناوری/">Woman and Tech</a></li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  </main>

  ${footer()}
</body>
</html>
`;
}

function renderPost(post) {
  const htmlAttrs = post.isRtl ? ' lang="fa"' : ' lang="en"';
  const mainClass = post.isRtl ? "article-wrap article-rtl" : "article-wrap";
  const tags = post.tags
    .map((tag) => `<a href="../blog.html?tag=${encodeURIComponent(tag)}">${escapeHtml(tag)}</a>`)
    .join(", ");

  return `<!DOCTYPE html>
<html${htmlAttrs}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(post.description)}">
  <title>${escapeHtml(post.title)} — ${site.author}</title>
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>

  ${header("../")}

  <main id="main" class="${mainClass}">
    <article>
      <header class="article-header">
        <a class="back-link" href="../blog.html">← Back to blog</a>
        <h1 class="article-title">${escapeHtml(post.title)}</h1>
        <p class="article-summary">${escapeHtml(post.excerpt)}</p>
        <p class="post-meta"><time datetime="${post.date}">${formatDate(post.date)}</time></p>
      </header>

      <div class="article-content">
        ${post.bodyHtml}
      </div>
      <p class="post-tags"><span>Tags:</span> ${tags}</p>
    </article>

  </main>

  ${footer("../")}
</body>
</html>
`;
}

function main() {
  const posts = readPosts();

  fs.mkdirSync(postsDir, { recursive: true });
  fs.writeFileSync(path.join(rootDir, "blog.html"), renderBlog(posts));

  posts.forEach((post) => {
    fs.writeFileSync(path.join(postsDir, post.fileName), renderPost(post));
  });

  console.log(`Generated blog.html and ${posts.length} post page(s).`);
}

main();
