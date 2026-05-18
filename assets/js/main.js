(function () {
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navList = document.querySelector("[data-nav-list]");

  if (navToggle && navList) {
    navToggle.addEventListener("click", () => {
      const isOpen = navList.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const yearTargets = document.querySelectorAll("[data-current-year]");
  yearTargets.forEach((target) => {
    target.textContent = new Date().getFullYear();
  });

  const params = new URLSearchParams(window.location.search);
  const tagFilter = params.get("tag");
  const archiveFilter = params.get("archive");
  const pageFilter = Number(params.get("page")) || 1;
  const postCards = Array.from(document.querySelectorAll("[data-post-tags]"));
  const pagination = document.querySelector("[data-pagination]");
  const archiveList = document.querySelector("[data-archive-list]");
  const postsPerPage = 5;

  if (postCards.length) {
    const formatMonth = (date) =>
      date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const getMonthKey = (dateTime) => dateTime.slice(0, 7);
    const buildBlogUrl = (nextParams) => {
      const query = nextParams.toString();
      return query ? `blog.html?${query}` : "blog.html";
    };

    if (archiveList) {
      const archives = new Map();

      postCards.forEach((card) => {
        const time = card.querySelector("time");

        if (!time) {
          return;
        }

        const monthKey = getMonthKey(time.dateTime);

        if (!archives.has(monthKey)) {
          archives.set(monthKey, formatMonth(new Date(`${monthKey}-01T00:00:00`)));
        }
      });

      const archiveLinks = Array.from(archives.entries()).map(([monthKey, label]) => {
        const nextParams = new URLSearchParams();
        nextParams.set("archive", monthKey);
        return `<li><a class="meta-link" href="${buildBlogUrl(nextParams)}">${label}</a></li>`;
      });

      archiveLinks.push('<li><a class="meta-link" href="blog.html">All posts</a></li>');
      archiveList.innerHTML = archiveLinks.join("");
    }

    const normalizedTag = tagFilter ? tagFilter.toLowerCase() : "";
    const filteredPosts = postCards.filter((card) => {
      const time = card.querySelector("time");
      const tags = card.dataset.postTags
        .split(",")
        .map((tag) => tag.trim().toLowerCase());
      const tagMatches = tagFilter ? tags.includes(normalizedTag) : true;
      const archiveMatches = archiveFilter && time
        ? getMonthKey(time.dateTime) === archiveFilter
        : true;

      return tagMatches && archiveMatches;
    });
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    const currentPage = Math.min(Math.max(pageFilter, 1), Math.max(totalPages, 1));
    const startIndex = (currentPage - 1) * postsPerPage;
    const pagePosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

    postCards.forEach((card) => {
      card.hidden = !pagePosts.includes(card);
    });

    const blogTitle = document.querySelector("[data-blog-title]");

    if (archiveFilter && blogTitle) {
      blogTitle.textContent = formatMonth(new Date(`${archiveFilter}-01T00:00:00`));
    }

    if (pagination && totalPages > 1) {
      const buildPageUrl = (page) => {
        const nextParams = new URLSearchParams();

        if (tagFilter) {
          nextParams.set("tag", tagFilter);
        }

        if (archiveFilter) {
          nextParams.set("archive", archiveFilter);
        }

        if (page > 1) {
          nextParams.set("page", String(page));
        }

        return buildBlogUrl(nextParams);
      };

      const links = [
        `<a href="${buildPageUrl(currentPage - 1)}" aria-label="Previous page" ${currentPage === 1 ? 'aria-disabled="true"' : ""}>&lt;</a>`,
      ];

      for (let page = 1; page <= totalPages; page += 1) {
        links.push(`<a href="${buildPageUrl(page)}" ${page === currentPage ? 'aria-current="page"' : ""}>${page}</a>`);
      }

      links.push(`<a href="${buildPageUrl(currentPage + 1)}" aria-label="Next page" ${currentPage === totalPages ? 'aria-disabled="true"' : ""}>&gt;</a>`);
      pagination.innerHTML = links.join("");
    }
  }
})();
