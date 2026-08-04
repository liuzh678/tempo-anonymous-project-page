async function loadConfig() {
  const response = await fetch("paper-visualization.config.json");
  if (!response.ok) {
    throw new Error(`Failed to load paper-visualization.config.json: ${response.status}`);
  }
  return response.json();
}

function create(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function setOrCreateMeta(selector, attrs) {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement("meta");
    document.head.appendChild(node);
  }
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, value);
  }
}

function setOrCreateLink(selector, attrs) {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement("link");
    document.head.appendChild(node);
  }
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, value);
  }
}

function applySiteMetadata(config) {
  const site = config.site || {};
  const title = site.og_title || site.title || "Paper visualization";
  const description = site.meta_description || site.subtitle || "Static paper visualization site";
  const themeColor = site.theme_color || "#faf9f5";
  const canonicalUrl = site.canonical_url || "";
  const ogUrl = site.og_url || canonicalUrl;
  const ogImage = site.og_image || "";
  const lang = site.lang || "en";

  document.documentElement.lang = lang;
  document.title = title;

  setOrCreateMeta('meta[name="description"]', {
    name: "description",
    content: description,
  });
  setOrCreateMeta('meta[name="theme-color"]', {
    name: "theme-color",
    content: themeColor,
  });
  setOrCreateMeta('meta[property="og:title"]', {
    property: "og:title",
    content: title,
  });
  setOrCreateMeta('meta[property="og:description"]', {
    property: "og:description",
    content: site.og_description || description,
  });
  setOrCreateMeta('meta[property="og:type"]', {
    property: "og:type",
    content: "website",
  });
  setOrCreateMeta('meta[property="og:url"]', {
    property: "og:url",
    content: ogUrl,
  });
  setOrCreateMeta('meta[property="og:image"]', {
    property: "og:image",
    content: ogImage,
  });
  setOrCreateMeta('meta[name="twitter:card"]', {
    name: "twitter:card",
    content: site.twitter_card || "summary",
  });
  setOrCreateMeta('meta[name="twitter:title"]', {
    name: "twitter:title",
    content: site.twitter_title || title,
  });
  setOrCreateMeta('meta[name="twitter:description"]', {
    name: "twitter:description",
    content: site.twitter_description || description,
  });
  setOrCreateLink('link[rel="canonical"]', {
    rel: "canonical",
    href: canonicalUrl,
  });

  document.querySelectorAll('link[data-generated="alternate"]').forEach((node) => node.remove());
  for (const alternate of site.alternates || []) {
    const link = document.createElement("link");
    link.setAttribute("rel", "alternate");
    link.setAttribute("hreflang", alternate.hreflang);
    link.setAttribute("href", alternate.href);
    link.setAttribute("data-generated", "alternate");
    document.head.appendChild(link);
  }
}

function renderBrand(config) {
  const site = config.site || {};
  const brandLink = document.getElementById("brand-link");
  const brandTitle = document.getElementById("brand-title");
  const brandMark = brandLink.querySelector(".brand-mark");

  brandTitle.textContent = site.short_title || site.title || "Paper Visualization";
  brandLink.href = site.brand_home_url || "#top";
  brandLink.setAttribute("aria-label", site.brand_aria_label || "Back to top");

  if (site.show_brand_mark) {
    brandMark.hidden = false;
  } else {
    brandMark.hidden = true;
  }
}

function renderLanguageSwitch(config) {
  const root = document.getElementById("lang-switch");
  const switchConfig = config.site?.language_switch;
  root.innerHTML = "";

  if (!switchConfig?.links?.length) {
    root.hidden = true;
    return;
  }

  root.hidden = false;
  if (switchConfig.aria_label) root.setAttribute("aria-label", switchConfig.aria_label);

  for (const link of switchConfig.links) {
    const node = create("a", `lang-link ${link.active ? "active" : ""}`.trim(), link.label);
    node.href = link.href;
    root.appendChild(node);
  }
}

function appendParagraphs(parent, paragraphs, proseClass = "prose") {
  if (!paragraphs?.length) return null;
  const prose = create("div", proseClass);
  for (const paragraph of paragraphs) {
    prose.appendChild(create("p", "", paragraph));
  }
  parent.appendChild(prose);
  return prose;
}

function appendHighlights(parent, highlights) {
  if (!highlights?.length) return null;
  const list = create("div", "pill-list");
  for (const item of highlights) {
    list.appendChild(create("span", "", item));
  }
  parent.appendChild(list);
  return list;
}

function buildFigure(figure, className = "media-card") {
  if (!figure?.src) return null;
  const node = create("figure", className);
  const img = create("img", "");
  img.src = figure.src;
  img.alt = figure.alt || "";
  img.loading = "lazy";
  img.decoding = "async";
  node.appendChild(img);
  if (figure.caption) node.appendChild(create("figcaption", "", figure.caption));
  return node;
}

function buildDataTable(table) {
  const wrap = create("figure", "data-table-wrap");
  if (table.caption) wrap.appendChild(create("figcaption", "table-caption", table.caption));

  const scroller = create("div", "table-scroller");
  const tableNode = create("table", "data-table");
  const thead = create("thead", "");
  const headerRow = create("tr", "");
  for (const header of table.headers || []) {
    headerRow.appendChild(create("th", "", header));
  }
  thead.appendChild(headerRow);
  tableNode.appendChild(thead);

  const tbody = create("tbody", "");
  for (const row of table.rows || []) {
    const tr = create("tr", row.highlight ? "highlight" : "");
    for (const cell of row.cells || []) tr.appendChild(create("td", "", cell));
    tbody.appendChild(tr);
  }
  tableNode.appendChild(tbody);
  scroller.appendChild(tableNode);
  wrap.appendChild(scroller);
  return wrap;
}

function renderTables(shell, tables) {
  if (!tables?.length) return;
  const grid = create("div", `table-grid count-${Math.min(tables.length, 2)}`);
  for (const table of tables) grid.appendChild(buildDataTable(table));
  shell.appendChild(grid);
}

function buildFeatureCard(card) {
  const node = create("article", "feature-card");
  node.appendChild(create("span", "feature-index", card.label || ""));
  node.appendChild(create("h3", "", card.title || ""));
  node.appendChild(create("p", "", card.body || ""));
  return node;
}

function buildDefinitionCard(card) {
  const node = create("article", "definition-card");
  node.appendChild(create("span", "", card.label || ""));
  node.appendChild(create("h3", "", card.title || ""));
  node.appendChild(create("p", "", card.body || ""));
  return node;
}

function buildLensCard(card) {
  const node = create("article", "pattern-card pattern-lens");
  node.appendChild(create("span", "pattern-tag", card.label || ""));
  node.appendChild(create("h3", "", card.title || ""));
  node.appendChild(create("p", "", card.body || ""));
  return node;
}

function buildStatCard(card) {
  const variant = card.variant ? ` ${card.variant}` : "";
  const node = create("article", `stat-panel${variant}`);
  if (card.metric) node.appendChild(create("span", "stat-number", card.metric));
  node.appendChild(create("h3", "", card.title || ""));
  node.appendChild(create("p", "", card.body || ""));
  return node;
}

function buildGenericCard(card) {
  const classes = ["generic-card"];
  if (card.variant) classes.push(card.variant);
  const node = create("article", classes.join(" "));

  if (card.label) node.appendChild(create("span", "card-label", card.label));
  if (card.metric) node.appendChild(create("span", "card-metric", card.metric));
  if (card.title) node.appendChild(create("h3", "", card.title));
  if (card.body) node.appendChild(create("p", "", card.body));

  if (card.items?.length) {
    const list = create("ul", "");
    for (const item of card.items) {
      list.appendChild(create("li", "", item));
    }
    node.appendChild(list);
  }

  return node;
}

function buildCalloutCard(card) {
  const node = create("article", "callout-card");
  if (card.title) node.appendChild(create("h3", "", card.title));
  if (card.body) node.appendChild(create("p", "", card.body));
  if (card.items?.length) {
    const list = create("ul", "");
    for (const item of card.items) {
      list.appendChild(create("li", "", item));
    }
    node.appendChild(list);
  }
  return node;
}

function buildCoralNote(card) {
  const node = create("article", "coral-note");
  if (card.label) node.appendChild(create("span", "", card.label));
  if (card.body) node.appendChild(create("p", "", card.body));
  return node;
}

function renderCardLayout(cards, layout = "", fallback = "grid") {
  if (!cards?.length) return null;

  const effectiveLayout = layout || fallback;

  if (effectiveLayout === "feature-grid") {
    const grid = create("div", `card-grid count-${Math.min(cards.length, 4)}`);
    for (const card of cards) grid.appendChild(buildFeatureCard(card));
    return grid;
  }

  if (effectiveLayout === "definitions") {
    const grid = create("div", "definition-grid");
    for (const card of cards) grid.appendChild(buildDefinitionCard(card));
    return grid;
  }

  if (effectiveLayout === "timeline") {
    const timeline = create("div", "timeline-card step-list");
    cards.forEach((card, index) => {
      const article = create("article", "");
      article.appendChild(create("span", "step-index", card.label || String(index + 1).padStart(2, "0")));
      const copy = create("div", "");
      copy.appendChild(create("h3", "", card.title || ""));
      copy.appendChild(create("p", "", card.body || ""));
      article.appendChild(copy);
      timeline.appendChild(article);
    });
    return timeline;
  }

  if (effectiveLayout === "lenses") {
    const grid = create("div", "pattern-lenses");
    for (const card of cards) grid.appendChild(buildLensCard(card));
    return grid;
  }

  if (effectiveLayout === "stats") {
    const grid = create("div", "stats-band");
    for (const card of cards) grid.appendChild(buildStatCard(card));
    return grid;
  }

  if (effectiveLayout === "stack") {
    const stack = create("div", "stack-list");
    for (const card of cards) {
      if (card.kind === "callout") {
        stack.appendChild(buildCalloutCard(card));
      } else if (card.variant === "accent") {
        stack.appendChild(buildCoralNote(card));
      } else {
        stack.appendChild(buildGenericCard(card));
      }
    }
    return stack;
  }

  const gridMatch = effectiveLayout.match(/^grid-(\d)$/);
  const gridCount = gridMatch ? Number(gridMatch[1]) : Math.min(cards.length, 4);
  const grid = create("div", `card-grid count-${gridCount}`);
  for (const card of cards) grid.appendChild(buildGenericCard(card));
  return grid;
}

function renderHeading(container, section, fallbackKicker) {
  const classes = ["section-heading"];
  if (section.wide_heading) classes.push("wide-heading");
  const heading = create("div", classes.join(" "));
  heading.appendChild(create("p", "kicker", section.kicker || fallbackKicker || ""));
  heading.appendChild(create("h2", "", section.title || ""));
  if (section.section_note) {
    heading.appendChild(create("p", "section-note", section.section_note));
  }
  container.appendChild(heading);
}

function renderNav(config) {
  const nav = document.getElementById("nav-links");
  nav.innerHTML = "";

  const items = [];
  if (config.summary !== false) {
    items.push({
      id: "summary",
      label: config.summary?.nav_label || config.summary?.kicker || "Summary",
    });
  }
  for (const section of config.sections || []) {
    items.push({ id: section.id, label: section.nav_label || section.kicker || section.title });
  }
  items.push({
    id: "citation",
    label: config.citation?.nav_label || config.citation?.kicker || "Citation",
  });

  for (const item of items) {
    const link = create("a", "", item.label);
    link.href = `#${item.id}`;
    nav.appendChild(link);
  }
}

function renderHero(config) {
  const root = document.getElementById("hero-root");
  const shell = create("div", "shell hero-shell");

  const copy = create("div", "hero-copy");
  copy.appendChild(create("p", "eyebrow", config.site?.kicker || ""));
  copy.appendChild(create("h1", "", config.site?.title || ""));
  copy.appendChild(create("p", "deck", config.site?.subtitle || ""));

  if (config.authors?.length || config.affiliations) {
    const authorBlock = create("div", "author-block");
    if (config.authors?.length) {
      authorBlock.appendChild(create("p", "authors", config.authors.join(", ")));
    }
    if (config.affiliations) {
      authorBlock.appendChild(create("p", "affiliations", config.affiliations));
    }
    copy.appendChild(authorBlock);
  }

  const buttonRow = create("div", "button-row");
  for (const link of config.site?.links || []) {
    const button = create("a", `button ${link.primary ? "primary" : "secondary"}`, link.label);
    button.href = link.href;
    if (/^https?:\/\//.test(link.href) || link.href.endsWith(".pdf")) {
      button.target = "_blank";
      button.rel = "noopener";
    }
    buttonRow.appendChild(button);
  }
  copy.appendChild(buttonRow);

  if (config.hero_facts?.length) {
    const facts = create("div", "hero-facts");
    for (const fact of config.hero_facts) {
      const article = create("article", "");
      article.appendChild(create("span", "fact-label", fact.label));
      article.appendChild(create("strong", "", fact.value));
      facts.appendChild(article);
    }
    copy.appendChild(facts);
  }

  shell.appendChild(copy);

  if (config.hero_figure?.caption) {
    shell.appendChild(create("p", "hero-caption", config.hero_figure.caption));
  }

  root.innerHTML = "";
  if (config.hero_figure?.src) {
    const visual = create("div", "hero-visual");
    const image = create("img", "hero-art");
    image.src = config.hero_figure.src;
    image.alt = config.hero_figure.alt || "";
    image.decoding = "async";
    image.fetchPriority = "high";
    visual.appendChild(image);
    root.appendChild(visual);
  }
  root.appendChild(shell);
}

function renderSummary(config) {
  const root = document.getElementById("summary-root");
  const summary = config.summary;
  if (!summary || summary.enabled === false) {
    root.innerHTML = "";
    root.hidden = true;
    return;
  }

  root.hidden = false;
  const shell = create("div", "shell");
  renderHeading(shell, {
    kicker: summary.kicker || "Summary",
    title: summary.title || "What this paper contributes",
  });

  const cards = renderCardLayout(summary.cards || [], summary.cards_layout || "feature-grid", "feature-grid");
  if (cards) shell.appendChild(cards);

  root.innerHTML = "";
  root.appendChild(shell);
}

function appendTextBlock(parent, section, proseClass = "prose") {
  appendParagraphs(parent, section.paragraphs || [], proseClass);
  appendHighlights(parent, section.highlights || []);
  const cards = renderCardLayout(section.cards || [], section.cards_layout || "", "grid");
  if (cards) parent.appendChild(cards);
}

function renderPlainSection(shell, section) {
  appendTextBlock(shell, section);
}

function renderSplitSection(shell, section) {
  const split = create("div", "split-layout");
  const textStack = create("div", "text-stack");
  appendTextBlock(textStack, section);
  const figure = buildFigure(section.figure, "media-card");

  if (figure && section.figure_first) {
    split.appendChild(figure);
    split.appendChild(textStack);
  } else {
    split.appendChild(textStack);
    if (figure) split.appendChild(figure);
  }

  shell.appendChild(split);
}

function renderFrameworkSection(shell, section) {
  const layout = create("div", "framework-layout");
  const figure = buildFigure(section.figure, "media-card figure-focus");
  if (figure) layout.appendChild(figure);

  const copy = create("div", "framework-copy");
  if (section.equation?.value) {
    const equationCard = create("article", "equation-card");
    equationCard.appendChild(create("span", "equation-label", section.equation.label || "Formalization"));
    equationCard.appendChild(create("code", "", section.equation.value));
    if (section.equation.body) equationCard.appendChild(create("p", "", section.equation.body));
    copy.appendChild(equationCard);
  }

  const definitions = renderCardLayout(section.cards || [], "definitions", "definitions");
  if (definitions) copy.appendChild(definitions);
  layout.appendChild(copy);
  shell.appendChild(layout);
}

function renderLifecycleSection(shell, section) {
  const layout = create("div", "lifecycle-layout");
  const figure = buildFigure(section.figure, "media-card figure-focus");
  if (figure) layout.appendChild(figure);
  const timeline = renderCardLayout(section.cards || [], "timeline", "timeline");
  if (timeline) layout.appendChild(timeline);
  shell.appendChild(layout);
}

function renderShowcaseSection(shell, section) {
  if (section.wide_figure) {
    const wideFigure = buildFigure(section.wide_figure, "wide-media");
    if (wideFigure) shell.appendChild(wideFigure);
  }

  const cards = renderCardLayout(section.cards || [], section.cards_layout || "lenses", "lenses");
  if (cards) shell.appendChild(cards);

  if (section.supporting_figures?.length) {
    const split = create("div", "media-gallery lower-split");
    for (const figure of section.supporting_figures) {
      const node = buildFigure(figure, "media-card");
      if (node) split.appendChild(node);
    }
    shell.appendChild(split);
  }
}

function renderStatsSection(shell, section) {
  const stats = renderCardLayout(section.cards || [], section.cards_layout || "stats", "stats");
  if (stats) shell.appendChild(stats);

  const figure = buildFigure(section.figure, "media-card");
  const proseWrap = create("div", "");
  appendParagraphs(proseWrap, section.paragraphs || [], section.prose_large ? "prose prose-large" : "prose");
  if (figure) {
    const split = create("div", "split-layout lower-split");
    split.appendChild(figure);
    split.appendChild(proseWrap);
    shell.appendChild(split);
  } else {
    proseWrap.classList.add("results-prose");
    shell.appendChild(proseWrap);
  }
}

function renderSection(section) {
  const sectionNode = create("section", `section ${section.theme === "soft" ? "band-soft" : ""}`);
  sectionNode.id = section.id;
  const shell = create("div", "shell");

  renderHeading(shell, section);

  if (section.layout === "framework") {
    renderFrameworkSection(shell, section);
  } else if (section.layout === "lifecycle") {
    renderLifecycleSection(shell, section);
  } else if (section.layout === "showcase") {
    renderShowcaseSection(shell, section);
  } else if (section.layout === "stats") {
    renderStatsSection(shell, section);
  } else if (section.layout === "split" || section.figure?.src) {
    renderSplitSection(shell, section);
  } else {
    renderPlainSection(shell, section);
  }

  renderTables(shell, section.tables || []);

  sectionNode.appendChild(shell);
  return sectionNode;
}

function renderSections(config) {
  const root = document.getElementById("sections-root");
  root.innerHTML = "";
  for (const section of config.sections || []) {
    root.appendChild(renderSection(section));
  }
}

function renderCitation(config) {
  const root = document.getElementById("citation");
  const shell = create("div", "shell citation-shell");
  renderHeading(shell, {
    kicker: config.citation?.kicker || "Citation",
    title: config.citation?.title || "Cite the paper directly",
  });

  const toolbar = create("div", "citation-toolbar");
  toolbar.appendChild(create("p", "", config.citation?.note || ""));
  const button = create("button", "button secondary");
  button.id = "copy-citation";
  button.type = "button";
  button.textContent = config.citation?.button_label || "Copy BibTeX";
  button.dataset.defaultLabel = button.textContent;
  button.dataset.copiedLabel = config.citation?.copied_label || "Copied";
  button.dataset.errorLabel = config.citation?.error_label || "Copy failed";
  toolbar.appendChild(button);
  shell.appendChild(toolbar);

  const pre = create("pre", "");
  pre.id = "citation-block";
  pre.textContent = config.citation?.bibtex || "";
  shell.appendChild(pre);

  root.innerHTML = "";
  root.appendChild(shell);
}

function renderFooter(config) {
  const footer = document.getElementById("site-footer");
  const root = document.getElementById("footer-root");
  const footerConfig = config.footer || {};
  root.innerHTML = "";

  if (footerConfig.enabled === false || (!footerConfig.left && !footerConfig.right)) {
    footer.hidden = true;
    return;
  }

  footer.hidden = false;
  root.appendChild(create("p", "", footerConfig.left || ""));
  root.appendChild(create("p", "", footerConfig.right || ""));
}

function setCopyButtonLabel(button, label) {
  const defaultLabel = button.dataset.defaultLabel || button.textContent;
  button.textContent = label;
  setTimeout(() => {
    button.textContent = defaultLabel;
  }, 1400);
}

function fallbackCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  document.body.removeChild(textarea);
  return copied;
}

async function copyCitationText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopyText(text);
    }
  }
  return fallbackCopyText(text);
}

function setupCopyCitation() {
  const copyButton = document.getElementById("copy-citation");
  const citationBlock = document.getElementById("citation-block");
  if (!copyButton || !citationBlock) return;

  copyButton.addEventListener("click", async () => {
    const citationText = citationBlock.textContent.trim();
    try {
      const copied = await copyCitationText(citationText);
      setCopyButtonLabel(
        copyButton,
        copied ? copyButton.dataset.copiedLabel || "Copied" : copyButton.dataset.errorLabel || "Copy failed",
      );
    } catch {
      setCopyButtonLabel(copyButton, copyButton.dataset.errorLabel || "Copy failed");
    }
  });
}

function setupNavObserver() {
  const navLinks = [...document.querySelectorAll(".nav-scroll a")];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = `#${entry.target.id}`;
        for (const link of navLinks) {
          link.classList.toggle("active", link.getAttribute("href") === id);
        }
      }
    },
    {
      rootMargin: "-35% 0px -55% 0px",
      threshold: 0.01,
    },
  );

  for (const section of sections) {
    observer.observe(section);
  }
}

async function main() {
  try {
    const config = await loadConfig();
    applySiteMetadata(config);
    renderBrand(config);
    renderLanguageSwitch(config);
    renderNav(config);
    renderHero(config);
    renderSummary(config);
    renderSections(config);
    renderCitation(config);
    renderFooter(config);
    setupCopyCitation();
    setupNavObserver();
  } catch (error) {
    document.body.innerHTML = `<pre style="padding:24px;">${String(error)}</pre>`;
  }
}

main();
