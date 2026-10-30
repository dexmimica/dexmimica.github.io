// Shared content renderer. Classic scripts keep direct file:// opening working.
(() => {
  const content = window.PAPER_CONTENT;
  const percentage = (value, fallback = 8) => Number.isFinite(Number(value))
    ? Math.max(0, Math.min(100, Number(value))) : fallback;
  // Two editable colors drive all page chrome; derived shades live in CSS.
  if (content.theme) {
    const root = document.documentElement;
    if (content.theme.accent && CSS.supports('color', content.theme.accent)) {
      root.style.setProperty('--theme-accent', content.theme.accent);
    }
    if (content.theme.text && CSS.supports('color', content.theme.text)) {
      root.style.setProperty('--theme-text', content.theme.text);
    }
    root.dataset.tintBackground = String(content.theme.tintBackground === true);
    const requestedTint = Number(content.theme.backgroundTintPercent ?? 4);
    const tint = Number.isFinite(requestedTint) ? Math.max(0, Math.min(100, requestedTint)) : 4;
    root.style.setProperty('--background-tint-percent', `${tint}%`);
    root.style.setProperty('--code-tint-percent', `${percentage(content.theme.codeTintPercent ?? 8)}%`);

  }
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const linkedName = (name, website, className) => {
    const node = element(website ? 'a' : 'span', className, name);
    if (website) node.href = website;
    return node;
  };
  const copyText = async (text) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch { /* Fall back for local files and restricted browsers. */ }
    }
    const input = element('textarea');
    input.value = text;
    input.readOnly = true;
    input.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.append(input);
    input.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { /* Show failure below. */ }
    input.remove();
    return copied;
  };
  const renderFigure = (media) => {
    const figure = element('figure', 'method-figure');
    const image = element('img');
    image.src = media.src;
    image.alt = media.alt;
    image.width = media.width;
    image.height = media.height;
    image.decoding = 'async';
    image.loading = 'lazy';
    figure.append(image);
    if (media.caption || media.captionLabel) {
      const caption = element('figcaption');
      if (media.captionLabel) caption.append(element('span', 'caption-label', media.captionLabel), ' ');
      if (media.caption) caption.append(document.createTextNode(media.caption.trim()));
      figure.append(caption);
    }
    return figure;
  };
  let videoCount = 0;
  const renderVideo = (clip) => {
    const figure = element('figure', 'video-figure');
    const video = element('video');
    video.controls = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = clip.loop === true;
    video.preload = 'none';
    const autoplay = clip.autoplay ?? content.media?.autoplay ?? true;
    video.dataset.autoplay = String(autoplay);
    if (clip.poster) video.dataset.poster = clip.poster;
    if (clip.playbackRate !== undefined) video.dataset.playbackRate = String(clip.playbackRate);
    video.width = clip.width;
    video.height = clip.height;
    video.style.aspectRatio = `${clip.width} / ${clip.height}`;
    video.setAttribute('aria-label', clip.alt || clip.title);
    const source = element('source');
    source.dataset.src = clip.src;
    source.type = clip.type || 'video/mp4';
    video.append(source, 'Your browser does not support video. ', linkedName('Download this clip.', clip.originalSrc || clip.src));
    figure.append(video);
    if (clip.title || clip.caption || clip.links?.length) {
      const caption = element('figcaption');
      caption.id = `video-caption-${++videoCount}`;
      if (clip.title) caption.append(element('span', '', clip.title));
      if (clip.caption) caption.append(element('small', '', clip.caption));
      if (clip.links?.length) {
        const links = element('div', 'media-links');
        links.append(...clip.links.map(link => linkedName(link.label, link.url)));
        caption.append(links);
      }
      video.setAttribute('aria-describedby', caption.id);
      figure.append(caption);
    }
    return figure;
  };
  const appendText = (node, paragraph) => {
    if (typeof paragraph === 'string') node.append(document.createTextNode(paragraph));
    else node.append(...paragraph.map(part => typeof part === 'string'
      ? document.createTextNode(part)
      : part.highlight === true ? element('mark', '', part.text) : linkedName(part.text, part.url)));
  };
  const renderVideoCarousel = (clips) => {
    const carousel = element('div', 'video-carousel');
    carousel.setAttribute('role', 'region');
    carousel.setAttribute('aria-roledescription', 'carousel');
    carousel.setAttribute('aria-label', 'Video examples');
    const controls = element('div', 'video-carousel-controls');
    const previous = element('button', 'video-previous', '←');
    previous.type = 'button';
    previous.setAttribute('aria-label', 'Previous videos');
    const next = element('button', 'video-next', '→');
    next.type = 'button';
    next.setAttribute('aria-label', 'Next videos');
    const counter = element('span', 'video-counter');
    counter.setAttribute('aria-hidden', 'true');
    controls.append(previous, counter, next);
    controls.hidden = clips.length < 2;
    const track = element('div', 'video-track');
    track.tabIndex = 0;
    track.setAttribute('aria-label', 'Scrollable video clips');
    track.dataset.count = clips.length;
    track.append(...clips.map(renderVideo));
    carousel.append(controls, track);
    return carousel;
  };
  const renderCarousel = (data) => {
    const carousel = element('div', 'experiment-carousel');
    carousel.setAttribute('role', 'region');
    carousel.setAttribute('aria-roledescription', 'carousel');
    carousel.setAttribute('aria-label', data.label || 'Experiment tasks');
    const header = element('div', 'carousel-header');
    const heading = element('div', 'carousel-heading');
    heading.append(element('h3', 'carousel-title', data.slides[0].title), element('span', 'carousel-rate'));
    const controls = element('div', 'carousel-controls');
    const previous = element('button', 'carousel-previous', '←');
    previous.type = 'button';
    previous.setAttribute('aria-label', 'Previous task');
    const next = element('button', 'carousel-next', '→');
    next.type = 'button';
    next.setAttribute('aria-label', 'Next task');
    const counter = element('span', 'carousel-counter', `1 / ${data.slides.length}`);
    counter.setAttribute('aria-hidden', 'true');
    controls.append(previous, counter, next);
    controls.hidden = data.slides.length < 2;
    const status = element('span', 'carousel-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    header.append(heading, controls, status);
    carousel.append(header);
    data.slides.forEach((slide, index) => {
      const panel = element('article', 'carousel-slide');
      panel.hidden = index !== 0;
      panel.dataset.title = slide.title;
      panel.dataset.playbackRate = String(slide.playbackRate ?? 1);
      panel.setAttribute('role', 'group');
      panel.setAttribute('aria-roledescription', 'slide');
      panel.setAttribute('aria-label', `${index + 1} of ${data.slides.length}: ${slide.title}`);
      renderBody(panel, slide);
      if (slide.groups?.length) {
        const groups = element('div', 'carousel-groups');
        groups.dataset.count = slide.groups.length;
        for (const group of slide.groups) {
          const column = element('div', 'carousel-group');
          const label = element('div', 'carousel-group-heading');
          label.append(element('h4', '', group.title));
          if (group.metric) label.append(element('p', 'carousel-metric', group.metric));
          column.append(label);
          renderBody(column, group, false, true);
          const rows = column.querySelectorAll('.video-carousel');
          if (rows.length === 1) {
            const row = rows[0];
            const track = row.querySelector('.video-track');
            // A task illustration shares the method's single row of examples.
            for (const figure of column.querySelectorAll('.method-figure')) {
              if (figure.closest('.figure-wrap') || figure.closest('.video-track')) continue;
              const parent = figure.parentElement;
              figure.classList.add('video-figure');
              track.append(figure);
              if (parent.matches('.content-block') && !parent.childElementCount) parent.remove();
            }
            track.dataset.count = track.children.length;
            row.querySelector('.video-carousel-controls').hidden = track.children.length < 2;
            row.setAttribute('aria-label', `${group.title} videos`);
            row.querySelector('.video-previous').setAttribute('aria-label', `Previous examples for ${group.title}`);
            row.querySelector('.video-next').setAttribute('aria-label', `Next examples for ${group.title}`);
            label.append(row.querySelector('.video-carousel-controls'));
          }
          groups.append(column);
        }
        panel.append(groups);
      }
      carousel.append(panel);
    });
    return carousel;
  };
  const renderBody = (container, data, codeParagraphs = false, videoCarousel = false) => {
    if (data.layout === 'figure-wrap') {
      const wrapper = element('div', 'figure-wrap');
      if (data.figureAlign === 'left') wrapper.classList.add('figure-wrap-left');
      wrapper.append(renderFigure(data.figure));
      renderBody(wrapper, { ...data, layout: undefined, figure: undefined }, codeParagraphs, videoCarousel);
      container.append(wrapper);
      return;
    }
    const paragraphs = data.paragraphs || [];
    if (paragraphs.length && codeParagraphs) {
      const pre = element('pre', 'details-code');
      const code = element('code');
      paragraphs.forEach((paragraph, index) => {
        if (index) code.append(document.createTextNode('\n\n'));
        appendText(code, paragraph);
      });
      pre.append(code);
      container.append(pre);
    } else if (paragraphs.length) {
      const text = element('div', 'text-block');
      text.append(...paragraphs.map(paragraph => {
        const node = element('p', 'prose');
        appendText(node, typeof paragraph === 'string' ? paragraph.trim() : paragraph);
        return node;
      }));
      container.append(text);
    }
    if (data.orderedList?.length) {
      const list = element('ol', 'ordered-list');
      for (const entry of data.orderedList) {
        const item = element('li');
        if (entry.title) item.append(element('h3', '', entry.title));
        renderBody(item, entry, codeParagraphs, videoCarousel);
        list.append(item);
      }
      container.append(list);
    }
    if (data.figure) container.append(renderFigure(data.figure));
    if (data.videos?.length) {
      if (videoCarousel || data.videoLayout === 'carousel') container.append(renderVideoCarousel(data.videos));
      else {
        const grid = element('div', 'video-grid');
        grid.dataset.count = data.videos.length;
        grid.append(...data.videos.map(renderVideo));
        container.append(grid);
      }
    }
    if (data.carousel) container.append(renderCarousel(data.carousel));
    if (data.embed) {
      const wrapper = element('div', 'video-embed');
      // Video providers may reject embeds without an HTTP referrer.
      if (location.protocol !== 'file:') {
        const frame = element('iframe');
        frame.src = data.embed.src;
        frame.title = data.embed.title;
        frame.width = data.embed.width;
        frame.height = data.embed.height;
        frame.style.aspectRatio = `${data.embed.width} / ${data.embed.height}`;
        frame.loading = 'lazy';
        frame.allowFullscreen = true;
        frame.allow = 'encrypted-media; picture-in-picture; fullscreen';
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        wrapper.append(frame);
      }
      const watch = linkedName('Watch video ↗', data.embed.url || data.embed.src, 'embed-link');
      watch.setAttribute('aria-label', `Watch ${data.embed.title}`);
      watch.target = '_blank';
      watch.rel = 'noopener';
      wrapper.append(watch);
      container.append(wrapper);
    }
    if (typeof data.bibtex === 'string' && data.bibtex.trim()) {
      const wrapper = element('div', 'citation-code-wrap');
      const pre = element('pre', 'citation-code');
      pre.append(element('code', '', data.bibtex.trim()));
      const button = element('button', 'citation-copy');
      button.type = 'button';
      button.setAttribute('aria-label', 'Copy BibTeX citation');
      button.title = 'Copy BibTeX citation';
      button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/></svg>';
      const status = element('span', 'citation-copy-status');
      status.setAttribute('role', 'status');
      status.hidden = true;
      let statusTimer;
      button.addEventListener('click', async () => {
        const copied = await copyText(pre.querySelector('code').textContent);
        status.textContent = copied ? 'Copied' : 'Copy failed';
        status.hidden = false;
        clearTimeout(statusTimer);
        statusTimer = setTimeout(() => { status.hidden = true; }, 2000);
      });
      wrapper.append(pre, button, status);
      container.append(wrapper);
    }
    for (const detail of data.details || []) {
      const disclosure = element('details', 'content-details');
      const body = element('div', 'section-content');
      if (detail.tintPercent !== undefined) {
        disclosure.style.setProperty('--code-tint-percent', `${percentage(detail.tintPercent)}%`);
      }
      disclosure.append(element('summary', '', detail.title));
      renderBody(body, detail, detail.format === 'code', videoCarousel);
      disclosure.append(body);
      container.append(disclosure);
    }
    for (const block of data.blocks || []) {
      const item = element('div', 'content-block');
      if (block.title) item.append(element('h3', '', block.title));
      renderBody(item, block, codeParagraphs, videoCarousel);
      if (item.childElementCount) container.append(item);
    }
  };

  const { paper } = content;
  if (paper.favicon) document.querySelector('link[rel="icon"]').href = paper.favicon;
  document.title = `${paper.name} — ${paper.title}`;
  document.querySelector('meta[name="description"]').content = paper.description;
  document.querySelector('meta[property="og:title"]').content = `${paper.name}: ${paper.title}`;
  document.querySelector('meta[property="og:description"]').content = paper.description;
  if (paper.siteUrl) document.querySelector('meta[property="og:url"]').content = paper.siteUrl;
  const socialImage = paper.socialImage || content.abstract?.figure?.src || paper.video?.poster;
  if (socialImage) {
    document.querySelector('meta[property="og:image"]').content = new URL(socialImage, paper.siteUrl || location.href).href;
  }
  if (paper.analyticsId && paper.siteUrl && location.hostname === new URL(paper.siteUrl).hostname) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', paper.analyticsId);
    const analytics = document.createElement('script');
    analytics.async = true;
    analytics.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(paper.analyticsId)}`;
    document.head.append(analytics);
  }
  document.querySelectorAll('[data-content="paper.name"]').forEach(node => { node.textContent = paper.name; });
  document.querySelector('.wordmark').setAttribute('aria-label', `${paper.name} project overview`);
  document.querySelector('h1').replaceChildren(
    element('span', 'project-name', `${paper.name}:`),
    ...(paper.titleLines
      ? paper.titleLines.map((line, index) => element('span', 'title-line',
        `${line.trim()}${index < paper.titleLines.length - 1 ? ' ' : ''}`))
      : [document.createTextNode(` ${paper.title}`)]),
  );
  document.querySelector('.authors').replaceChildren(...(paper.authors || []).map(author => {
    const item = element('span');
    item.append(linkedName(author.name, author.website, 'author-name'));
    const labels = `${(author.affiliations || []).join(',')}${author.notes || ''}`;
    if (labels) item.append(element('sup', '', labels));
    return item;
  }));
  const note = document.querySelector('.contribution');
  const affiliationsRow = document.querySelector('.affiliations');
  affiliationsRow.replaceChildren(...(paper.affiliations || []).map(affiliation => {
    const item = element('span');
    item.append(element('sup', '', affiliation.id), ' ', linkedName(affiliation.name, affiliation.website, 'affiliation-name'));
    return item;
  }), note);
  const resources = document.querySelector('.paper-links');
  const links = paper.links || [];
  resources.replaceChildren(...links.map(link => {
    const item = linkedName(link.label, link.url, 'paper-link');
    if (!link.url) {
      item.setAttribute('role', 'link');
      item.setAttribute('aria-disabled', 'true');
      item.setAttribute('aria-label', `${link.label} (link coming soon)`);
    }
    return item;
  }));
  resources.hidden = links.length === 0;
  const logos = (paper.logos || []).filter(logo => logo.src);
  const logoRow = document.querySelector('.paper-logos');
  logoRow.replaceChildren(...logos.map(logo => {
    const item = element(logo.url ? 'a' : 'span', 'paper-logo');
    if (logo.url) item.href = logo.url;
    const image = element('img');
    image.src = logo.src;
    image.alt = logo.alt || '';
    if (logo.width) image.width = logo.width;
    if (logo.height) image.height = logo.height;
    image.decoding = 'async';
    item.append(image);
    return item;
  }));
  logoRow.hidden = logos.length === 0;
  document.querySelector('.paper-resources').hidden = links.length === 0 && logos.length === 0;
  const authorNotes = Array.isArray(paper.authorNotes) ? paper.authorNotes : [paper.authorNotes];
  const visibleNotes = authorNotes.filter(text => typeof text === 'string' && text.trim());
  note.replaceChildren(...visibleNotes.map(text => element('span', '', text.trim())));
  note.hidden = visibleNotes.length === 0;
  affiliationsRow.hidden = !(paper.affiliations || []).length && note.hidden;
  const conference = document.querySelector('.conference');
  conference.textContent = paper.conference || '';
  conference.hidden = !paper.conference;
  const teaser = document.querySelector('.project-teaser');
  teaser.replaceChildren(...(paper.video ? [renderVideo(paper.video)] : []));

  const sectionContainer = document.querySelector('.sections');
  const navigation = document.querySelector('.section-nav');
  for (const id of content.sectionOrder || []) {
    const section = content[id];
    if (!section) continue;
    const sectionNode = element('section', 'section');
    sectionNode.id = id;
    sectionNode.setAttribute('aria-labelledby', `${id}-heading`);
    const heading = element('h2', 'section-heading', section.title || id);
    heading.id = `${id}-heading`;
    const body = element('div', 'section-content');
    renderBody(body, section);
    sectionNode.append(heading, body);
    sectionContainer.append(sectionNode);
    if (section.navTitle) {
      const link = document.createElement('a');
      link.href = `#${id}`;
      link.append(
        element('span', 'nav-index', String(navigation.children.length).padStart(2, '0')),
        element('span', 'nav-text', section.navTitle),
      );
      navigation.append(link);
    }
  }
})();
