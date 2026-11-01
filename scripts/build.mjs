import { writeFile } from 'node:fs/promises';
import { chapters } from '../content/chapters.mjs';

const root = new URL('../', import.meta.url);
const links = chapters.map((c, i) => `<a class="memory" href="#chapter-${c.id}" data-memory="${c.id}" style="--x:${c.x}%;--y:${c.y}%" aria-label="${i + 1}. ${c.name}, ${c.place}, ${c.time}"><span class="memory-star" aria-hidden="true">${c.symbol}</span><span class="memory-label"><strong>${c.place}</strong><span>${c.time}</span></span></a>`).join('\n');
const paths = chapters.map(c => `<path data-path="${c.id}" pathLength="1" d="M 768 882 C 730 720, ${c.x < 50 ? 680 : 870} 500, ${c.x * 15.36} ${c.y * 10.24}"/>`).join('');
const chapterHTML = c => `<p class="chapter-time">${c.place} <span> / </span> ${c.time}</p><h3>${c.title}</h3><p class="chapter-intro">${c.text}</p><div class="chapter-body">${c.body}</div><p class="chapter-note">${c.note}</p>`;
const chronicle = chapters.map((c, i) => `<details id="chapter-${c.id}" class="chapter"><summary><span class="chapter-number">${String(i + 1).padStart(2, '0')}</span><span>${c.name}</span><span class="summary-time">${c.time}</span><span class="summary-plus" aria-hidden="true">+</span></summary><div class="chapter-content">${chapterHTML(c)}</div></details>`).join('\n');
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#080f1b">
<meta name="description" content="Vikram's Tree of Paths. An interactive life story across Dubai, Sydney, UCLA, Cornell, software, research and the chapters still unwritten.">
<title>Vikram · The Tree of Paths</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='20' fill='%23080f1b'/%3E%3Cpath d='M20 34V5M20 21L8 9M20 15L32 5M20 28L32 16M20 32L10 25' stroke='%23d4ad70' fill='none'/%3E%3C/svg%3E">
<link rel="preload" as="image" href="tree-of-paths.png">
<link rel="stylesheet" href="style.css">
<script type="module" src="app.mjs"></script>
</head>
<body>
<a class="skip-link" href="#chronicle">Read the chronicle</a>
<header class="site-header"><a class="wordmark" href="https://github.com/vikramwish"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 36V4M20 21L7 8M20 15L33 3M20 29L34 15M20 33L8 23"/></svg><span>Vikram</span></a><span class="header-caption">A life, still branching.</span><nav aria-label="Main"><a href="#chronicle">The chronicle</a><a href="https://github.com/vikramwish">GitHub <span aria-hidden="true">↗</span></a></nav></header>
<main>
<section class="world" aria-labelledby="title">
  <div class="tree-scene">
    <img class="tree-image" src="tree-of-paths.png" width="1536" height="1024" alt="An immense tree of luminous golden paths rises above distant walls. A lone traveler stands among its roots." fetchpriority="high">
    <div class="scene-shade" aria-hidden="true"></div>
    <svg class="paths" viewBox="0 0 1536 1024" aria-hidden="true">${paths}</svg>
    <div class="motes" aria-hidden="true">${Array.from({length:12},(_,i)=>`<i style="--i:${i};--left:${12+(i*31)%78}%;--top:${15+(i*17)%66}%"></i>`).join('')}</div>
    <div class="title-block"><p class="book-title">The Tree of Paths</p><h1 id="title">All the paths<br>that made me.</h1><p>Places. People. Questions.<br>And everything still to come.</p></div>
    <nav class="memories" aria-label="Memories in the tree">${links}</nav>
    <div class="tree-caption"><span class="caption-line" aria-hidden="true"></span><p>Every light holds a chapter.<br><span>Choose one. Follow it home.</span></p></div>
  </div>
  <div class="world-toolbar"><a class="journey-start" href="#chapter-roots" data-memory="roots">Follow my path <span aria-hidden="true">↗</span></a><p id="progress" aria-live="polite">Nine chapters. One unfinished story.</p><div class="world-actions"><button id="motion" type="button" aria-pressed="false" hidden>Stillness</button><a href="tree-of-paths.png" download="vikram-tree-of-paths.png">Keep the artwork <span aria-hidden="true">↓</span></a></div></div>
</section>
<section class="chronicle" id="chronicle" aria-labelledby="chronicle-title">
  <div class="chronicle-heading"><div><p class="book-title">The human behind the branches</p><h2 id="chronicle-title">A chronicle in progress.</h2></div><p>I’m Vikram. I build reliable software, <br>teach Python, and follow questions <br>across disciplines and borders.</p></div>
  <div class="chapter-list">${chronicle}</div>
  <section class="tools" aria-labelledby="tools-title"><h3 id="tools-title">Tools carried along the way</h3><dl><dt>Programming</dt><dd>Python, HTML, CSS, Bash</dd><dt>Testing & delivery</dt><dd>Selenium, Playwright, GitHub Actions, Docker</dd><dt>Cloud & integration</dt><dd>Azure, Cosmos DB, AWS Lambda, REST APIs, MCP</dd><dt>AI coding tools</dt><dd>Claude Code, Codex, Cursor, GitHub Copilot</dd></dl></section>
</section>
</main>
<dialog id="memory-dialog" aria-labelledby="memory-title">
  <div class="dialog-top"><p id="memory-position"></p><button id="close-memory" type="button" aria-label="Close memory">×</button></div>
  <div id="memory-content"></div>
  <nav class="memory-pagination" aria-label="Journey"><button id="previous-memory" type="button">Previous</button><button id="next-memory" type="button">Next chapter <span aria-hidden="true">↗</span></button></nav>
</dialog>
<footer><p>A life is more than the sum of its branches.</p><div><a href="https://www.linkedin.com/in/vikram-vish/">Find me on LinkedIn ↗</a><a href="https://github.com/vikramwish/vikramwish">View source ↗</a></div><small>Original artwork inspired by the Tree of Life and the atmosphere of Attack on Titan.</small></footer>
</body>
</html>`;
await writeFile(new URL('docs/index.html', root), html);
const readme = `<p align="center"><sub>V I K R A M</sub></p>
<h1 align="center">The Tree of Paths</h1>
<p align="center"><em>All the paths that made me. And everything still to come.</em></p>

<a href="https://vikramwish.github.io/vikramwish/"><img src="docs/tree-of-paths.png" alt="Vikram's Tree of Paths: an immense luminous tree, a lone traveler at its roots, and a world beyond the walls. Enter to explore the memories in its branches." width="100%"></a>

<p align="center"><a href="https://vikramwish.github.io/vikramwish/"><strong>Enter the tree ↗</strong></a><br><sub>Choose a light. Unfold a memory. Follow the branches of my life.</sub></p>

I'm **Vikram** — a final-year **Software Engineering (Honours)** student at the **University of Sydney**, graduating in **2027**. I build reliable software, teach Python, and follow questions across disciplines and borders. I'm looking for a graduate software engineering role starting in February.

### Every branch holds a chapter.

${chapters.map(c=>`<details>\n<summary><strong>${c.symbol} ${c.name}</strong> — ${c.place} · ${c.time}</summary>\n<br>\n<h3>${c.title}</h3>\n${c.body}\n<p><em>${c.note}</em></p>\n<p><a href="https://vikramwish.github.io/vikramwish/#${c.id}">Visit this memory in the tree ↗</a></p>\n</details>`).join('\n\n')}

### Tools carried along the way

| Craft | Tools |
| :--- | :--- |
| Programming | Python, HTML, CSS, Bash |
| Testing & delivery | Selenium, Playwright, GitHub Actions, Docker |
| Cloud & integration | Azure, Cosmos DB, AWS Lambda, REST APIs, MCP |
| AI coding tools | Claude Code, Codex, Cursor, GitHub Copilot |

<p align="center"><em>A life is more than the sum of its branches.</em><br><br><a href="https://www.linkedin.com/in/vikram-vish/">LinkedIn</a> · <a href="https://github.com/vikramwish?tab=repositories">The workshop</a> · <a href="https://vikramwish.github.io/vikramwish/">The Tree of Paths</a></p>

<sub>Original artwork inspired by the Tree of Life and the atmosphere of Attack on Titan. The branches tell my own story.</sub>
`;
await writeFile(new URL('README.md', root), readme);
console.log(`Built the README and site from ${chapters.length} shared life chapters.`);
