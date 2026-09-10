const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const dataPath = path.join(root, "js", "data.js");
const storyTemplatePath = path.join(root, "stories", "integrity.html");
const apiKey = process.env.YOUTUBE_API_KEY;
const channelId = process.env.YOUTUBE_CHANNEL_ID;
const timeZone = process.env.YOUTUBE_TIME_ZONE || "Asia/Manila";
const categoryPlaylistMap = parseJsonEnv("YOUTUBE_CATEGORY_PLAYLISTS", {});
const categoryOverrides = {
  KxWIEQOSJjw: ["superheroes", "family", "stories"],
  "5CqQXuFnTeY": ["superheroes", "family"],
  jTjP2MiicMQ: ["superheroes", "stories"],
  XAhg3qmfXN4: ["comedy", "stories", "family"],
  WSuCwSn86l4: ["stories", "family", "bedtime"],
  arU3IS8CWrM: ["stories", "family"],
  GDwgxDKUfOQ: ["family", "bedtime", "stories"]
};

if (!apiKey || !channelId) {
  throw new Error("YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID are required");
}

function parseJsonEnv(name, fallback) {
  if (!process.env[name]) return fallback;
  try {
    return JSON.parse(process.env[name]);
  } catch (error) {
    throw new Error(name + " must contain valid JSON: " + error.message);
  }
}

function loadData() {
  const context = {};
  context.window = context;
  vm.runInNewContext(fs.readFileSync(dataPath, "utf8"), context, { filename: dataPath });
  return context.LLS;
}

async function youtube(resource, params) {
  const query = new URLSearchParams({ ...params, key: apiKey });
  const response = await fetch("https://www.googleapis.com/youtube/v3/" + resource + "?" + query);
  const body = await response.json();
  if (!response.ok) {
    throw new Error("YouTube API " + response.status + ": " + JSON.stringify(body));
  }
  return body;
}

async function listAll(resource, params) {
  const items = [];
  let pageToken = "";
  do {
    const body = await youtube(resource, { ...params, pageToken });
    items.push(...(body.items || []));
    pageToken = body.nextPageToken || "";
  } while (pageToken);
  return items;
}

function slugify(title, id) {
  const slug = title.toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
  return slug || "episode-" + id;
}

function duration(value) {
  if (!value) return "0:00";
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const seconds = Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
  return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
}

function premiereAt(value) {
  if (!value) return "Date to be announced";
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(new Date(value));
}

async function videosById(ids) {
  const videos = [];
  for (let index = 0; index < ids.length; index += 50) {
    const batch = ids.slice(index, index + 50);
    const body = await youtube("videos", { part: "snippet,contentDetails,liveStreamingDetails", id: batch.join(",") });
    videos.push(...(body.items || []));
  }
  return videos;
}

function categoriesFor(videoId, playlistItems, playlistNames) {
  if (categoryOverrides[videoId]) return categoryOverrides[videoId];
  const categories = [];
  for (const [category, playlistId] of Object.entries(categoryPlaylistMap)) {
    if (playlistItems[playlistId] && playlistItems[playlistId].has(videoId)) categories.push(category);
  }
  for (const item of playlistNames) {
    if (!item.videoIds.has(videoId)) continue;
    const name = item.title.toLowerCase();
    for (const category of ["stories", "superheroes", "comedy", "bedtime", "family"]) {
      if (name.includes(category)) categories.push(category);
    }
  }
  return [...new Set(categories)].length ? [...new Set(categories)] : ["stories"];
}

function descriptionFor(video) {
  const description = (video.snippet.description || "").replace(/\s+/g, " ").trim();
  return description.slice(0, 280) || "A new Little Lamb Stories episode for families to enjoy together.";
}

function toEpisode(video, categories, existing) {
  const old = existing.find((item) => item.youtubeId === video.id);
  const mergedCategories = [...new Set([...(old ? old.categories : []), ...categories])];
  return {
    id: old ? old.id : slugify(video.snippet.title, video.id),
    title: video.snippet.title,
    youtubeId: video.id,
    duration: duration(video.contentDetails.duration),
    audience: old ? old.audience : "together",
    categories: mergedCategories,
    values: old ? old.values : ["Family"],
    synopsis: old ? old.synopsis : descriptionFor(video),
    question: old ? old.question : "What did this story make you think about?",
    ...(old && old.featured ? { featured: true } : {})
  };
}

function writeData(data) {
  const source = "window.LLS = " + JSON.stringify(data, null, 2) + ";\n\n" +
    "LLS.thumb = function (id) {\n  return \"https://img.youtube.com/vi/\" + id + \"/hqdefault.jpg\";\n};\n" +
    "LLS.watch = function (id) {\n  return \"https://www.youtube.com/watch?v=\" + id;\n};\n" +
    "LLS.embed = function (id) {\n  return \"https://www.youtube.com/embed/\" + id;\n};\n" +
    "LLS.byId = function (id) {\n  return LLS.episodes.find(function (ep) { return ep.id === id; });\n};\n" +
    "LLS.byCategory = function (cat) {\n  return LLS.episodes.filter(function (ep) { return ep.categories.indexOf(cat) !== -1; });\n};\n" +
    "LLS.upcomingByCategory = function (cat) {\n  return LLS.upcoming.filter(function (ep) { return ep.categories.indexOf(cat) !== -1; });\n};\n";
  fs.writeFileSync(dataPath, source);
}

function createStoryPages(episodes) {
  const template = fs.readFileSync(storyTemplatePath, "utf8");
  for (const episode of episodes) {
    const target = path.join(root, "stories", episode.id + ".html");
    if (fs.existsSync(target)) continue;
    const page = template
      .replace(/<title>[^<]+<\/title>/, "<title>" + escapeHtml(episode.title) + " | Little Lamb Stories</title>")
      .replace(/<meta name="description" content="[^"]*">/, "<meta name=\"description\" content=\"" + escapeHtml(episode.synopsis) + "\">")
      .replace(/data-episode="integrity"/, "data-episode=\"" + episode.id + "\"");
    fs.writeFileSync(target, page);
  }
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function main() {
  const data = loadData();
  const playlists = await listAll("playlists", { part: "snippet", channelId, maxResults: "50" });
  const playlistNames = [];
  const playlistItems = {};
  for (const playlist of playlists) {
    const items = await listAll("playlistItems", { part: "snippet", playlistId: playlist.id, maxResults: "50" });
    const ids = new Set(items.map((item) => item.snippet.resourceId.videoId));
    playlistItems[playlist.id] = ids;
    playlistNames.push({ title: playlist.snippet.title, videoIds: ids });
  }

  const upcomingSearch = await listAll("search", {
    part: "snippet",
    channelId,
    eventType: "upcoming",
    type: "video",
    order: "date",
    maxResults: "50"
  });
  const uploadPlaylist = (await youtube("channels", { part: "contentDetails", id: channelId })).items[0].contentDetails.relatedPlaylists.uploads;
  const recentUploads = await listAll("playlistItems", { part: "snippet,contentDetails", playlistId: uploadPlaylist, maxResults: "50" });
  const ids = [...new Set([...upcomingSearch.map((item) => item.id.videoId), ...recentUploads.map((item) => item.contentDetails.videoId)])];
  const videos = await videosById(ids);
  const upcomingIds = new Set(upcomingSearch.map((item) => item.id.videoId));
  const existingEpisodes = data.episodes || [];
  const existingUpcoming = data.upcoming || [];
  const published = videos.filter((video) => !upcomingIds.has(video.id));
  const syncedEpisodes = published.map((video) => toEpisode(video, categoriesFor(video.id, playlistItems, playlistNames), existingEpisodes));
  const episodeById = new Map(existingEpisodes.map((item) => [item.youtubeId, item]));
  for (const episode of syncedEpisodes) episodeById.set(episode.youtubeId, episode);
  data.episodes = [...episodeById.values()];
  data.upcoming = videos.filter((video) => upcomingIds.has(video.id)).map((video) => {
    const old = existingUpcoming.find((item) => item.youtubeId === video.id);
    return {
    id: slugify(video.snippet.title, video.id),
    title: video.snippet.title,
    youtubeId: video.id,
    premiereAt: premiereAt(video.liveStreamingDetails && video.liveStreamingDetails.scheduledStartTime),
    categories: [...new Set([...(old ? old.categories : []), ...categoriesFor(video.id, playlistItems, playlistNames)])],
    values: old ? old.values : ["Family"]
    };
  });
  createStoryPages(data.episodes);
  writeData(data);
  console.log("Synced " + data.upcoming.length + " upcoming and " + data.episodes.length + " published episodes.");
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
