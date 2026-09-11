const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const baseUrl = "https://www.littlelambstories.com";
const dataContext = {};
dataContext.window = dataContext;
vm.runInNewContext(fs.readFileSync(path.join(root, "js", "data.js"), "utf8"), dataContext);
const data = dataContext.LLS;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function pageUrl(file) {
  const relative = path.relative(root, file).replace(/\\/g, "/");
  if (relative === "index.html") return baseUrl + "/";
  return baseUrl + "/" + relative;
}

function pageEpisode(file) {
  const relative = path.relative(root, file).replace(/\\/g, "/");
  if (!relative.startsWith("stories/") || !relative.endsWith(".html")) return null;
  const id = relative.slice("stories/".length, -".html".length);
  return data.episodes.find((episode) => episode.id === id) || null;
}

function seoBlock(file, html) {
  const canonical = pageUrl(file);
  const title = (html.match(/<title>([^<]*)<\/title>/i) || ["", "Little Lamb Stories"])[1];
  const description = (html.match(/<meta name="description" content="([^"]*)"/i) || ["", "Stories for families from Little Lamb Stories."])[1];
  const episode = pageEpisode(file);
  const image = baseUrl + "/assets/family-portrait.jpg";
  const icon = baseUrl + "/assets/site-icon.jpg";
  const graph = episode ? {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: episode.title,
    description: episode.synopsis,
    thumbnailUrl: ["https://img.youtube.com/vi/" + episode.youtubeId + "/hqdefault.jpg"],
    embedUrl: "https://www.youtube-nocookie.com/embed/" + episode.youtubeId,
    contentUrl: "https://www.youtube.com/watch?v=" + episode.youtubeId,
    uploadDate: episode.uploadDate,
    duration: episode.duration && episode.duration !== "0:00" ? "PT" + episode.duration.split(":")[0] + "M" + episode.duration.split(":")[1] + "S" : undefined,
    publisher: {
      "@type": "Organization",
      name: "Little Lamb Stories",
      url: baseUrl
    }
  } : {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Little Lamb Stories",
    url: baseUrl + "/",
    description: description,
    publisher: { "@type": "Organization", name: "Little Lamb Stories", url: baseUrl }
  };
  Object.keys(graph).forEach((key) => graph[key] === undefined && delete graph[key]);
  return "<!-- LLS SEO START -->\n" +
    "<link rel=\"icon\" type=\"image/jpeg\" href=\"" + icon + "\">\n" +
    "<link rel=\"apple-touch-icon\" href=\"" + icon + "\">\n" +
    "<link rel=\"canonical\" href=\"" + canonical + "\">\n" +
    "<meta property=\"og:type\" content=\"" + (episode ? "video.other" : "website") + "\">\n" +
    "<meta property=\"og:title\" content=\"" + escapeHtml(title) + "\">\n" +
    "<meta property=\"og:description\" content=\"" + escapeHtml(description) + "\">\n" +
    "<meta property=\"og:url\" content=\"" + canonical + "\">\n" +
    "<meta property=\"og:image\" content=\"" + (episode ? "https://img.youtube.com/vi/" + episode.youtubeId + "/hqdefault.jpg" : image) + "\">\n" +
    "<meta name=\"twitter:card\" content=\"summary_large_image\">\n" +
    "<script type=\"application/ld+json\">" + jsonLd(graph) + "</script>\n" +
    "<!-- LLS SEO END -->";
}

function htmlFiles(folder) {
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(folder, entry.name);
    return entry.isDirectory() ? htmlFiles(target) : entry.name.endsWith(".html") ? [target] : [];
  });
}

const files = htmlFiles(root);
for (const file of files) {
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(/\n?<!-- LLS SEO START -->[\s\S]*?<!-- LLS SEO END -->\n?/g, "\n");
  html = html.replace(/(\n\s*<link rel="stylesheet"[^>]+>)/i, "$1\n" + seoBlock(file, html));
  fs.writeFileSync(file, html);
}

const urls = files.map(pageUrl).sort();
const sitemap = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
  "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n" +
  urls.map((url) => "  <url><loc>" + url + "</loc></url>").join("\n") +
  "\n</urlset>\n";
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);
console.log("Generated SEO metadata for " + files.length + " pages and " + urls.length + " sitemap URLs.");
