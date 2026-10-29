const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
}
menu?.addEventListener('click', () => {
  const expanded = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!expanded));
  navigation.classList.toggle('open', !expanded);
});
navigation?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation?.classList.contains('open')) {
    closeMenu();
    menu.focus();
  }
});
document.querySelectorAll('[data-year]').forEach(node => { node.textContent = new Date().getFullYear(); });
const form = document.querySelector('#brief-form');
if (form) {
  const interest = new URLSearchParams(location.search).get('service');
  if (['training', 'consulting', 'products'].includes(interest)) form.elements.interest.value = interest;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const selection = form.elements.interest.selectedOptions[0].textContent;
    const brief = `DATAFLOWPH — PROJECT BRIEF\n\nName: ${fields.get('name').trim()}\nOrganization: ${fields.get('organization').trim()}\nInterest: ${selection}\n\nOur challenge / goals\n${fields.get('challenge').trim()}\n\nPrepared locally. This brief has not been sent to DataflowPH.\n`;
    const url = URL.createObjectURL(new Blob([brief], { type: 'text/plain;charset=utf-8' }));
    const download = document.createElement('a');
    download.href = url;
    download.download = 'DataflowPH-project-brief.txt';
    document.body.append(download);
    download.click();
    download.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    document.querySelector('#form-status').textContent = 'Your brief is ready. Email the downloaded file to jhoiclemente@gmail.com. Nothing has been sent.';
  });
}

// Motion is an enhancement: content stays visible without JavaScript, and the
// operating-system preference always takes priority over a saved preference.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const motionButton = document.querySelector('.motion-toggle');
const appearanceAnimations = new Set();
const depthSurfaces = [...document.querySelectorAll('.flow-visual, .service-card')];
let motionPreference = 'active';
try {
  if (localStorage.getItem('dataflow-motion') === 'paused') motionPreference = 'paused';
} catch { /* Motion controls also work when browser storage is unavailable. */ }

function motionEnabled() {
  return !reducedMotion.matches && motionPreference === 'active';
}
function resetDepth(element) {
  element.style.removeProperty('--tilt-x');
  element.style.removeProperty('--tilt-y');
  element.style.removeProperty('--pointer-x');
  element.style.removeProperty('--pointer-y');
}
function updateMotion() {
  const paused = !motionEnabled();
  document.documentElement.dataset.motion = paused ? 'paused' : 'active';
  if (motionButton) {
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.querySelector('span').textContent = paused ? 'Resume motion' : 'Pause motion';
  }
  if (paused) {
    appearanceAnimations.forEach(animation => animation.finish());
    depthSurfaces.forEach(resetDepth);
  }
}
updateMotion();
reducedMotion.addEventListener('change', updateMotion);
motionButton?.addEventListener('click', () => {
  motionPreference = motionPreference === 'active' ? 'paused' : 'active';
  try { localStorage.setItem('dataflow-motion', motionPreference); } catch { /* Optional storage. */ }
  updateMotion();
});

function appear(element, delay = 0) {
  if (!motionEnabled() || !element.animate) return;
  const animation = element.animate([
    { opacity: 0, translate: '0 18px' },
    { opacity: 1, translate: '0 0' }
  ], { duration: 650, delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
  appearanceAnimations.add(animation);
  animation.finished.then(() => appearanceAnimations.delete(animation)).catch(() => appearanceAnimations.delete(animation));
}

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const siblings = [...entry.target.parentElement.children];
      const stagger = entry.target.matches('.service-card, .values article') ? Math.min(siblings.indexOf(entry.target), 2) * 85 : 0;
      appear(entry.target, stagger);
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .08 });
  document.querySelectorAll('.hero-copy, .flow-stage, .section-heading, .service-card, .approach-grid > div, .steps li, .research-label, .research-grid > div:last-child, .demo-workbench, .values article, .page-intro, .contact-grid > div, form, .cta-inner').forEach(element => revealObserver.observe(element));

  const flowStage = document.querySelector('.flow-stage');
  if (flowStage) {
    const flowObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { entry.target.dataset.inView = String(entry.isIntersecting); });
    });
    flowObserver.observe(flowStage);
  }
}
// Keyboard focus should never arrive at a partially faded control.
document.addEventListener('focusin', () => appearanceAnimations.forEach(animation => animation.finish()));

// Only mouse/trackpad pointers add a small perspective shift. Work is coalesced
// to one frame, with no continuous rendering loop or device-motion access.
depthSurfaces.forEach(surface => {
  let frame = 0;
  surface.addEventListener('pointermove', event => {
    if (!motionEnabled() || !finePointer.matches) return;
    cancelAnimationFrame(frame);
    const { clientX, clientY } = event;
    frame = requestAnimationFrame(() => {
      if (!motionEnabled() || !finePointer.matches) return;
      const rect = surface.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      const amount = surface.matches('.flow-visual') ? 4 : 2;
      surface.style.setProperty('--tilt-x', `${(0.5 - y) * amount}deg`);
      surface.style.setProperty('--tilt-y', `${(x - 0.5) * amount}deg`);
      surface.style.setProperty('--pointer-x', `${x * 100}%`);
      surface.style.setProperty('--pointer-y', `${y * 100}%`);
    });
  }, { passive: true });
  surface.addEventListener('pointerleave', () => {
    cancelAnimationFrame(frame);
    resetDepth(surface);
  });
});
finePointer.addEventListener('change', () => depthSurfaces.forEach(resetDepth));

// Fictional examples show the shape of a solution; no documents are uploaded
// and no live extraction or customer results are implied.
const workflowExamples = {
  finance: {
    name: 'Finance', kicker: 'ACCOUNTS PAYABLE', title: 'Supplier invoice',
    copy: 'Invoice INV-2026-014 from Sample Supply Co., dated 14 October 2026. Total amount due: PHP 24,800.00.',
    tag: 'Invoice · PDF or scan',
    rows: [['Document ID', 'INV-2026-014'], ['Supplier', 'Sample Supply Co.'], ['Date', '2026-10-14'], ['Total', 'PHP 24,800.00']],
    outcome: 'A consistent starting point for reconciliation, reporting, and downstream workflows.'
  },
  healthcare: {
    name: 'Healthcare', kicker: 'REFERRAL COORDINATION', title: 'Referral note',
    copy: 'Referral REF-2026-028 for Sample Patient A, dated 14 October 2026. Requested department: Imaging. Priority: routine.',
    tag: 'Referral · Text or scan',
    rows: [['Referral ID', 'REF-2026-028'], ['Patient', 'Sample Patient A'], ['Department', 'Imaging'], ['Priority', 'Routine']],
    outcome: 'Consistent fields for administrative routing and record organization, subject to privacy and validation requirements.'
  },
  operations: {
    name: 'Operations', kicker: 'INVENTORY & RECEIVING', title: 'Goods received note',
    copy: 'Delivery GRN-2026-052 received at Sample Warehouse on 14 October 2026. Item: packaging cartons. Quantity: 120 units.',
    tag: 'Delivery note · PDF or scan',
    rows: [['Receipt ID', 'GRN-2026-052'], ['Location', 'Sample Warehouse'], ['Item', 'Packaging cartons'], ['Quantity', '120 units']],
    outcome: 'Organized receiving data to connect inventory records, reporting, and operational workflows.'
  }
};
const exampleTabs = [...document.querySelectorAll('[data-example]')];
const examplePanel = document.querySelector('#example-panel');
function selectExample(tab) {
  const example = workflowExamples[tab.dataset.example];
  if (!example || !examplePanel) return;
  exampleTabs.forEach(button => {
    const selected = button === tab;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  examplePanel.setAttribute('aria-labelledby', tab.id);
  for (const key of ['kicker', 'title', 'copy', 'tag', 'outcome']) {
    examplePanel.querySelector(`[data-demo-${key}]`).textContent = example[key];
  }
  const body = examplePanel.querySelector('[data-demo-rows]');
  body.replaceChildren(...example.rows.map(([field, value]) => {
    const row = document.createElement('tr');
    const heading = document.createElement('th');
    heading.scope = 'row';
    heading.textContent = field;
    const cell = document.createElement('td');
    cell.textContent = value;
    row.append(heading, cell);
    return row;
  }));
  document.querySelector('[data-demo-status]').textContent = `${example.name} example selected. Sample document and structured fields updated.`;
  // A new selection replaces any in-flight transition rather than stacking it.
  examplePanel.getAnimations().forEach(animation => animation.finish());
  appear(examplePanel);
}
exampleTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectExample(tab));
  tab.addEventListener('keydown', event => {
    let target;
    if (event.key === 'ArrowRight') target = (index + 1) % exampleTabs.length;
    if (event.key === 'ArrowLeft') target = (index - 1 + exampleTabs.length) % exampleTabs.length;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = exampleTabs.length - 1;
    if (target === undefined) return;
    event.preventDefault();
    exampleTabs[target].focus();
    selectExample(exampleTabs[target]);
  });
});
