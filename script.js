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
