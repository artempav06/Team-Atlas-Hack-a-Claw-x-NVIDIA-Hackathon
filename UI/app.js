const START_HOUR = 6;
const END_HOUR = 25;
const HOUR_HEIGHT = 64;
const MIN_EVENT_HEIGHT = 36;
const STORAGE_KEY = "atlas_frontend_session_v1";

const $ = (selector) => document.querySelector(selector);

// DEV FEATURES: flip these to false before the final demo, or comment out
// matching HTML blocks marked with data-dev-feature.
const DEV_FEATURES = {
  showSessionStats: true,
  showSessionControls: true,
  showBuildMyDay: true,
  showSuggestionReasoning: true,
  // DEV MODE: keep AI-generated card art blank until the image pipeline is ready.
  showCardImages: false
};

const today = new Date();
const todayIso = formatIsoDate(today);
const tomorrowIso = formatIsoDate(addDays(today, 1));

//These events are hardcoded for example purposes. In the real app, they would come from AI scraping.
const baseEvents = [
  {
    id: "real-hackaclaw-kickoff",
    title: "Hack-a-Claw build sprint",
    type: "real",
    source: "UCSC hackathon brief",
    sourceUrl: "https://www.soe.ucsc.edu/",
    date: todayIso,
    start: "18:00",
    end: "21:30",
    location: "Kresge Academic Building",
    distance: "0.4 mi",
    distanceMinutes: 8,
    summary: "NVIDIA builders, OpenClaw mentors, and student teams are all in one room. Best card if you want project feedback and people to build with.",
    tags: ["hackathon", "ai", "engineering", "networking", "nvidia", "free food"],
    category: "hackathon",
    vibe: "energetic",
    cost: "free",
    score: 94,
    route: ["Start at your college", "Walk toward Kresge", "Enter the Academic Building lobby"],
    imageHint: "glowing laptops, green server lights, campus builders"
  },
  {
    id: "real-ai-mixer",
    title: "AI Systems Research Mixer",
    type: "real",
    source: "Discord #campus-events",
    sourceUrl: "https://discord.com/channels/@me",
    date: todayIso,
    start: "19:00",
    end: "20:30",
    location: "Engineering 2",
    distance: "0.6 mi",
    distanceMinutes: 12,
    summary: "A compact mixer for students interested in robotics, LLM systems, and research labs. Strong match for technical networking without a huge crowd.",
    tags: ["ai", "research", "engineering", "robotics", "social"],
    category: "academic",
    vibe: "intellectual",
    cost: "free",
    score: 90,
    route: ["Cross Science Hill", "Pass Baskin Engineering", "Head into Engineering 2"],
    imageHint: "robot arm, green terminals, student posters"
  },
  {
    id: "real-resume-workshop",
    title: "Resume and Portfolio Workshop",
    type: "real",
    source: "Career newsletter",
    sourceUrl: "https://careers.ucsc.edu/",
    date: todayIso,
    start: "13:00",
    end: "14:30",
    location: "Baskin Engineering courtyard",
    distance: "0.5 mi",
    distanceMinutes: 10,
    summary: "Bring a laptop and tighten up your resume before internship season. Atlas is prioritizing this because it fits career goals and stays close to campus.",
    tags: ["career", "internship", "engineering", "portfolio", "workshop"],
    category: "career",
    vibe: "intellectual",
    cost: "free",
    score: 88,
    route: ["Walk to Baskin Engineering", "Use the courtyard entrance", "Look for the career table"],
    imageHint: "resume pages, courtyard tables, green highlighter"
  },
  {
    id: "real-board-games",
    title: "Board Game Night",
    type: "real",
    source: "Discord #social",
    sourceUrl: "https://discord.com/channels/@me",
    date: todayIso,
    start: "20:00",
    end: "22:00",
    location: "College Nine lounge",
    distance: "0.3 mi",
    distanceMinutes: 6,
    summary: "Low-pressure social time after the build sprint. Snacks, casual tables, and easy entry if you do not want a loud party night.",
    tags: ["social", "games", "food", "low-key", "night"],
    category: "social",
    vibe: "chill",
    cost: "free",
    score: 83,
    route: ["Head to College Nine", "Enter the main lounge", "Find the table games shelf"],
    imageHint: "pixel board games, snack table, cozy lounge"
  },
  {
    id: "real-student-startups",
    title: "Student Startup Pop-up",
    type: "real",
    source: "Campus events calendar",
    sourceUrl: "https://events.ucsc.edu/",
    date: todayIso,
    start: "15:00",
    end: "17:00",
    location: "Quarry Plaza",
    distance: "0.5 mi",
    distanceMinutes: 9,
    summary: "Student founders are showing projects and looking for collaborators. A good middle card between career networking and casual campus wandering.",
    tags: ["startups", "career", "networking", "engineering", "free food"],
    category: "career",
    vibe: "social",
    cost: "free",
    score: 86,
    route: ["Walk down toward Quarry Plaza", "Stay near the bookstore side", "Look for pop-up tables"],
    imageHint: "startup booths, campus plaza, green banners"
  },
  {
    id: "real-downtown-music",
    title: "Downtown Student Open Mic",
    type: "real",
    source: "Instagram public post",
    sourceUrl: "https://www.instagram.com/",
    date: todayIso,
    start: "21:00",
    end: "23:00",
    location: "Pacific Avenue",
    distance: "3.1 mi",
    distanceMinutes: 25,
    summary: "A later option if the user wants to get off campus. Atlas keeps it behind closer events unless the mood shifts toward music or downtown energy.",
    tags: ["music", "downtown", "social", "night", "arts"],
    category: "music",
    vibe: "energetic",
    cost: "$5",
    score: 72,
    route: ["Take the bus from campus", "Exit near Pacific Avenue", "Walk toward the open mic venue"],
    imageHint: "microphone, neon street, small crowd"
  },
  {
    id: "gen-power-nap",
    title: "20-minute power nap",
    type: "generated",
    source: "Atlas Suggestion",
    date: todayIso,
    start: "16:30",
    end: "17:00",
    location: "McHenry Library quiet couches",
    distance: "0.4 mi",
    distanceMinutes: 7,
    summary: "A short reset before evening events. Atlas occasionally inserts recovery cards so your planner does not become a pile of back-to-back obligations.",
    tags: ["wellness", "chill", "study", "rest", "nearby"],
    category: "wellness",
    vibe: "chill",
    cost: "free",
    score: 78,
    route: ["Walk to McHenry Library", "Go to the upper quiet floor", "Set a timer before you sit down"],
    imageHint: "quiet library couch, dim green lamp, backpack"
  },
  {
    id: "gen-pogonip-walk",
    title: "Pogonip golden-hour walk",
    type: "generated",
    source: "Atlas Suggestion",
    date: todayIso,
    start: "17:30",
    end: "18:45",
    location: "Pogonip trailhead",
    distance: "0.9 mi",
    distanceMinutes: 18,
    summary: "A flexible outdoor reset before the night gets busy. Best if the user asks for something quiet, nature-heavy, or away from screens.",
    tags: ["nature", "hike", "chill", "outdoors", "sunset"],
    category: "nature",
    vibe: "adventurous",
    cost: "free",
    score: 76,
    route: ["Start near campus edge", "Walk toward Golf Club Drive", "Take the lower Pogonip entrance"],
    imageHint: "redwood trail, sunset grass, tiny hiker"
  },
  {
    id: "gen-study-block",
    title: "Focused study block",
    type: "generated",
    source: "Atlas Suggestion",
    date: todayIso,
    start: "11:00",
    end: "12:30",
    location: "Science and Engineering Library",
    distance: "0.6 mi",
    distanceMinutes: 11,
    summary: "A clean 90-minute block to clear one assignment before the fun stuff. Atlas suggests it gently, then backs off if you keep rejecting study cards.",
    tags: ["study", "academic", "quiet", "productivity", "engineering"],
    category: "academic",
    vibe: "intellectual",
    cost: "free",
    score: 74,
    route: ["Walk to Science Hill", "Enter the library", "Pick a desk near an outlet"],
    imageHint: "quiet desk, open notebook, green monitor glow"
  },
  {
    id: "gen-sunset-coffee",
    title: "Sunset coffee decompression",
    type: "generated",
    source: "Atlas Suggestion",
    date: todayIso,
    start: "18:30",
    end: "19:15",
    location: "Porter Meadow edge",
    distance: "0.7 mi",
    distanceMinutes: 14,
    summary: "Grab a coffee and sit where the meadow opens toward the bay. A tiny plan, but exactly the sort of low-friction thing students forget to do.",
    tags: ["coffee", "sunset", "chill", "nature", "solo"],
    category: "wellness",
    vibe: "chill",
    cost: "$6",
    score: 73,
    route: ["Grab coffee nearby", "Walk toward Porter Meadow", "Sit near the west-facing edge"],
    imageHint: "coffee cup, meadow sunset, bay horizon"
  },
  {
    id: "real-figure-drawing",
    title: "Drop-in Figure Drawing",
    type: "real",
    source: "Arts department page",
    sourceUrl: "https://arts.ucsc.edu/",
    date: tomorrowIso,
    start: "19:00",
    end: "21:00",
    location: "Digital Arts Research Center",
    distance: "0.7 mi",
    distanceMinutes: 13,
    summary: "A calm arts card for variety. It stays lower in the queue unless the user accepts creative or chill events during the session.",
    tags: ["arts", "creative", "chill", "workshop", "evening"],
    category: "arts",
    vibe: "chill",
    cost: "free",
    score: 66,
    route: ["Walk to DARC", "Use the main studio entrance", "Bring a sketchbook if you have one"],
    imageHint: "studio easels, warm lights, pixel charcoal lines"
  }
];

const state = {
  allEvents: baseEvents,
  queue: [],
  accepted: [],
  rejected: [],
  history: [],
  selectedTags: new Set(),
  moodSignals: ["balanced"],
  hideGenerated: false,
  showTravel: false,
  learning: "Atlas is ready. Swipe to teach it what you like.",
  pendingConflictId: "",
  pendingConflictReason: "",
  errorNotice: "",
  selectedPlannerEventId: "",
  selectedSuggestionId: "",
  currentMotion: ""
};

function slugify(value) {
  return String(value || "event")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "event";
}

function clockFromDisplay(value) {
  const match = String(value || "").match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!match) return "";
  let hour = Number(match[1]);
  const minute = Number(match[2] || "0");
  const suffix = match[3].toUpperCase();
  if (suffix === "PM" && hour !== 12) hour += 12;
  if (suffix === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseBackendTimeRange(value) {
  const matches = [...String(value || "").matchAll(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/gi)];
  if (matches.length >= 2) {
    return [clockFromDisplay(matches[0][0]), clockFromDisplay(matches[1][0])];
  }
  if (matches.length === 1) {
    const start = clockFromDisplay(matches[0][0]);
    return [start, addClockMinutes(start, 60)];
  }
  return ["12:00", "13:00"];
}

function addClockMinutes(time, minutes) {
  const [hour, minute] = String(time || "12:00").split(":").map(Number);
  const total = (hour * 60 + minute + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function tagsFromBackend(value) {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function categoryFromTags(tags) {
  const joined = tags.join(" ");
  if (joined.includes("career") || joined.includes("internship") || joined.includes("startup")) return "career";
  if (joined.includes("ai") || joined.includes("research") || joined.includes("engineering")) return "academic";
  if (joined.includes("music")) return "music";
  if (joined.includes("wellness") || joined.includes("rest")) return "wellness";
  if (joined.includes("nature") || joined.includes("hike") || joined.includes("outdoors")) return "nature";
  if (joined.includes("art") || joined.includes("creative")) return "arts";
  return "social";
}

function normalizeBackendEvent(event, index) {
  const sourceInfo = typeof event.source === "object" && event.source ? event.source : {};
  const [timeStart, timeEnd] = parseBackendTimeRange(event.time || event.time_text);
  const parsedStart = event.start || event.start_time || timeStart;
  const parsedEnd = event.end || event.end_time || timeEnd || addClockMinutes(parsedStart, 60);
  const tags = tagsFromBackend(event.tags);
  const category = event.category || categoryFromTags(tags);
  const score = Number.isFinite(Number(event.score))
    ? Number(event.score)
    : Math.round(Number(event.confidence || 0.75) * 100);
  const distanceMinutes = Number(event.distanceMinutes || (8 + index * 3));

  return {
    id: event.id || `backend-${slugify(event.title)}-${index}`,
    title: event.title || "Campus event",
    type: event.type || "real",
    source: typeof event.source === "string"
      ? event.source
      : sourceInfo.channel_name || sourceInfo.type || "Campus Scout",
    sourceUrl: event.sourceUrl || sourceInfo.url || "#",
    date: event.date || todayIso,
    start: parsedStart || "12:00",
    end: parsedEnd || "13:00",
    location: event.location || "Campus",
    distance: event.distance || `${Math.max(0.2, Math.round((distanceMinutes / 20) * 10) / 10).toFixed(1)} mi`,
    distanceMinutes,
    summary: event.summary || event.description || "Clean event candidate returned by the Atlas backend.",
    tags: tags.length ? tags : ["campus"],
    category,
    vibe: event.vibe || (category === "career" || category === "academic" ? "intellectual" : "social"),
    cost: event.cost || "free",
    score,
    route: Array.isArray(event.route) && event.route.length
      ? event.route
      : [`Head toward ${event.location || "campus"}`, "Check the event source for final room details"],
    imageHint: event.imageHint || `${event.title || "campus event"} in NVIDIA green pixel art`
  };
}

async function loadBackendEventsIfAvailable() {
  const endpoints = ["/api/scout/run"];
  if (window.location.port && window.location.port !== "8080") {
    endpoints.push("http://127.0.0.1:8080/api/scout/run");
  }

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { method: "POST" });
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("application/json")) continue;
      const payload = await response.json();
      if (!Array.isArray(payload.events) || payload.events.length === 0) continue;
      state.allEvents = payload.events.map(normalizeBackendEvent);
      state.learning = `Loaded ${state.allEvents.length} Campus Scout events from the backend.`;
      return true;
    } catch {
      // Static-file mode is allowed; Atlas falls back to built-in demo cards.
    }
  }
  return false;
}

function formatIsoDate(date) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const normalizedHours = hours < START_HOUR ? hours + 24 : hours;
  return normalizedHours * 60 + minutes;
}

function formatDisplayDate(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

function formatTimeRange(event) {
  return `${toDisplayTime(event.start)} - ${toDisplayTime(event.end)}`;
}

function formatCompactTimeRange(event) {
  return `${toCompactDisplayTime(event.start)} - ${toCompactDisplayTime(event.end)}`;
}

function toDisplayTime(time) {
  const [rawHour, minute] = time.split(":").map(Number);
  const hour = rawHour % 24;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function toCompactDisplayTime(time) {
  const [rawHour, minute] = time.split(":").map(Number);
  const hour = rawHour % 24;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return minute === 0 ? `${displayHour} ${suffix}` : `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function eventDurationMinutes(event) {
  return Math.max(30, timeToMinutes(event.end) - timeToMinutes(event.start));
}

function hashString(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = Math.imul(value + 0x6d2b79f5, 1);
    let next = value;
    next ^= next >>> 15;
    next = Math.imul(next, next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function paletteFor(event) {
  const palettes = {
    hackathon: ["#111710", "#1d361a", "#76f000", "#c6a75a", "#6ec6ff"],
    academic: ["#0f1418", "#1c2b34", "#76f000", "#c6a75a", "#d8e3ff"],
    career: ["#171711", "#303018", "#76f000", "#c6a75a", "#f5f5db"],
    social: ["#151117", "#302039", "#76f000", "#c6a75a", "#ff74a8"],
    music: ["#120f16", "#261136", "#76f000", "#c6a75a", "#ff4e4e"],
    wellness: ["#101713", "#18382a", "#76f000", "#c6a75a", "#b6ffd1"],
    nature: ["#0f1710", "#254b25", "#76f000", "#c6a75a", "#87c96b"],
    arts: ["#171217", "#342336", "#76f000", "#c6a75a", "#ffb4e0"]
  };
  return palettes[event.category] || palettes.social;
}

function makePixelPoster(event, small = false) {
  const palette = paletteFor(event);
  const random = seeded(hashString(event.id + event.imageHint));
  const rows = small ? 8 : 10;
  const cols = 16;
  let cells = "";

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      let color = palette[0];
      const center = Math.abs(x - cols / 2);

      if (y < rows * 0.34) color = random() > 0.18 ? palette[1] : palette[0];
      if (y >= rows * 0.34 && y < rows * 0.7) color = random() > 0.72 ? palette[2] : palette[1];
      if (y >= rows * 0.7) color = random() > 0.5 ? palette[3] : palette[0];
      if (center < 2.2 && y > rows * 0.32 && y < rows * 0.72) color = random() > 0.28 ? palette[2] : palette[4];
      if ((x === 2 || x === 13) && y > rows * 0.44) color = palette[3];
      if (event.type === "generated" && x > 11 && y < 3) color = palette[2];

      cells += `<span class="pixel-cell" style="background:${color}"></span>`;
    }
  }

  return `<div class="pixel-poster" aria-label="${escapeHtml(event.imageHint)}">${cells}</div>`;
}

function cardPosterHtml(event, small = false) {
  if (DEV_FEATURES.showCardImages) return makePixelPoster(event, small);
  return `<div class="pixel-poster blank-poster${small ? " is-small" : ""}" aria-hidden="true"></div>`;
}

function loadSession() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const byId = new Map(state.allEvents.map((event) => [event.id, event]));
    state.accepted = (stored.accepted || []).map((id) => byId.get(id)).filter(Boolean);
    state.rejected = (stored.rejected || []).map((id) => byId.get(id)).filter(Boolean);
    state.history = Array.isArray(stored.history) ? stored.history.filter((item) => byId.has(item.id)) : [];
    state.hideGenerated = false;
    state.showTravel = Boolean(stored.showTravel);
    state.moodSignals = Array.isArray(stored.moodSignals) && stored.moodSignals.length ? stored.moodSignals : ["balanced"];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveSession() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    accepted: state.accepted.map((event) => event.id),
    rejected: state.rejected.map((event) => event.id),
    history: state.history,
    hideGenerated: state.hideGenerated,
    showTravel: state.showTravel,
    moodSignals: state.moodSignals
  }));
}

function resetSession() {
  state.accepted = [];
  state.rejected = [];
  state.history = [];
  state.selectedTags.clear();
  state.hideGenerated = false;
  state.showTravel = false;
  state.moodSignals = ["balanced"];
  state.pendingConflictId = "";
  state.pendingConflictReason = "";
  state.errorNotice = "";
  state.selectedPlannerEventId = "";
  state.learning = "Session reset. Atlas is ready for a fresh swipe run.";
  localStorage.removeItem(STORAGE_KEY);
  $("#filterToggle").checked = false;
  $("#tagDropdown").hidden = true;
  $("#tagSearch").value = "";
  buildQueue();
  render();
}

function tripEstimate(event) {
  return `${event.distance} / about ${event.distanceMinutes} min`;
}

function transportFor(event) {
  return event.distanceMinutes > 18 ? "bus" : "walk";
}

function travelMinutesFor(event) {
  return Math.max(5, Math.min(30, Math.ceil(event.distanceMinutes / 5) * 5));
}

function distanceMiles(event) {
  const match = String(event.distance || "").match(/[\d.]+/);
  if (match) return Number(match[0]);
  return Math.max(0.2, event.distanceMinutes / 20);
}

function formatMiles(value) {
  const rounded = Math.max(0.1, Math.round(value * 10) / 10);
  return `${rounded.toFixed(rounded >= 10 ? 0 : 1)} mi`;
}

function estimateTravelBetween(fromEvent, toEvent) {
  const fromMiles = distanceMiles(fromEvent);
  const toMiles = distanceMiles(toEvent);
  const directMiles = Math.max(0.2, Math.abs(toMiles - fromMiles) + Math.min(fromMiles, toMiles) * 0.25);
  const transport = directMiles > 1.2 ? "bus" : "walk";
  const rawMinutes = transport === "bus"
    ? Math.max(10, directMiles * 7 + 5)
    : Math.max(5, directMiles * 20);

  return {
    distance: formatMiles(directMiles),
    minutes: Math.min(30, Math.ceil(rawMinutes / 5) * 5),
    transport
  };
}

function makeTravelItineraryBlocks(events) {
  const sorted = [...events].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const dayStart = START_HOUR * 60;
  const dayEnd = END_HOUR * 60;
  const blocks = [];

  if (!sorted.length) return blocks;

  const first = sorted[0];
  const firstStart = timeToMinutes(first.start);
  const firstMinutes = travelMinutesFor(first);
  blocks.push({
    id: `travel-start-${first.id}`,
    title: `Travel to ${first.title}`,
    start: Math.max(dayStart, firstStart - firstMinutes),
    end: firstStart,
    distance: first.distance,
    transport: transportFor(first),
    from: "Current location",
    to: first.location
  });

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const fromEvent = sorted[index];
    const toEvent = sorted[index + 1];
    const fromEnd = timeToMinutes(fromEvent.end);
    const toStart = timeToMinutes(toEvent.start);
    const gap = toStart - fromEnd;
    if (gap <= 0) continue;

    const estimate = estimateTravelBetween(fromEvent, toEvent);
    const duration = Math.min(gap, estimate.minutes);
    blocks.push({
      id: `travel-${fromEvent.id}-to-${toEvent.id}`,
      title: `Travel from ${fromEvent.title} to ${toEvent.title}`,
      start: fromEnd,
      end: fromEnd + duration,
      distance: estimate.distance,
      transport: estimate.transport,
      from: fromEvent.location,
      to: toEvent.location
    });
  }

  const last = sorted[sorted.length - 1];
  const lastEnd = timeToMinutes(last.end);
  const lastMinutes = travelMinutesFor(last);
  blocks.push({
    id: `travel-end-${last.id}`,
    title: `Leave ${last.title}`,
    start: lastEnd,
    end: Math.min(dayEnd, lastEnd + lastMinutes),
    distance: last.distance,
    transport: transportFor(last),
    from: last.location,
    to: "Next stop"
  });

  return blocks.filter((block) => block.end > block.start);
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function eventScore(event) {
  let score = event.score;
  const acceptedTags = state.accepted.flatMap((item) => item.tags);
  const rejectedTags = state.rejected.flatMap((item) => item.tags);
  const moodText = state.moodSignals.join(" ");

  for (const tag of event.tags) {
    if (acceptedTags.includes(tag)) score += 4;
    if (rejectedTags.includes(tag)) score -= 2;
    if (moodText.includes(tag)) score += 10;
  }

  if (moodText.includes(event.vibe)) score += 12;
  if (state.selectedTags.size > 0 && event.tags.some((tag) => state.selectedTags.has(tag))) score += 30;
  if (event.distanceMinutes <= 10) score += 6;
  if (event.type === "real") score += 4;
  if (state.hideGenerated && event.type === "generated") score -= 1000;

  return score;
}

function buildQueue() {
  const usedIds = new Set([...state.accepted, ...state.rejected].map((event) => event.id));
  state.queue = state.allEvents
    .filter((event) => !usedIds.has(event.id))
    .filter((event) => !state.hideGenerated || event.type !== "generated")
    .map((event) => ({ ...event, relevance: eventScore(event) }))
    .sort((a, b) => {
      const tagA = state.selectedTags.size > 0 && a.tags.some((tag) => state.selectedTags.has(tag)) ? 1 : 0;
      const tagB = state.selectedTags.size > 0 && b.tags.some((tag) => state.selectedTags.has(tag)) ? 1 : 0;
      if (tagA !== tagB) return tagB - tagA;
      if (b.relevance !== a.relevance) return b.relevance - a.relevance;
      if (a.type !== b.type) return a.type === "real" ? -1 : 1;
      return timeToMinutes(a.start) - timeToMinutes(b.start);
    });
}

function currentEvent() {
  return state.queue[0] || null;
}

function allTags() {
  const tagCounts = new Map();
  for (const event of state.allEvents) {
    for (const tag of event.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  return [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
}

function render() {
  applyDevFeatureVisibility();
  $("#travelToggle").classList.toggle("is-active", state.showTravel);
  $("#travelToggle").setAttribute("aria-pressed", String(state.showTravel));
  $("#travelToggle").textContent = state.showTravel ? "Travel On" : "Travel";
  renderHeader();
  renderPlanner();
  renderCard();
  renderFilters();
  renderMood();
  renderRouteSummary();
  renderConflictNotice();
}

function applyDevFeatureVisibility() {
  const rules = {
    "session-status": DEV_FEATURES.showSessionStats,
    "session-actions": DEV_FEATURES.showSessionControls,
    "build-day": DEV_FEATURES.showBuildMyDay,
    "suggestion-reasoning": DEV_FEATURES.showSuggestionReasoning
  };
  for (const [name, enabled] of Object.entries(rules)) {
    for (const node of document.querySelectorAll(`[data-dev-feature="${name}"]`)) {
      node.hidden = !enabled;
    }
  }
}

function renderHeader() {
  const realLeft = state.queue.filter((event) => event.type === "real").length;
  $("#queueCount").textContent = `${state.queue.length} cards ready`;
  $("#memorySignal").textContent = `Short-term mood: ${state.moodSignals.join(", ")}`;
  $("#planCount").textContent = `${state.accepted.length} accepted`;
  $("#undoSwipe").disabled = state.history.length === 0;

  if (state.queue.length > 0 && realLeft === 0) {
    $("#currentDeckTitle").textContent = "No more local events found";
  } else {
    $("#currentDeckTitle").textContent = "";
  }
}

function renderPlanner() {
  $("#plannerTitle").textContent = formatDisplayDate(todayIso);
  const totalHours = END_HOUR - START_HOUR;
  const totalHeight = totalHours * HOUR_HEIGHT;
  const rail = $("#timeRail");
  const canvas = $("#plannerCanvas");
  const blocks = $("#plannerBlocks");

  rail.style.height = `${totalHeight}px`;
  canvas.style.height = `${totalHeight}px`;
  rail.innerHTML = "";
  for (let hour = START_HOUR; hour < END_HOUR; hour += 1) {
    const slot = document.createElement("div");
    slot.className = "time-slot";
    slot.textContent = toDisplayTime(`${String(hour % 24).padStart(2, "0")}:00`);
    rail.appendChild(slot);
  }

  const laneInfo = assignPlannerLanes(state.accepted);
  blocks.innerHTML = "";

  if (state.showTravel) {
    for (const travel of makeTravelItineraryBlocks(state.accepted)) {
      const top = ((travel.start - START_HOUR * 60) / 60) * HOUR_HEIGHT;
      const height = Math.max(24, ((travel.end - travel.start) / 60) * HOUR_HEIGHT - 4);
      const timeRange = `${toDisplayTime(minutesToClock(travel.start))} - ${toDisplayTime(minutesToClock(travel.end))}`;
      const block = document.createElement("button");
      block.type = "button";
      block.className = "planner-event is-travel";
      block.dataset.travelId = travel.id;
      block.dataset.travelTitle = travel.title;
      block.dataset.travelMeta = `${travel.transport} ${travel.distance}`;
      block.dataset.travelTime = timeRange;
      block.dataset.travelRoute = `${travel.from} to ${travel.to}`;
      block.style.top = `${top}px`;
      block.style.height = `${height}px`;
      block.style.left = "12px";
      block.style.right = "12px";
      block.innerHTML = `
        <strong>${escapeHtml(travel.transport)} ${escapeHtml(travel.distance)}</strong>
        <span>${escapeHtml(timeRange)}</span>
      `;
      blocks.appendChild(block);
    }
  }

  for (const { event, lane, laneCount, hasConflict } of laneInfo) {
    const start = timeToMinutes(event.start);
    const top = ((start - START_HOUR * 60) / 60) * HOUR_HEIGHT;
    const height = Math.max(MIN_EVENT_HEIGHT, (eventDurationMinutes(event) / 60) * HOUR_HEIGHT - 4);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `planner-event${hasConflict ? " has-conflict" : ""}`;
    button.dataset.eventId = event.id;
    button.style.top = `${top}px`;
    button.style.height = `${height}px`;
    button.style.left = `calc(12px + ${lane} * ((100% - 24px) / ${laneCount}))`;
    button.style.width = `calc(((100% - 24px) / ${laneCount}) - 6px)`;
    button.style.right = "auto";
    button.innerHTML = `
      <strong>${escapeHtml(event.title)}</strong>
      <span>${escapeHtml(formatTimeRange(event))} - ${escapeHtml(event.location)}</span>
    `;
    blocks.appendChild(button);
  }
}

function minutesToClock(minutes) {
  const normalized = ((minutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function assignPlannerLanes(events) {
  const sorted = [...events].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const activeLanes = [];
  const assigned = [];

  for (const event of sorted) {
    const start = timeToMinutes(event.start);
    const end = timeToMinutes(event.end);
    let lane = activeLanes.findIndex((laneEnd) => laneEnd <= start);
    if (lane === -1) {
      lane = activeLanes.length;
      activeLanes.push(end);
    } else {
      activeLanes[lane] = end;
    }

    assigned.push({
      event,
      lane,
      laneCount: 1,
      hasConflict: false,
      start,
      end
    });
  }

  const graph = new Map(assigned.map((item, index) => [index, []]));
  for (let i = 0; i < assigned.length; i += 1) {
    for (let j = i + 1; j < assigned.length; j += 1) {
      if (overlaps(assigned[i].start, assigned[i].end, assigned[j].start, assigned[j].end)) {
        graph.get(i).push(j);
        graph.get(j).push(i);
        assigned[i].hasConflict = true;
        assigned[j].hasConflict = true;
      }
    }
  }

  const seen = new Set();
  for (let index = 0; index < assigned.length; index += 1) {
    if (seen.has(index)) continue;
    const stack = [index];
    const component = [];
    seen.add(index);

    while (stack.length) {
      const current = stack.pop();
      component.push(current);
      for (const next of graph.get(current)) {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }

    const laneCount = Math.max(1, ...component.map((itemIndex) => assigned[itemIndex].lane + 1));
    for (const itemIndex of component) {
      assigned[itemIndex].laneCount = laneCount;
    }
  }

  return assigned;
}

function overlappingAccepted(event) {
  const start = timeToMinutes(event.start);
  const end = timeToMinutes(event.end);
  return state.accepted.filter((accepted) => {
    if (accepted.id === event.id) return false;
    return timeToMinutes(accepted.start) < end && timeToMinutes(accepted.end) > start;
  });
}

function travelConflictDetails(event) {
  if (!state.showTravel) return [];

  const start = timeToMinutes(event.start);
  const end = timeToMinutes(event.end);
  const conflicts = [];

  for (const travel of makeTravelItineraryBlocks(state.accepted)) {
    if (overlaps(start, end, travel.start, travel.end)) {
      conflicts.push(`overlaps planned commute time: ${travel.transport} ${travel.distance}`);
    }
  }

  const simulated = makeTravelItineraryBlocks([...state.accepted, event]);
  for (const travel of simulated) {
    for (const accepted of [...state.accepted, event]) {
      if (overlaps(travel.start, travel.end, timeToMinutes(accepted.start), timeToMinutes(accepted.end))) {
        conflicts.push(`would leave no travel buffer around ${accepted.title}`);
      }
    }
  }

  return [...new Set(conflicts)];
}

function renderCard() {
  const card = $("#eventCard");
  const event = currentEvent();

  if (!event) {
    card.innerHTML = `
      <div class="empty-card">
        <div>
          <h3>No more events found</h3>
          <p>Atlas has reached the end of this deck. Build the day plan from accepted events, reset the session, or wait for the Campus Scout to scan more sources.</p>
        </div>
      </div>
    `;
    $("#rejectButton").disabled = true;
    $("#acceptButton").disabled = true;
    return;
  }

  $("#rejectButton").disabled = false;
  $("#acceptButton").disabled = false;
  const visibleTags = event.tags.slice(0, 6);
  const badge = event.type === "generated" ? "Atlas Suggestion" : "Live Source";
  const relevance = Math.max(0, Math.min(100, Math.round(event.relevance)));
  const badgeHtml = event.type === "generated"
    ? `<button class="event-badge" type="button" data-suggestion-id="${escapeHtml(event.id)}">${escapeHtml(badge)}</button>`
    : `<a class="event-badge" href="${escapeHtml(event.sourceUrl || "#")}" target="_blank" rel="noreferrer">${escapeHtml(badge)}</a>`;

  card.innerHTML = `
    ${cardPosterHtml(event)}
    <div class="event-content">
      <div class="event-meta-strip">
        <div class="meta-box">
          <span class="meta-label">time estimate</span>
          <span class="meta-value" title="${escapeHtml(formatTimeRange(event))}">${escapeHtml(formatCompactTimeRange(event))}</span>
        </div>
        <div class="meta-box">
          <span class="meta-label">distance</span>
          <span class="meta-value">${escapeHtml(event.distance)}</span>
        </div>
      </div>
      <div class="event-title-row">
        <h3>${escapeHtml(event.title)}</h3>
        ${badgeHtml}
      </div>
      <div class="summary-box">
        <p>${escapeHtml(event.summary)}</p>
      </div>
      <div class="card-bottom">
        <div class="source-line">
          <span>${escapeHtml(event.source)}</span>
          <span>${relevance}% match</span>
        </div>
        <div class="tag-row">
          ${visibleTags.map((tag) => `<span class="event-tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderFilters() {
  const query = $("#tagSearch").value.trim().toLowerCase();
  const tags = allTags().filter((tag) => tag.includes(query));
  const target = $("#tagOptions");
  target.innerHTML = tags.map((tag) => `
    <button class="tag-option${state.selectedTags.has(tag) ? " is-selected" : ""}" type="button" data-tag="${escapeHtml(tag)}">
      ${escapeHtml(tag)}
    </button>
  `).join("");
}

function renderMood() {
  $("#moodSignals").innerHTML = state.moodSignals
    .map((signal) => `<span>${escapeHtml(signal)}</span>`)
    .join("");
}

function renderRouteSummary() {
  const event = currentEvent();
  $("#routeSummary").textContent = event ? tripEstimate(event) : "No current event";
}

function renderConflictNotice() {
  const notice = $("#conflictNotice");
  if (state.errorNotice) {
    notice.hidden = true;
    $("#errorMessage").textContent = state.errorNotice;
    $("#errorOverlay").hidden = false;
    return;
  }

  $("#errorOverlay").hidden = true;

  if (state.pendingConflictId) {
    const event = state.allEvents.find((item) => item.id === state.pendingConflictId);
    notice.hidden = false;
    notice.className = "conflict-notice";
    notice.innerHTML = `
      <strong>Time conflict</strong>
      <span>${escapeHtml(state.pendingConflictReason || (event ? event.title : "This event") + " overlaps your plan.")} Press &lt; to reject or &gt; again to keep both.</span>
    `;
    return;
  }

  notice.hidden = true;
  notice.className = "conflict-notice";
  notice.innerHTML = "";
}

function swipeCurrent(action) {
  const event = currentEvent();
  if (!event) return;

  if (state.errorNotice) {
    state.errorNotice = "";
    render();
    return;
  }

  if (state.pendingConflictId && state.pendingConflictId !== event.id) {
    state.pendingConflictId = "";
    state.pendingConflictReason = "";
  }

  if (state.pendingConflictId === event.id) {
    state.pendingConflictId = "";
    state.pendingConflictReason = "";
    if (action === "reject") {
      rejectEvent(event);
    } else {
      if (overlappingAccepted(event).length >= 2) {
        state.errorNotice = "That event overlaps two different planned events. Press anything to keep browsing.";
        render();
        return;
      }
      acceptEvent(event);
    }
    return;
  }

  if (action === "accept") {
    const conflicts = overlappingAccepted(event);
    if (conflicts.length >= 2) {
      state.errorNotice = "That event overlaps two different planned events. Press anything to keep browsing.";
      render();
      return;
    }
    if (conflicts.length === 1) {
      state.pendingConflictId = event.id;
      state.pendingConflictReason = `${event.title} overlaps ${conflicts[0].title}.`;
      render();
      return;
    }

    const travelConflicts = travelConflictDetails(event);
    if (travelConflicts.length > 0) {
      state.pendingConflictId = event.id;
      state.pendingConflictReason = `${event.title} ${travelConflicts[0]}.`;
      render();
      return;
    }
    acceptEvent(event);
    return;
  }

  rejectEvent(event);
}

function acceptEvent(event) {
  state.accepted.push(event);
  state.history.push({ action: "accept", id: event.id });
  state.learning = `Accepted ${event.title}.`;
  saveSession();
  buildQueue();
  render();
}

function rejectEvent(event) {
  state.rejected.push(event);
  state.history.push({ action: "reject", id: event.id });
  state.learning = `Rejected ${event.title}.`;
  saveSession();
  buildQueue();
  render();
}

function handleSwipe(action) {
  if (state.currentMotion) return;
  if (state.errorNotice) {
    swipeCurrent(action);
    return;
  }

  const event = currentEvent();
  if (!event) return;
  const directConflicts = action === "accept" ? overlappingAccepted(event) : [];
  const travelConflicts = action === "accept" ? travelConflictDetails(event) : [];
  const wouldPrompt = action === "accept" &&
    state.pendingConflictId !== event.id &&
    (directConflicts.length > 0 || travelConflicts.length > 0);
  if (wouldPrompt) {
    swipeCurrent(action);
    return;
  }

  const card = $("#eventCard");
  state.currentMotion = action;
  card.classList.remove("is-flick-left", "is-flick-right");
  card.classList.add(action === "accept" ? "is-flick-right" : "is-flick-left");
  window.setTimeout(() => {
    swipeCurrent(action);
    card.classList.remove("is-flick-left", "is-flick-right");
    state.currentMotion = "";
  }, 190);
}

function undoLastSwipe() {
  const last = state.history.pop();
  if (!last) return;
  state.pendingConflictId = "";
  state.errorNotice = "";
  const list = last.action === "accept" ? state.accepted : state.rejected;
  const index = list.findIndex((event) => event.id === last.id);
  const event = index >= 0 ? list[index] : state.allEvents.find((item) => item.id === last.id);
  if (index >= 0) list.splice(index, 1);
  state.learning = event ? `Undid ${last.action} for ${event.title}.` : "Undid last swipe.";
  saveSession();
  buildQueue();
  render();
}

function parseMoodInput(value) {
  const text = value.toLowerCase();
  const signals = [];
  const rules = [
    ["chill", ["chill", "quiet", "calm", "low-key", "low key", "relax"]],
    ["energetic", ["energetic", "hype", "party", "loud", "dance"]],
    ["social", ["social", "people", "friends", "meet", "networking"]],
    ["intellectual", ["study", "academic", "research", "career", "productive", "work"]],
    ["adventurous", ["hike", "outside", "outdoors", "nature", "beach", "explore"]],
    ["food", ["food", "hungry", "snack", "pizza", "dinner", "lunch"]],
    ["music", ["music", "concert", "open mic", "band"]],
    ["engineering", ["engineering", "ai", "robotics", "hackathon", "nvidia"]]
  ];

  for (const [signal, words] of rules) {
    if (words.some((word) => text.includes(word))) {
      signals.push(signal);
    }
  }

  return signals.length ? [...new Set(signals)].slice(0, 5) : ["balanced"];
}

function applyMood(value) {
  state.moodSignals = parseMoodInput(value);
  state.learning = `Temporary mood applied: ${state.moodSignals.join(", ")}. Long-term preferences stay unchanged.`;
  saveSession();
  buildQueue();
  render();
}

function openRoutePopup() {
  const event = currentEvent();
  if (!event) {
    $("#routingToggle").checked = false;
    return;
  }

  $("#routeTitle").textContent = `Route to ${event.title}`;
  $("#routeDetails").innerHTML = `
    <div class="route-detail-row"><span>Destination</span><strong>${escapeHtml(event.location)}</strong></div>
    <div class="route-detail-row"><span>Trip estimate</span><strong>${escapeHtml(tripEstimate(event))}</strong></div>
    <div class="route-detail-row"><span>Start time</span><strong>${escapeHtml(toDisplayTime(event.start))}</strong></div>
    ${event.route.map((step, index) => `
      <div class="route-detail-row"><span>Step ${index + 1}</span><strong>${escapeHtml(step)}</strong></div>
    `).join("")}
  `;

  $("#routeOverlay").hidden = false;
  $("#appShell").classList.add("is-disabled");
  setUiDisabled(true);
}

function closeRoutePopup() {
  $("#routeOverlay").hidden = true;
  $("#routingToggle").checked = false;
  $("#appShell").classList.remove("is-disabled");
  setUiDisabled(false);
}

function openPlannerEventModal(event) {
  state.selectedPlannerEventId = event.id;
  $("#plannerEventCard").innerHTML = `
    ${cardPosterHtml(event)}
    <p class="eyebrow">${escapeHtml(event.type === "generated" ? "Atlas Suggestion" : "Planned Event")}</p>
    <h2 id="plannerEventTitle">${escapeHtml(event.title)}</h2>
    <p><strong>${escapeHtml(formatTimeRange(event))}</strong> at ${escapeHtml(event.location)}</p>
    <p>${escapeHtml(event.summary)}</p>
    <div class="tag-row">
      ${event.tags.slice(0, 6).map((tag) => `<span class="event-tag">${escapeHtml(tag)}</span>`).join("")}
    </div>
  `;
  $("#plannerEventOverlay").hidden = false;
}

function closePlannerEventModal() {
  $("#plannerEventOverlay").hidden = true;
  state.selectedPlannerEventId = "";
}

function deleteSelectedPlannerEvent() {
  const id = state.selectedPlannerEventId;
  if (!id) return;
  state.accepted = state.accepted.filter((event) => event.id !== id);
  state.history = state.history.filter((entry) => entry.id !== id);
  closePlannerEventModal();
  saveSession();
  buildQueue();
  render();
}

function openSuggestionModal(event) {
  if (!DEV_FEATURES.showSuggestionReasoning) return;
  state.selectedSuggestionId = event.id;
  $("#suggestionTitle").textContent = event.title;
  $("#suggestionBody").innerHTML = `
    <p>This is a generated Atlas card, not a scraped campus event.</p>
    <ul class="reason-list">
      <li>It fits the current mood signal: ${escapeHtml(state.moodSignals.join(", "))}.</li>
      <li>It leaves space around already accepted calendar items.</li>
      <li>It is nearby: ${escapeHtml(tripEstimate(event))} by ${escapeHtml(transportFor(event))}.</li>
    </ul>
  `;
  $("#suggestionOverlay").hidden = false;
}

function closeSuggestionModal() {
  $("#suggestionOverlay").hidden = true;
  state.selectedSuggestionId = "";
}

function openBuildDayModal() {
  if (!DEV_FEATURES.showBuildMyDay) return;
  $("#buildDayOverlay").hidden = false;
}

function closeBuildDayModal() {
  $("#buildDayOverlay").hidden = true;
}

function buildDay(mode) {
  const matchMode = (event) => {
    if (mode === "chill") return event.vibe === "chill" || ["wellness", "nature", "arts"].includes(event.category);
    if (mode === "adventurous") return event.vibe === "adventurous" || event.vibe === "energetic" || ["nature", "music"].includes(event.category);
    return true;
  };

  let added = 0;
  const candidates = [...state.queue]
    .filter(matchMode)
    .sort((a, b) => b.relevance - a.relevance);

  for (const event of candidates) {
    if (added >= 3) break;
    if (overlappingAccepted(event).length > 0) continue;
    if (travelConflictDetails(event).length > 0) continue;
    state.accepted.push(event);
    state.history.push({ action: "accept", id: event.id });
    added += 1;
  }

  state.learning = added
    ? `Build My Day added ${added} ${mode} event${added === 1 ? "" : "s"}.`
    : `No open ${mode} slots were found.`;
  closeBuildDayModal();
  saveSession();
  buildQueue();
  render();
}

function setUiDisabled(disabled) {
  const controls = document.querySelectorAll("#appShell button, #appShell input");
  for (const control of controls) {
    control.disabled = disabled;
  }
}

function showPosterTooltip(event, mouseEvent) {
  const tooltip = $("#posterTooltip");
  tooltip.className = "poster-tooltip";
  tooltip.hidden = false;
  tooltip.innerHTML = `
    ${cardPosterHtml(event, true)}
    <div class="poster-tooltip-content">
      <h4>${escapeHtml(event.title)}</h4>
      <p>${escapeHtml(formatTimeRange(event))}</p>
      <p>${escapeHtml(event.location)}</p>
    </div>
  `;
  movePosterTooltip(mouseEvent);
}

function showTravelTooltip(block, mouseEvent) {
  const tooltip = $("#posterTooltip");
  tooltip.className = "poster-tooltip is-travel-tooltip";
  tooltip.hidden = false;
  tooltip.innerHTML = `
    <div class="poster-tooltip-content">
      <p class="eyebrow">Commute</p>
      <h4>${escapeHtml(block.dataset.travelMeta || "Travel")}</h4>
      <p>${escapeHtml(block.dataset.travelTime || "")}</p>
      <p>${escapeHtml(block.dataset.travelRoute || "")}</p>
    </div>
  `;
  movePosterTooltip(mouseEvent);
}

function movePosterTooltip(mouseEvent) {
  const tooltip = $("#posterTooltip");
  if (tooltip.hidden) return;
  const offset = 14;
  let left = mouseEvent.clientX + offset;
  let top = mouseEvent.clientY + offset;
  const box = tooltip.getBoundingClientRect();
  if (left + box.width > window.innerWidth - 8) left = mouseEvent.clientX - box.width - offset;
  if (top + box.height > window.innerHeight - 8) top = mouseEvent.clientY - box.height - offset;
  tooltip.style.left = `${Math.max(8, left)}px`;
  tooltip.style.top = `${Math.max(8, top)}px`;
}

function hidePosterTooltip() {
  const tooltip = $("#posterTooltip");
  tooltip.hidden = true;
  tooltip.className = "poster-tooltip";
  for (const node of document.querySelectorAll(".planner-event.is-hovered")) {
    node.classList.remove("is-hovered");
  }
}

function togglePlannerFullscreen() {
  $("#plannerPanel").classList.toggle("is-fullscreen");
  $("#fullscreenPlanner").textContent = $("#plannerPanel").classList.contains("is-fullscreen") ? "x" : "[ ]";
}

function bindEvents() {
  $("#brandRefresh").addEventListener("click", () => window.location.reload());
  $("#rejectButton").addEventListener("click", () => handleSwipe("reject"));
  $("#acceptButton").addEventListener("click", () => handleSwipe("accept"));
  $("#undoSwipe").addEventListener("click", undoLastSwipe);
  $("#resetSession").addEventListener("click", resetSession);
  $("#fullscreenPlanner").addEventListener("click", togglePlannerFullscreen);
  $("#travelToggle").addEventListener("click", () => {
    state.showTravel = !state.showTravel;
    saveSession();
    render();
  });
  $("#buildDayButton").addEventListener("click", openBuildDayModal);

  $("#eventCard").addEventListener("click", (event) => {
    const button = event.target.closest("[data-suggestion-id]");
    if (!button) return;
    const suggestion = state.allEvents.find((item) => item.id === button.dataset.suggestionId);
    if (suggestion) openSuggestionModal(suggestion);
  });

  $("#filterToggle").addEventListener("change", (event) => {
    const open = event.target.checked;
    $("#tagDropdown").hidden = !open;
    if (!open) {
      state.selectedTags.clear();
      $("#tagSearch").value = "";
      state.learning = "Filter cleared. Queue returned to preference ranking.";
    }
    buildQueue();
    render();
  });

  $("#tagSearch").addEventListener("input", renderFilters);

  $("#tagOptions").addEventListener("click", (event) => {
    const button = event.target.closest("[data-tag]");
    if (!button) return;
    const tag = button.dataset.tag;
    if (state.selectedTags.has(tag)) state.selectedTags.delete(tag);
    else state.selectedTags.add(tag);
    state.learning = state.selectedTags.size
      ? `Filter prioritizing: ${[...state.selectedTags].join(", ")}.`
      : "Filter is open with no selected tags.";
    buildQueue();
    render();
  });

  $("#routingToggle").addEventListener("change", (event) => {
    if (event.target.checked) openRoutePopup();
  });

  $("#routeOverlay").addEventListener("pointerdown", (event) => {
    if (event.target === $("#routeOverlay")) closeRoutePopup();
  });
  $("#routeOverlay").addEventListener("click", (event) => {
    if (event.target === $("#routeOverlay")) closeRoutePopup();
  });
  $("#routeClose").addEventListener("click", closeRoutePopup);
  $("#plannerEventClose").addEventListener("click", closePlannerEventModal);
  $("#deletePlannerEvent").addEventListener("click", deleteSelectedPlannerEvent);
  $("#plannerEventOverlay").addEventListener("click", (event) => {
    if (event.target === $("#plannerEventOverlay")) closePlannerEventModal();
  });
  $("#errorOverlay").addEventListener("click", () => {
    state.errorNotice = "";
    render();
  });
  $("#suggestionClose").addEventListener("click", closeSuggestionModal);
  $("#suggestionOverlay").addEventListener("click", (event) => {
    if (event.target === $("#suggestionOverlay")) closeSuggestionModal();
  });
  $("#buildDayClose").addEventListener("click", closeBuildDayModal);
  $("#buildDayOverlay").addEventListener("click", (event) => {
    if (event.target === $("#buildDayOverlay")) closeBuildDayModal();
    const button = event.target.closest("[data-build-mode]");
    if (button) buildDay(button.dataset.buildMode);
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest("#routeClose")) closeRoutePopup();
  });

  $("#moodForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const value = $("#moodInput").value.trim();
    if (!value) return;
    $("#moodInput").value = "";
    applyMood(value);
  });

  $("#plannerBlocks").addEventListener("mousemove", (event) => {
    const block = event.target.closest(".planner-event");
    if (!block) {
      hidePosterTooltip();
      return;
    }
    for (const node of document.querySelectorAll(".planner-event.is-hovered")) {
      if (node !== block) node.classList.remove("is-hovered");
    }
    block.classList.add("is-hovered");
    if (block.classList.contains("is-travel")) {
      showTravelTooltip(block, event);
      return;
    }
    const scheduled = state.accepted.find((item) => item.id === block.dataset.eventId);
    if (scheduled) showPosterTooltip(scheduled, event);
  });

  $("#plannerBlocks").addEventListener("click", (event) => {
    const block = event.target.closest(".planner-event");
    if (!block) return;
    if (block.classList.contains("is-travel")) return;
    const scheduled = state.accepted.find((item) => item.id === block.dataset.eventId);
    if (scheduled) openPlannerEventModal(scheduled);
  });

  $("#plannerBlocks").addEventListener("mouseleave", hidePosterTooltip);

  document.addEventListener("keydown", (event) => {
    if (state.errorNotice) {
      state.errorNotice = "";
      render();
      return;
    }
    if (event.key === "Escape") {
      if (!$("#routeOverlay").hidden) closeRoutePopup();
      if (!$("#plannerEventOverlay").hidden) closePlannerEventModal();
      if (!$("#suggestionOverlay").hidden) closeSuggestionModal();
      if (!$("#buildDayOverlay").hidden) closeBuildDayModal();
      if ($("#plannerPanel").classList.contains("is-fullscreen")) togglePlannerFullscreen();
    }
    const modalOpen = !$("#routeOverlay").hidden || !$("#plannerEventOverlay").hidden || !$("#suggestionOverlay").hidden || !$("#buildDayOverlay").hidden;
    if (!modalOpen && event.key === "ArrowLeft") handleSwipe("reject");
    if (!modalOpen && event.key === "ArrowRight") handleSwipe("accept");
  });
}

async function boot() {
  bindEvents();
  $("#routeOverlay").hidden = true;
  $("#routingToggle").checked = false;
  $("#appShell").classList.remove("is-disabled");
  setUiDisabled(false);
  await loadBackendEventsIfAvailable();
  loadSession();
  buildQueue();
  render();
  $("#plannerScroll").scrollTop = 0;
}

boot();
