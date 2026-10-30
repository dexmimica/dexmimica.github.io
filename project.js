// Theme preference defaults to the OS and persists after an explicit choice.
const themeToggle = document.querySelector('.theme-toggle');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
let themePreference;
try { themePreference = localStorage.getItem('project-website-color-scheme'); } catch { /* Local previews may block storage. */ }
if (!['light', 'dark'].includes(themePreference)) themePreference = null;
function applyTheme() {
  const scheme = themePreference || (systemTheme.matches ? 'dark' : 'light');
  document.documentElement.dataset.colorScheme = scheme;
  themeToggle.setAttribute('aria-pressed', String(scheme === 'dark'));
  themeToggle.title = `Switch to ${scheme === 'dark' ? 'light' : 'dark'} mode`;
}
themeToggle.addEventListener('click', () => {
  themePreference = document.documentElement.dataset.colorScheme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('project-website-color-scheme', themePreference); } catch { /* Still switch for this visit. */ }
  applyTheme();
});
systemTheme.addEventListener('change', applyTheme);
window.addEventListener('storage', event => {
  if (event.key !== 'project-website-color-scheme' && event.key !== null) return;
  themePreference = ['light', 'dark'].includes(event.newValue) ? event.newValue : null;
  applyTheme();
});
applyTheme();

// Navigation for the standalone research page.
const navLinks = [...document.querySelectorAll('.section-nav a')];
const sections = navLinks.map(link => document.querySelector(link.hash));

function updateNavigation() {
  const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + 25;
  let current = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= offset) current = section;
  }
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = sections.at(-1);
  navLinks.forEach(link => {
    if (link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

let scrollPending = false;
window.addEventListener('scroll', () => {
  if (scrollPending) return;
  scrollPending = true;
  requestAnimationFrame(() => { updateNavigation(); scrollPending = false; });
}, { passive: true });
window.addEventListener('resize', updateNavigation);
updateNavigation();

// Keep decoding bounded, and release sources after videos leave the viewport.
const videos = [...document.querySelectorAll('video')];
const mediaSettings = window.PAPER_CONTENT.media || {};
const videoLimit = mediaSettings.pauseOthers ? 1 : (mediaSettings.maxConcurrentVideos ?? 2);
const videoStates = new Map(videos.map(video => [video, {
  ratio: 0, near: false, manual: false, manualAt: 0, userPaused: false,
  wantPlay: false, internalPlay: false, internalPause: false, releaseTimer: null, resumeTime: 0
}]));
const showPoster = video => {
  if (video.dataset.poster && !video.hasAttribute('poster')) video.poster = video.dataset.poster;
};
const applyVideoRate = video => {
  const rate = Number(video.dataset.playbackRate || video.closest('.carousel-slide')?.dataset.playbackRate || 1);
  video.defaultPlaybackRate = rate;
  video.playbackRate = rate;
};
function prepareVideo(video) {
  const state = videoStates.get(video);
  clearTimeout(state.releaseTimer);
  state.releaseTimer = null;
  showPoster(video);
  applyVideoRate(video);
  const source = video.querySelector('source[data-src]');
  if (!source || source.hasAttribute('src')) return;
  source.src = source.dataset.src;
  video.load();
}
function pauseVideo(video) {
  if (video.paused) return;
  videoStates.get(video).internalPause = true;
  video.pause();
}
function releaseVideo(video) {
  const state = videoStates.get(video);
  clearTimeout(state.releaseTimer);
  state.releaseTimer = null;
  const source = video.querySelector('source[src]');
  if (!source) return;
  state.resumeTime = video.currentTime || state.resumeTime;
  pauseVideo(video);
  source.removeAttribute('src');
  video.load(); // Abort pending requests and release decoder/buffer resources.
}
let playbackPending = false;
function schedulePlayback() {
  if (playbackPending) return;
  playbackPending = true;
  requestAnimationFrame(() => {
    playbackPending = false;
    updatePlayback();
  });
}
function updatePlayback() {
  const available = document.hidden ? [] : videos.filter(video => {
    const state = videoStates.get(video);
    return !video.closest('[hidden]') && !state.userPaused &&
      (state.manual ? state.ratio > 0 : state.ratio >= 0.25 && video.dataset.autoplay === 'true');
  });
  const manual = available.filter(video => videoStates.get(video).manual)
    .sort((a, b) => videoStates.get(b).manualAt - videoStates.get(a).manualAt);
  // Give each comparison method a turn before selecting a second clip from it.
  const buckets = new Map();
  for (const video of available.filter(video => !videoStates.get(video).manual)) {
    const group = video.closest('.carousel-group') || video;
    if (!buckets.has(group)) buckets.set(group, []);
    buckets.get(group).push(video);
  }
  const selected = manual.slice(0, videoLimit);
  while (selected.length < videoLimit && [...buckets.values()].some(bucket => bucket.length)) {
    for (const bucket of buckets.values()) {
      if (bucket.length && selected.length < videoLimit) selected.push(bucket.shift());
    }
  }
  const chosen = new Set(selected);
  // Pause first, so a slide change never starts a second batch of decoders.
  for (const video of videos) {
    const state = videoStates.get(video);
    state.wantPlay = chosen.has(video);
    if (state.wantPlay) continue;
    pauseVideo(video);
    const hidden = document.hidden || !!video.closest('[hidden]');
    if (hidden) releaseVideo(video);
    else if ((!state.near || (!state.userPaused && video.readyState > 0)) && !state.releaseTimer && video.querySelector('source[src]')) {
      state.releaseTimer = setTimeout(() => {
        state.releaseTimer = null;
        if (!state.wantPlay) {
          releaseVideo(video);
          if (state.near && !document.hidden && !video.closest('[hidden]')) prepareVideo(video);
        }
      }, 1500);
    }
  }
  for (const video of selected) {
    prepareVideo(video);
    if (!video.paused) continue;
    const state = videoStates.get(video);
    state.internalPlay = true;
    video.play().then(() => {
      if (!state.wantPlay) pauseVideo(video);
    }).catch(() => { state.internalPlay = false; });
  }
}
for (const video of videos) {
  const state = videoStates.get(video);
  video.addEventListener('pointerdown', () => prepareVideo(video));
  video.addEventListener('keydown', event => {
    if ([' ', 'Enter'].includes(event.key)) prepareVideo(video);
  });
  video.addEventListener('loadedmetadata', () => {
    applyVideoRate(video);
    if (state.resumeTime > 0 && state.resumeTime < video.duration) video.currentTime = state.resumeTime;
  });
  video.addEventListener('play', () => {
    if (!state.internalPlay) {
      state.manual = true;
      state.manualAt = performance.now();
      state.userPaused = false;
    }
    state.internalPlay = false;
    schedulePlayback();
  });
  video.addEventListener('pause', () => {
    if (state.internalPause) state.internalPause = false;
    else if (!video.ended) {
      state.userPaused = true;
      state.manual = false;
    }
    schedulePlayback();
  });
  video.addEventListener('ended', () => {
    state.userPaused = true;
    state.manual = false;
    schedulePlayback();
  });
}
let refreshVideoVisibility = () => {};
if ('IntersectionObserver' in window) {
  const posterObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      videoStates.get(entry.target).near = entry.isIntersecting;
      if (entry.isIntersecting && !entry.target.closest('[hidden]')) prepareVideo(entry.target);
    }
    schedulePlayback();
  }, { rootMargin: '200px 0px' });
  const playbackObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const state = videoStates.get(entry.target);
      state.ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
      if (!entry.isIntersecting) {
        state.userPaused = false;
        state.manual = false;
      }
    }
    schedulePlayback();
  }, { threshold: [0, 0.25, 0.75] });
  videos.forEach(video => {
    posterObserver.observe(video);
    playbackObserver.observe(video);
  });
} else {
  refreshVideoVisibility = () => {
    for (const video of videos) {
      const rect = video.getBoundingClientRect();
      const state = videoStates.get(video);
      const visibleHeight = Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top));
      state.ratio = rect.height ? visibleHeight / rect.height : 0;
      state.near = rect.height > 0 && rect.top < innerHeight + 200 && rect.bottom > -200;
      if (state.near && !video.closest('[hidden]')) prepareVideo(video);
    }
    schedulePlayback();
  };
  window.addEventListener('scroll', refreshVideoVisibility, { passive: true });
  window.addEventListener('resize', refreshVideoVisibility);
  refreshVideoVisibility();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) updatePlayback();
  else schedulePlayback();
});

// Method rows scroll independently and show a partial next card as a hint.
const rowUpdates = new Map();
for (const row of document.querySelectorAll('.video-carousel')) {
  const track = row.querySelector('.video-track');
  const controls = row.querySelector('.video-carousel-controls') ||
    row.closest('.carousel-group').querySelector(':scope > .carousel-group-heading > .video-carousel-controls');
  const previous = controls.querySelector('.video-previous');
  const next = controls.querySelector('.video-next');
  const counter = controls.querySelector('.video-counter');
  const update = () => {
    if (!track.clientWidth) return;
    const bounds = track.getBoundingClientRect();
    const visible = [...track.children].map((card, index) => ({ index, bounds: card.getBoundingClientRect() }))
      .filter(card => card.bounds.right > bounds.left + 2 && card.bounds.left < bounds.right - 2);
    if (visible.length) counter.textContent = `${visible[0].index + 1}–${visible.at(-1).index + 1} / ${track.children.length}`;
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollWidth - track.clientWidth - track.scrollLeft <= 2;
    if (!row.closest('[hidden]')) row.dataset.scrollOffset = String(track.scrollLeft);
  };
  const move = direction => {
    const step = track.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap);
    track.scrollBy({ left: direction * step, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  controls.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    move(event.key === 'ArrowLeft' ? -1 : 1);
  });
  let pending = false;
  track.addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; update(); });
  }, { passive: true });
  rowUpdates.set(row, update);
  window.addEventListener('resize', update);
  update();
}

// Outer carousels change whole tasks; method rows retain their own positions.
for (const carousel of document.querySelectorAll('.experiment-carousel')) {
  const slides = [...carousel.querySelectorAll(':scope > .carousel-slide')];
  let index = 0;
  const update = (announce = true) => {
    for (const row of carousel.querySelectorAll('.carousel-slide:not([hidden]) .video-carousel')) {
      row.dataset.scrollOffset = String(row.querySelector('.video-track').scrollLeft);
    }
    slides.forEach((slide, slideIndex) => { slide.hidden = slideIndex !== index; });
    const slide = slides[index];
    carousel.querySelector('.carousel-title').textContent = slide.dataset.title;
    carousel.querySelector('.carousel-counter').textContent = `${index + 1} / ${slides.length}`;
    const rate = carousel.querySelector('.carousel-rate');
    rate.textContent = `${slide.dataset.playbackRate}× playback`;
    rate.hidden = Number(slide.dataset.playbackRate) === 1;
    if (announce) carousel.querySelector('.carousel-status').textContent = `${slide.dataset.title}, ${index + 1} of ${slides.length}`;
    for (const row of slide.querySelectorAll('.video-carousel')) {
      row.querySelector('.video-track').scrollLeft = Number(row.dataset.scrollOffset || 0);
      rowUpdates.get(row)();
    }
    refreshVideoVisibility();
    updatePlayback();
  };
  const move = delta => {
    index = (index + delta + slides.length) % slides.length;
    update();
  };
  carousel.querySelector('.carousel-previous').addEventListener('click', () => move(-1));
  carousel.querySelector('.carousel-next').addEventListener('click', () => move(1));
  carousel.querySelector('.carousel-controls').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowLeft' ? -1 : 1);
  });
  update(false);
}
