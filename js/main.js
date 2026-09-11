(function () {
  const path = location.pathname.replace(/\\/g, "/");

  function currentNav() {
    if (path.indexOf("/parents") !== -1) return "parents";
    if (path.indexOf("/categories/superheroes") !== -1) return "superheroes";
    if (path.indexOf("/categories/comedy") !== -1) return "comedy";
    if (path.indexOf("/categories/bedtime") !== -1) return "bedtime";
    if (path.indexOf("/categories/family") !== -1) return "family";
    if (path.indexOf("/categories/stories") !== -1 || path.indexOf("/stories/") !== -1) return "stories";
    return "home";
  }

  const nav = currentNav();
  const prefix = path.indexOf("/stories/") !== -1 || path.indexOf("/categories/") !== -1 ? "../" : "";
  const categoryOverrides = {
    KxWIEQOSJjw: ["superheroes", "family", "stories"],
    "5CqQXuFnTeY": ["superheroes", "family"],
    jTjP2MiicMQ: ["superheroes", "stories"],
    XAhg3qmfXN4: ["comedy", "stories", "family"],
    WSuCwSn86l4: ["stories", "family", "bedtime"],
    arU3IS8CWrM: ["stories", "family"],
    GDwgxDKUfOQ: ["family", "bedtime", "stories"]
  };
  function hasCategory(item, category) {
    var categories = categoryOverrides[item.youtubeId] || item.categories || [];
    var normalized = category.toLowerCase().replace(/[^a-z]/g, "");
    return categories.some(function (value) {
      return value.toLowerCase().replace(/[^a-z]/g, "") === normalized;
    });
  }
  function episodesByCategory(category) {
    return LLS.episodes.filter(function (item) { return hasCategory(item, category); });
  }
  function upcomingByCategory(category) {
    return LLS.upcoming.filter(function (item) { return hasCategory(item, category); });
  }

  const header = document.getElementById("site-header");
  if (header) {
    header.innerHTML =
      '<div class="wrap header-inner">' +
        '<a class="brand" href="' + prefix + 'index.html">' +
          '<svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true">' +
            '<circle cx="32" cy="32" r="30" fill="#efe6d6"/>' +
            '<ellipse cx="32" cy="36" rx="16" ry="14" fill="#fffdf8"/>' +
            '<circle cx="24" cy="24" r="8" fill="#fffdf8"/>' +
            '<circle cx="40" cy="24" r="8" fill="#fffdf8"/>' +
            '<circle cx="27" cy="33" r="2" fill="#4a3b32"/>' +
            '<circle cx="37" cy="33" r="2" fill="#4a3b32"/>' +
            '<path d="M30 39c2 2 4 2 6 0" stroke="#e07a5f" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
            '<circle cx="46" cy="22" r="4" fill="#e07a5f"/>' +
          '</svg>' +
          '<span class="brand-name">Little Lamb Stories</span>' +
        '</a>' +
        '<nav class="nav-main" id="nav-main">' +
          '<a href="' + prefix + 'categories/stories.html"' + (nav === "stories" ? ' aria-current="page"' : '') + '>Stories</a>' +
          '<a href="' + prefix + 'categories/superheroes.html"' + (nav === "superheroes" ? ' aria-current="page"' : '') + '>Superheroes</a>' +
          '<a href="' + prefix + 'categories/comedy.html"' + (nav === "comedy" ? ' aria-current="page"' : '') + '>Comedy</a>' +
          '<a href="' + prefix + 'categories/bedtime.html"' + (nav === "bedtime" ? ' aria-current="page"' : '') + '>Bedtime</a>' +
          '<a href="' + prefix + 'categories/family.html"' + (nav === "family" ? ' aria-current="page"' : '') + '>Family</a>' +
          '<a href="' + prefix + 'parents.html"' + (nav === "parents" ? ' aria-current="page"' : '') + '>For Parents</a>' +
        '</nav>' +
        '<div class="header-actions">' +
          '<a class="btn btn-coral" href="' + LLS.subscribeUrl + '" target="_blank" rel="noopener">Subscribe</a>' +
          '<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="nav-main"><span class="menu-icon" aria-hidden="true"><span></span><span></span><span></span></span><span class="menu-label">Menu</span></button>' +
        '</div>' +
      '</div>';
    const toggle = header.querySelector(".menu-toggle");
    const navEl = header.querySelector("#nav-main");
    toggle.addEventListener("click", function () {
      const open = navEl.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.innerHTML =
      '<div class="wrap footer-inner">' +
        '<p>Stories that warm hearts. Families that grow together.</p>' +
        '<div class="footer-links">' +
          '<a href="' + prefix + 'parents.html">For Parents</a>' +
          '<a href="' + prefix + 'privacy.html">Privacy</a>' +
          '<a href="' + LLS.channelUrl + '" target="_blank" rel="noopener">Watch on YouTube</a>' +
          '<a href="' + LLS.subscribeUrl + '" target="_blank" rel="noopener">Subscribe</a>' +
        '</div>' +
      '</div>';
  }

  const sub = document.getElementById("mobile-sub");
  if (sub) {
    sub.innerHTML = '<div class="wrap"><a class="btn btn-coral" style="width:100%" href="' + LLS.subscribeUrl + '" target="_blank" rel="noopener">Subscribe on YouTube</a></div>';
  }

  function cardHTML(ep, upcoming) {
    var destination = upcoming ? LLS.watch(ep.youtubeId) : prefix + "stories/" + ep.id + ".html";
    var label = upcoming ? "Premieres " + ep.premiereAt : (ep.audience === "together" ? "Watch together" : "For little ones");
    return (
      '<article class="card">' +
        '<a href="' + destination + '"' + (upcoming ? ' target="_blank" rel="noopener"' : '') + '>' +
          '<div class="thumb">' +
            '<img src="' + LLS.thumb(ep.youtubeId) + '" alt="">' +
            '<span class="duration">' + (upcoming ? "Premiere" : ep.duration) + '</span>' +
          '</div>' +
          '<div class="card-body">' +
            '<h3>' + ep.title + '</h3>' +
            '<div class="card-tags">' +
              '<span class="tag ' + (upcoming ? "premiere" : (ep.audience === "together" ? "together" : "kids")) + '">' + label + '</span>' +
              (ep.values[0] ? '<span class="tag">' + ep.values[0] + '</span>' : '') +
            '</div>' +
          '</div>' +
        '</a>' +
      '</article>'
    );
  }

  document.querySelectorAll("[data-shelf]").forEach(function (el) {
    const cat = el.getAttribute("data-shelf");
    const list = cat === "all" ? LLS.episodes : episodesByCategory(cat);
    el.innerHTML = list.map(function (ep) { return cardHTML(ep, false); }).join("");
  });

  document.querySelectorAll("[data-upcoming-shelf]").forEach(function (el) {
    var cat = el.getAttribute("data-upcoming-shelf");
    var list = cat === "all" ? LLS.upcoming : upcomingByCategory(cat);
    el.innerHTML = list.map(function (ep) { return cardHTML(ep, true); }).join("");
    var section = el.closest(".upcoming-section");
    if (section) section.hidden = list.length === 0;
  });

  const featured = document.getElementById("featured-story");
  if (featured) {
    const ep = LLS.episodes.find(function (e) { return e.featured; }) || LLS.episodes[0];
    featured.innerHTML =
      '<a class="featured-thumb" href="stories/' + ep.id + '.html">' +
        '<img src="' + LLS.thumb(ep.youtubeId) + '" alt="">' +
        '<div class="play-badge"><span>Play</span></div>' +
      '</a>' +
      '<div>' +
        '<p class="kicker">Featured story</p>' +
        '<h2>' + ep.title + '</h2>' +
        '<div class="meta-row"><span>' + ep.duration + '</span><span>Watch together</span></div>' +
        '<p>' + ep.synopsis + '</p>' +
        '<div class="cta-row">' +
          '<a class="btn btn-coral" href="' + LLS.watch(ep.youtubeId) + '" target="_blank" rel="noopener">Watch on YouTube</a>' +
          '<a class="btn btn-outline" href="stories/' + ep.id + '.html">Episode page</a>' +
        '</div>' +
      '</div>';
  }

  const grid = document.getElementById("category-grid");
  if (grid) {
    const cat = grid.getAttribute("data-category");
    var list = episodesByCategory(cat);
    function render(filter) {
      var items = list;
      if (filter === "together") items = list.filter(function (e) { return e.audience === "together"; });
      if (filter === "kids") items = list.filter(function (e) { return e.audience === "kids"; });
      if (filter === "short") items = list.filter(function (e) {
        var parts = e.duration.split(":");
        return Number(parts[0]) * 60 + Number(parts[1]) <= 180;
      });
      grid.innerHTML = items.map(function (ep) { return cardHTML(ep, false); }).join("") || "<p>No stories in this view yet.</p>";
    }
    render("all");
    var categoryUpcoming = upcomingByCategory(grid.getAttribute("data-category"));
    if (categoryUpcoming.length) {
      var upcomingSection = document.createElement("section");
      upcomingSection.className = "upcoming-section category-upcoming";
      upcomingSection.innerHTML = '<div class="shelf-head"><div><p class="kicker">Coming soon</p><h2>Premieres on YouTube</h2></div></div><div class="rail" data-upcoming-shelf="category"></div>';
      grid.parentNode.appendChild(upcomingSection);
      upcomingSection.querySelector("[data-upcoming-shelf]").innerHTML = categoryUpcoming.map(function (ep) { return cardHTML(ep, true); }).join("");
    }
    document.querySelectorAll(".filter-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        render(btn.getAttribute("data-filter"));
      });
    });
  }

  const episodeRoot = document.getElementById("episode-page");
  if (episodeRoot) {
    const id = episodeRoot.getAttribute("data-episode");
    const ep = LLS.byId(id);
    if (ep) {
      document.title = ep.title + " | Little Lamb Stories";
      var desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute("content", ep.synopsis);
      episodeRoot.querySelector("[data-title]").textContent = ep.title;
      episodeRoot.querySelector("[data-meta]").textContent =
        ep.duration + " | " + (ep.audience === "together" ? "Watch together" : "For little ones") + " | " + ep.values.join(", ");
      episodeRoot.querySelector("[data-synopsis]").textContent = ep.synopsis;
      episodeRoot.querySelector("[data-question]").textContent = ep.question;
      episodeRoot.querySelector("[data-watch]").href = LLS.watch(ep.youtubeId);
      episodeRoot.querySelector("[data-embed]").src = LLS.embed(ep.youtubeId);
      var next = episodeRoot.querySelector("[data-next]");
      var others = LLS.episodes.filter(function (e) { return e.id !== ep.id; }).slice(0, 4);
      next.innerHTML = others.map(function (item) { return cardHTML(item, false); }).join("");
    }
  }

  const guides = document.getElementById("episode-guides");
  if (guides) {
    guides.innerHTML = LLS.episodes.map(function (ep) {
      return "<tr>" +
        "<td><a href=\"stories/" + ep.id + ".html\"><strong>" + ep.title + "</strong></a><br>" + ep.duration + "</td>" +
        "<td>" + ep.values.join(", ") + "</td>" +
        "<td>" + ep.question + "</td>" +
        "<td class=\"guide-action\"><a class=\"btn btn-outline\" href=\"stories/" + ep.id + ".html\">Open guide</a></td>" +
      "</tr>";
    }).join("");
  }
})();
