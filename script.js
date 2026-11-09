(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = false;
  try { userPaused = localStorage.getItem('heshan-motion') === 'paused'; } catch (_) { /* Storage is optional. */ }
  let paused = userPaused || reduced.matches;
  let frame = 0;
  let inView = true;
  let currentMode = 'ai';
  let elapsed = 0;
  let lastTime = 0;
  const motionButton = $('#motion-toggle');
  const menu = $('.menu-toggle');
  const mobileNav = $('#mobile-nav');
  $('#year').textContent = String(new Date().getFullYear());
  function setMenu(open) {
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    mobileNav.hidden = !open;
  }
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  $$('#mobile-nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 761px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  // Content stays visible without JavaScript or when motion is paused.
  if ('IntersectionObserver' in window && !paused) {
    root.classList.add('motion-ready');
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); reveal.unobserve(entry.target); }
    }), { threshold: 0.08 });
    $$('.reveal').forEach(el => reveal.observe(el));
  }
  const sections = $$('main section[id]');
  if ('IntersectionObserver' in window) {
    const active = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) $$('.desktop-nav a').forEach(a => {
        const selected = a.hash === `#${entry.target.id}`;
        a.classList.toggle('active', selected);
        if (selected) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    }), { rootMargin: '-15% 0px -55% 0px' });
    sections.forEach(section => active.observe(section));
  }
  let scrollTick = false;
  function progress() {
    const height = root.scrollHeight - window.innerHeight;
    $('.reading-progress').style.transform = `scaleX(${height > 0 ? window.scrollY / height : 0})`;
    scrollTick = false;
  }
  window.addEventListener('scroll', () => { if (!scrollTick) { requestAnimationFrame(progress); scrollTick = true; } }, { passive: true });
  window.addEventListener('resize', progress);
  progress();

  const projects = {
    medilink: { label: 'CAMPUS COLLABORATION / HEALTHCARE', title: 'MediLink', intro: 'A campus healthcare application, built collaboratively to explore practical healthcare software.', focus: 'Contributing Angular frontend interfaces and FastAPI backend models, including medication schedules and adherence. This is academic project work.', tags: ['Angular', 'FastAPI', 'PostgreSQL', 'SQLAlchemy'], href: 'https://github.com/nexora-neural/medilink-backend', link: 'Explore the backend repository ↗' },
    bookhive: { label: 'FRONTEND EXPLORATION / ANGULAR', title: 'BookHive', intro: 'A book-themed Angular frontend project that turns interface ideas into reusable components.', focus: 'Developing practical frontend skills through page layouts, component structure, and a book-focused browsing experience.', tags: ['Angular', 'TypeScript', 'Frontend development'], href: 'https://github.com/heshanbandara', link: 'Visit my GitHub profile ↗' },
    ai: { label: 'ONGOING LEARNING / ARTIFICIAL INTELLIGENCE', title: 'Intelligence, explored.', intro: 'Hands-on learning projects exploring document-based assistants, retrieval-augmented generation, and agent workflows.', focus: 'Learning how LLMs use retrieved context, how document-based assistants work, and how LangChain and LangGraph can connect steps in an AI workflow.', tags: ['Python', 'LLMs', 'RAG', 'LangChain', 'LangGraph'], href: 'https://github.com/heshanbandara', link: 'Follow my learning on GitHub ↗' }
  };
  const projectDialog = $('#project-dialog');
  let projectTrigger = null;
  $$('[data-project]').forEach(button => button.addEventListener('click', () => {
    const project = projects[button.dataset.project];
    if (!project) return;
    projectTrigger = button;
    $('#dialog-label').textContent = project.label;
    $('#dialog-title').textContent = project.title;
    $('#dialog-intro').textContent = project.intro;
    $('#dialog-focus').textContent = project.focus;
    $('#dialog-tags').replaceChildren(...project.tags.map(tag => { const span = document.createElement('span'); span.textContent = tag; return span; }));
    $('#dialog-link').href = project.href;
    $('#dialog-link').textContent = project.link;
    projectDialog.showModal();
  }));
  $('.dialog-close').addEventListener('click', () => projectDialog.close());
  projectDialog.addEventListener('close', () => projectTrigger?.focus({ preventScroll: true }));
  [projectDialog, $('#command-dialog')].forEach(dialog => dialog.addEventListener('click', e => {
    if (e.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close();
  }));

  $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    $$('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    let count = 0;
    $$('.project').forEach(project => {
      const visible = filter === 'all' || project.dataset.category === filter;
      project.hidden = !visible;
      if (visible) { count++; project.classList.add('visible'); if (!paused && typeof project.animate === 'function') project.animate([{opacity:0,translate:'0 14px'},{opacity:1,translate:'0 0'}],{duration:350,easing:'ease-out'}); }
    });
    $('#filter-status').textContent = `${count} project${count === 1 ? '' : 's'} shown.`;
  }));

  const commandDialog = $('#command-dialog');
  const search = $('#command-search');
  const commandLinks = $$('#command-dialog nav a');
  function filterCommands() {
    const query = search.value.trim().toLowerCase();
    commandLinks.forEach(a => { a.hidden = !a.textContent.toLowerCase().includes(query); });
    $('#command-empty').hidden = commandLinks.some(a => !a.hidden);
  }
  function openCommands() {
    if (projectDialog.open) return;
    search.value = ''; filterCommands();
    commandDialog.showModal(); search.focus();
  }
  $('.command-trigger').addEventListener('click', openCommands);
  $('.command-close').addEventListener('click', () => commandDialog.close());
  search.addEventListener('input', filterCommands);
  search.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); commandLinks.find(a => !a.hidden)?.click(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); commandLinks.find(a => !a.hidden)?.focus(); }
  });
  commandLinks.forEach(a => a.addEventListener('click', () => commandDialog.close()));
  commandDialog.addEventListener('close', () => $('.command-trigger').focus({ preventScroll: true }));
  document.addEventListener('keydown', e => {
    const typing = e.target instanceof Element && (e.target.matches('input, textarea, select') || e.target.isContentEditable);
    if ((e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing && !projectDialog.open)) {
      e.preventDefault(); if (commandDialog.open) commandDialog.close(); else openCommands();
    }
  });
  $('#copy-profile').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('https://github.com/heshanbandara');
      $('#copy-status').textContent = 'GitHub link copied.';
    } catch (_) { $('#copy-status').textContent = 'Copy this link: https://github.com/heshanbandara'; }
  });

  // The canvas is a decorative visual, with a single animation loop that stops offscreen.
  const canvas = $('#constellation');
  const ctx = canvas.getContext('2d');
  const stage = $('.visual-stage');
  let width = 0, height = 0;
  let pointer = { x: 0, y: 0 };
  function sizeCanvas() {
    const rect = stage.getBoundingClientRect(); width = rect.width; height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    if (ctx) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw(elapsed); }
  }
  function draw(t) {
    if (!ctx || !width) return;
    ctx.clearRect(0, 0, width, height);
    const cx = width * .5 + pointer.x * 6, cy = height * .44 + pointer.y * 6;
    const radius = width * .29;
    ctx.strokeStyle = 'rgba(214,246,91,.12)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, radius * 1.16, 0, Math.PI * 2); ctx.stroke();
    const points = [];
    const spin = t * .00013;
    const color = currentMode === 'creative' ? '208,190,255' : currentMode === 'mobile' ? '151,222,198' : '214,246,91';
    for (let ring = 0; ring < 3; ring++) {
      const angle = ring * Math.PI / 3 + spin;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
      ctx.beginPath(); ctx.ellipse(0, 0, radius, radius * .42, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color},${.22 + ring * .09})`; ctx.stroke(); ctx.restore();
      for (let i = 0; i < 8; i++) {
        const phase = i / 8 * Math.PI * 2 + spin * (ring % 2 ? -1 : 1);
        const x = Math.cos(phase) * radius, y = Math.sin(phase) * radius * .42;
        points.push({x: cx + x * Math.cos(angle) - y * Math.sin(angle), y: cy + x * Math.sin(angle) + y * Math.cos(angle), r: i % 3 === 0 ? 2.8 : 1.5});
      }
    }
    if (currentMode === 'ai') {
      for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
        const distance = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
        if (distance < radius * .65 && distance > 22) {
          ctx.strokeStyle = `rgba(${color},${(1 - distance / (radius * .65)) * .18})`;
          ctx.beginPath(); ctx.moveTo(points[i].x, points[i].y); ctx.lineTo(points[j].x, points[j].y); ctx.stroke();
        }
      }
    } else if (currentMode === 'mobile') {
      ctx.strokeStyle = `rgba(${color},.5)`; ctx.lineWidth = 1;
      const pw = width * .31, ph = height * .4;
      ctx.strokeRect(cx - pw / 2, cy - ph / 2, pw, ph);
      ctx.beginPath(); ctx.moveTo(cx - pw * .15, cy - ph * .4); ctx.lineTo(cx + pw * .15, cy - ph * .4); ctx.stroke();
    } else {
      ctx.strokeStyle = `rgba(${color},.5)`; ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const x = cx - radius + i / 80 * radius * 2;
        const y = cy + Math.sin(i * .25 + t * .0015) * Math.sin(i / 80 * Math.PI) * radius * .32;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    points.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color},.85)`; ctx.fill();
    });
    ctx.strokeStyle = `rgba(${color},.18)`;
    for (let i = 0; i < 48; i++) {
      const a = i / 48 * Math.PI * 2, r = radius * 1.29;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.lineTo(cx + Math.cos(a) * (r + (i % 4 === 0 ? 6 : 2)), cy + Math.sin(a) * (r + (i % 4 === 0 ? 6 : 2))); ctx.stroke();
    }
  }
  function animate(time) {
    frame = 0;
    if (paused || !inView || document.hidden || !ctx) { lastTime = 0; return; }
    elapsed += lastTime ? Math.min(time - lastTime, 50) : 0; lastTime = time;
    draw(elapsed); frame = requestAnimationFrame(animate);
  }
  function syncAnimation() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; lastTime = 0;
    if (!paused && inView && !document.hidden && ctx) frame = requestAnimationFrame(animate); else draw(elapsed);
  }
  function setMotion() {
    paused = userPaused || reduced.matches;
    root.classList.toggle('motion-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    $('.motion-label').textContent = reduced.matches ? 'Reduced motion' : paused ? 'Resume motion' : 'Pause motion';
    $('.motion-icon').textContent = paused ? '▷' : 'Ⅱ';
    motionButton.disabled = reduced.matches;
    motionButton.title = reduced.matches ? 'Your device prefers reduced motion.' : '';
    syncAnimation();
  }
  motionButton.addEventListener('click', () => {
    userPaused = !userPaused;
    try { localStorage.setItem('heshan-motion', userPaused ? 'paused' : 'playing'); } catch (_) { /* Keep a session-only setting. */ }
    setMotion();
  });
  reduced.addEventListener('change', setMotion);
  const captions = { ai: ['Connecting ideas.', 'Artificial intelligence.'], mobile: ['From idea to interface.', 'Flutter mobile development.'], creative: ['Every frame has a story.', 'Video & visual storytelling.'] };
  $$('[data-mode]').forEach(button => button.addEventListener('click', () => {
    currentMode = button.dataset.mode;
    $$('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    const [line, title] = captions[currentMode];
    $('#visual-caption').replaceChildren(document.createTextNode(line), document.createElement('br'));
    const strong = document.createElement('strong'); strong.textContent = title; $('#visual-caption').append(strong);
    $('.stage-index').textContent = `${currentMode === 'ai' ? '01' : currentMode === 'mobile' ? '02' : '03'} — 03`;
    draw(elapsed);
  }));
  if ('ResizeObserver' in window) new ResizeObserver(sizeCanvas).observe(stage); else window.addEventListener('resize', sizeCanvas);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { inView = entries[0].isIntersecting; syncAnimation(); }).observe(stage);
  document.addEventListener('visibilitychange', syncAnimation);
  stage.addEventListener('pointermove', e => {
    if (paused || e.pointerType !== 'mouse') return;
    const r = stage.getBoundingClientRect();
    pointer = { x: (e.clientX - r.left) / r.width - .5, y: (e.clientY - r.top) / r.height - .5 };
    stage.style.setProperty('--stage-y', `${pointer.x * 5}deg`); stage.style.setProperty('--stage-x', `${-pointer.y * 5}deg`);
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { pointer = { x: 0, y: 0 }; stage.style.setProperty('--stage-y', '0deg'); stage.style.setProperty('--stage-x', '0deg'); });
  $('.project-preview').forEach(card => card.addEventListener('pointermove', event => {
    if (paused || event.pointerType !== 'mouse') return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--spot-x', (event.clientX - rect.left) + 'px');
    card.style.setProperty('--spot-y', (event.clientY - rect.top) + 'px');
  }, {passive:true}));
  sizeCanvas(); setMotion();
})();
