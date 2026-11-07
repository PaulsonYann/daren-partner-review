/* One identity and navigation layout for the three KOL tabs. */
function enhanceV10Drawer(id, tab) {
  const drawer = document.querySelector('.v9drawer:not(.feedrawer)');
  const k = own().find(k => k.id === id);
  if (!drawer || !k || drawerId !== id) return;
  const body = drawer.querySelector('.drawerbody');
  const form = body?.querySelector('#inlineprofile');
  const head = drawer.querySelector(tab === 'info' ? '.v9profile-header' : '.v9drawer-head');
  if (!head || !body) return;
  drawer.classList.add('v10-kol-drawer');
  drawer.dataset.v10Tab = tab;
  head.classList.add('v10-drawer-head');
  const top = drawer.querySelector(':scope > .drawer-top');
  const close = top?.querySelector('#closedrawer') || head.querySelector('#closedrawer');
  const closingFocused = close && document.activeElement === close;
  if (close) {
    close.type = 'button';
    close.classList.add('v10-drawer-close');
    head.append(close);
  }
  top?.remove();
  if (closingFocused) close.focus({preventScroll: true});
  const identity = head.querySelector('.draweridentity');
  const quick = head.querySelector('.v9drawer-quick');
  const avatarNode = identity?.querySelector('.avatar');
  const content = document.createElement('div');
  content.className = 'v10-identity-content';
  const line = document.createElement('div');
  line.className = 'v10-identity-line';
  if (tab === 'info' && form) {
    const name = form.querySelector('[data-profilefield="name"]');
    const tags = form.querySelector('.v9identity-tags');
    name.classList.add('v10-identity-name');
    name.id = 'v10-kol-name';
    name.setAttribute('role', 'heading');
    name.setAttribute('aria-level', '2');
    name.setAttribute('aria-label', k.name);
    name.querySelector('.v8display')?.setAttribute('aria-label', k.name + '，编辑KOL名称');
    line.append(name, tags);
  } else {
    line.innerHTML = `<h2 class="v10-identity-name v10-name-readonly" id="v10-kol-name">${esc(k.name)}</h2><div class="v9identity-tags">${gradeMarkup(k.grade)}<span class="v10-stage-static">${badge(k.stage)}</span></div>`;
  }
  const meta = document.createElement('small');
  meta.className = 'v9identity-meta';
  meta.textContent = [k.type, k.market, k.lang].filter(Boolean).join(' · ');
  content.append(line, meta);
  identity.classList.add('v10-identity', 'v9identity');
  identity.replaceChildren(avatarNode, content, quick);
  drawer.setAttribute('aria-labelledby', 'v10-kol-name');
  const tabs = head.querySelector('.drawer-tabs');
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'KOL详情页签');
  const tabButtons = [...tabs.querySelectorAll('[data-dtab]')];
  tabButtons.forEach((button, index) => {
    button.type = 'button';
    button.id = 'v10-tab-' + button.dataset.dtab;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(button.dataset.dtab === tab));
    button.setAttribute('aria-controls', 'v10-drawer-panel');
    button.tabIndex = button.dataset.dtab === tab ? 0 : -1;
    button.onkeydown = event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabButtons.length - 1 : (index + (event.key === 'ArrowLeft' ? -1 : 1) + tabButtons.length) % tabButtons.length;
      tabButtons[next].click();
    };
  });
  if (tab === 'follow') enhanceV10Follow(drawer, k);
  if (tab === 'cases') enhanceV10Cases(drawer, k);
  if (tab === 'info') {
    if (typeof enhanceV10Contacts === 'function') enhanceV10Contacts(form, k);
    enhanceV10Accounts(form, k);
    const error = form.querySelector('#profileerror');
    const bar = form.querySelector('.profilebar');
    if (error && bar) bar.prepend(error);
    const fees = form.querySelector('#kolfees');
    fees?.querySelectorAll('[data-newfee]').forEach(button => button.remove());
    if (fees && !fees.querySelector('[data-feeopen]')) {
      const empty = document.createElement('p');
      empty.className = 'muted v10-drawer-empty';
      empty.textContent = '暂无稿费申请';
      fees.append(empty);
    }
  }
  const panel = tab === 'info' ? form.querySelector('.v9profile-scroll') : body;
  panel.id = 'v10-drawer-panel';
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', 'v10-tab-' + tab);
  if (tab !== 'follow') panel.tabIndex = 0;
  if (tab === 'info' && inlineSession?.id === id) inlineSession.snapshot = inlineSnapshot();
}
const v10BaseOpenDrawer = openDrawer;
openDrawer = function(id, tab = 'info') {
  const targetTab = tab === 'social' ? 'info' : tab;
  const focusTab = document.activeElement?.matches('[data-dtab]');
  guardProfileLeave(() => {
    v10BaseOpenDrawer(id, targetTab);
    enhanceV10Drawer(id, targetTab);
    if (focusTab) document.querySelector('.v10-kol-drawer #v10-tab-' + targetTab)?.focus();
  });
};
const v10DecorateProfile = decorateV9Profile;
decorateV9Profile = function(k) {
  v10DecorateProfile(k);
  const name = document.querySelector('.v10-drawer-head [data-profilefield="name"]');
  if (name) {
    name.setAttribute('aria-label', k.name);
    name.querySelector('.v8display')?.setAttribute('aria-label', k.name + '，编辑KOL名称');
  }
};
