/* The detail drawer edits the existing accounts array one row at a time. */
const v10AccountForms = new WeakMap();
let v10AccountRowId = 0;

function v10AccountValues(row) {
  return [row.platform.value, row.url.value, row.fans.value];
}
function v10AccountSignature(row) { return JSON.stringify(v10AccountValues(row)); }
function v10AccountValidate(row, state) {
  const prior = own().find(item => item.id === state.id), account = v10AccountData(row, prior);
  const previous = (prior.accounts || []).find(item => C.fansIdentity(item) === C.fansIdentity(account));
  const error = row.composing.size ? '请完成账号输入后再保存' : account.fans === (previous?.fans ?? '') ? '' : C.parseFans(account.fans).error || '';
  row.fans.setCustomValidity(error); row.fans.setAttribute('aria-invalid', String(!!error));
  row.node.querySelector('[data-account-fans-error]').textContent = row.composing.size ? '' : error;
}
function v10AccountData(row, prior) {
  const values = v10AccountValues(row), raw = row.raw;
  const account = {...(raw || {}), platform: values[0], url: raw && values[1] === row.initial[1] ? raw.url : values[1].trim(), fans: values[2]};
  const previous = (prior.accounts || []).find(item => C.fansIdentity(item) === C.fansIdentity(account));
  if (raw && C.fansIdentity(raw) === C.fansIdentity(account) && values[2] === row.initial[2]) account.fans = raw.fans ?? '';
  else if (previous) account.fans = C.preserveFansInput(values[2], previous.fans ?? '');
  return account;
}
function v10AccountRead(state, prior) {
  const accounts = state.rows.map(row => v10AccountData(row, prior));
  const sameIdentities = JSON.stringify(accounts.map(C.fansIdentity)) === JSON.stringify((prior.accounts || []).map(C.fansIdentity));
  const used = C.unique(accounts.map(account => account.platform).filter(Boolean));
  const platforms = sameIdentities ? [...prior.platforms] : [...prior.platforms.filter(platform => used.includes(platform)), ...used.filter(platform => !prior.platforms.includes(platform))];
  return {accounts, platforms};
}
function v10AccountChanged(state) {
  state.form.dispatchEvent(new Event('input', {bubbles: true}));
  state.add.disabled = state.rows.length >= 30;
  state.empty.hidden = state.rows.length !== 0;
}
function v10AccountReadCells(row, account) {
  row.node.querySelector('[data-account-platform-read]').innerHTML = brandMarkup('platform', account.platform || '未选择', true);
  const link = row.node.querySelector('[data-account-url-read]'), href = safeLink(account.url);
  link.replaceChildren();
  if (href) {
    const anchor = document.createElement('a');
    anchor.href = account.url; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer';
    anchor.textContent = account.url; anchor.title = account.url; link.append(anchor);
  } else link.textContent = account.url || '未填写';
  row.node.querySelector('[data-account-fans-read]').textContent = C.fansDisplay(account.fans ?? '');
}
function v10AccountEditing(row, editing, focus) {
  const active = document.activeElement, returnFocus = !editing && row.node.contains(active) && (active.closest('[data-account-editor]') || active.hasAttribute('data-account-done'));
  if (editing) row.editEpoch++;
  row.editing = editing;
  row.node.classList.toggle('is-editing', editing);
  row.node.querySelectorAll('[data-account-read]').forEach(node => { node.hidden = editing; });
  row.node.querySelectorAll('[data-account-editor]').forEach(node => { node.hidden = !editing; });
  row.node.querySelector('[data-account-edit]').hidden = editing;
  row.node.querySelector('[data-account-done]').hidden = !editing;
  if (returnFocus) row.node.querySelector('[data-account-edit]').focus({preventScroll: true});
  if (focus) (focus === 'fans' ? row.fans : row.url).focus();
}
function v10AccountMakeRow(state, account, editing = false) {
  const id = ++v10AccountRowId, node = document.createElement('tr');
  node.dataset.v10AccountRow = String(id);
  node.innerHTML = `<td><div data-account-read data-account-platform-read></div><div data-account-editor hidden><select aria-label="账号平台" name="v10-account-platform-${id}" data-account-platform required><option value="">选择平台</option>${C.PLATFORMS.map(platform => `<option value="${esc(platform)}">${esc(platform)}</option>`).join('')}</select></div></td><td><div data-account-read data-account-url-read></div><div data-account-editor hidden><input type="text" maxlength="2048" name="v10-account-url-${id}" data-account-url aria-label="完整账号主页链接" placeholder="完整主页链接" autocomplete="off" required></div></td><td><div data-account-read data-account-fans-read></div><div data-account-editor hidden><input type="text" maxlength="100" name="v10-account-fans-${id}" data-account-fans aria-label="账号粉丝数" placeholder="未知可留空" autocomplete="off" aria-describedby="v10-account-fans-error-${id}"><small class="v10-accounts-row-error" id="v10-account-fans-error-${id}" data-account-fans-error></small></div></td><td class="v10-accounts-actions"><button type="button" class="textbtn" data-account-edit>编辑</button><button type="button" class="textbtn" data-account-done hidden>完成</button><button type="button" class="textbtn" data-account-remove>${account ? '移除' : '取消'}</button></td>`;
  const row = {node, platform: node.querySelector('[data-account-platform]'), url: node.querySelector('[data-account-url]'), fans: node.querySelector('[data-account-fans]'), raw: account ? structuredClone(account) : null, composing: new Set(), editEpoch: 0};
  if (account && !C.PLATFORMS.includes(account.platform)) row.platform.add(new Option(account.platform, account.platform));
  row.platform.value = account?.platform ?? ''; row.url.value = account?.url ?? ''; row.fans.value = C.fansEditor(account?.fans ?? '');
  row.initial = v10AccountValues(row);
  v10AccountReadCells(row, account || {});
  state.rows.push(row); state.body.append(node); v10AccountEditing(row, editing);
  node.addEventListener('input', () => v10AccountValidate(row, state));
  node.addEventListener('change', () => v10AccountValidate(row, state));
  for (const input of [row.url, row.fans]) {
    input.addEventListener('compositionstart', () => { row.composing.add(input); v10AccountValidate(row, state); });
    input.addEventListener('compositionend', () => { row.composing.delete(input); v10AccountValidate(row, state); v10AccountChanged(state); });
  }
  node.querySelector('[data-account-edit]').onclick = () => v10AccountEditing(row, true, 'url');
  node.querySelector('[data-account-remove]').onclick = () => {
    state.rows.splice(state.rows.indexOf(row), 1); node.remove(); v10AccountChanged(state);
  };
  node.querySelector('[data-account-done]').onclick = async () => {
    if (row.composing.size) return;
    if (row.raw && v10AccountSignature(row) === JSON.stringify(row.initial)) { v10AccountEditing(row, false); return; }
    await saveInlineProfile(false);
  };
  return row;
}
function v10AccountsProducts(state, k) {
  state.productsRead.innerHTML = '<span>拟推广产品</span>' + ((k.products || []).length ? k.products.map(product => `<span class="v9product v10-product-summary">${brandMarkup('product', product, true)}</span>`).join('') : '<span class="muted">未填写</span>');
}
function v10AccountsProductEditing(state, editing) {
  if (editing) state.productsEpoch++;
  state.productsEditor.hidden = !editing;
  state.productsButton.textContent = editing ? '收起推广产品' : '编辑推广产品';
  state.productsButton.setAttribute('aria-expanded', String(editing));
}
function v10AccountsFanAction(state, k) {
  const button = state.form.querySelector('[data-editfield="fans"]'), input = state.form.querySelector('#ip-fans');
  if (!button || !input) return;
  input.readOnly = !!primaryAccount(k);
  button.onclick = () => {
    const prior = own().find(item => item.id === state.id), data = v10AccountRead(state, prior), primary = C.primaryFansAccount(data);
    if (primary) {
      const row = state.rows.find(row => C.fansIdentity(v10AccountData(row, prior)) === C.fansIdentity(primary));
      state.section.open = true; if (row) { v10AccountEditing(row, true, 'fans'); row.node.scrollIntoView({block: 'nearest'}); }
    } else {
      const field = input.closest('[data-profilefield]'); field.querySelector('.v8display').hidden = true; field.querySelector('.v8editor').hidden = false; input.focus();
    }
  };
}
function enhanceV10Accounts(form, k) {
  if (!form || v10AccountForms.has(form)) return;
  const section = form.querySelector('.v8accounts'), editor = section?.querySelector('.v9account-editor');
  if (!section || !editor) return;
  const products = [...editor.querySelectorAll('fieldset')].find(field => field.querySelector('[name="ip-products"]'));
  section.querySelector('.v9account-read')?.remove(); section.querySelector('.v9account-edit')?.remove();
  if (products) products.remove(); editor.remove();
  const shell = document.createElement('div'); shell.className = 'v10-accounts';
  shell.innerHTML = `<div class="v10-accounts-toolbar"><span>平台账号</span><button type="button" class="textbtn" data-account-add>${I('plus')}添加账号</button></div><div class="v10-accounts-table"><table><colgroup><col class="v10-accounts-platform-col"><col><col class="v10-accounts-fans-col"><col class="v10-accounts-actions-col"></colgroup><thead><tr><th scope="col">平台</th><th scope="col">主页链接</th><th scope="col">粉丝数</th><th scope="col">操作</th></tr></thead><tbody></tbody></table></div><p class="v10-accounts-empty muted">暂无平台账号</p><div class="v9products"></div><button type="button" class="textbtn v10-accounts-products-edit">编辑推广产品</button><div class="v10-accounts-products-editor" hidden></div>`;
  section.append(shell);
  const state = {id: k.id, form, section, shell, rows: [], body: shell.querySelector('tbody'), add: shell.querySelector('[data-account-add]'), empty: shell.querySelector('.v10-accounts-empty'), productsRead: shell.querySelector('.v9products'), productsEditor: shell.querySelector('.v10-accounts-products-editor'), productsButton: shell.querySelector('.v10-accounts-products-edit'), productsEpoch: 0};
  v10AccountForms.set(form, state);
  if (products) state.productsEditor.append(products);
  for (const account of k.accounts || []) v10AccountMakeRow(state, account);
  state.add.disabled = state.rows.length >= 30; state.empty.hidden = state.rows.length !== 0;
  state.add.onclick = () => { if (state.rows.length >= 30) return; const row = v10AccountMakeRow(state, null, true); row.platform.focus(); v10AccountChanged(state); };
  state.productsButton.onclick = () => { v10AccountsProductEditing(state, state.productsEditor.hidden); if (!state.productsEditor.hidden) state.productsEditor.querySelector('input')?.focus(); };
  state.productsButton.setAttribute('aria-expanded', 'false');
  v10AccountsProducts(state, k); v10AccountsFanAction(state, k);
}

const v10AccountsBaseRead = readInlineProfile;
readInlineProfile = function() {
  const data = v10AccountsBaseRead(), state = v10AccountForms.get(document.querySelector('#inlineprofile'));
  if (state && state.id === data.id) Object.assign(data, v10AccountRead(state, own().find(item => item.id === data.id)));
  return data;
};
const v10AccountsBaseSync = syncFanEditors;
syncFanEditors = function(form, data) {
  v10AccountsBaseSync(form, data);
  const state = v10AccountForms.get(form); if (!state) return;
  state.rows.forEach((row, index) => { row.fans.value = C.fansEditor(data.accounts[index]?.fans ?? ''); v10AccountValidate(row, state); });
};
function v10ProfileAccountsCapture(form) {
  const state = v10AccountForms.get(form); if (!state) return null;
  const prior = own().find(item => item.id === state.id);
  return {rows: state.rows.map(row => ({row, values: v10AccountValues(row), account: structuredClone(v10AccountData(row, prior)), editing: row.editing, editEpoch: row.editEpoch})), products: JSON.stringify([...state.productsEditor.querySelectorAll('input')].map(input => [input.value, input.checked])), productsEditing: !state.productsEditor.hidden, productsEpoch: state.productsEpoch};
}
function v10ProfileAccountsComposing(form) { return !!v10AccountForms.get(form)?.rows.some(row => row.composing.size); }
function v10ProfileAccountsSaved(form, k, captured) {
  const state = v10AccountForms.get(form); if (!state || !captured || state.id !== k.id) return;
  for (const entry of captured.rows) {
    const {row} = entry; if (!state.rows.includes(row)) continue;
    const account = (k.accounts || []).find(item => C.fansIdentity(item) === C.fansIdentity(entry.account));
    if (!account) continue;
    const unchanged = v10AccountSignature(row) === JSON.stringify(entry.values);
    row.raw = structuredClone(account); row.initial = [...entry.values]; row.node.querySelector('[data-account-remove]').textContent = '移除';
    v10AccountValidate(row, state);
    v10AccountReadCells(row, account); if (unchanged && entry.editing && entry.editEpoch === row.editEpoch && !row.composing.size) v10AccountEditing(row, false);
  }
  const products = JSON.stringify([...state.productsEditor.querySelectorAll('input')].map(input => [input.value, input.checked]));
  if (products === captured.products && captured.productsEditing && captured.productsEpoch === state.productsEpoch) {
    const focused = state.productsEditor.contains(document.activeElement);
    v10AccountsProductEditing(state, false); if (focused) state.productsButton.focus({preventScroll: true});
  }
  v10AccountsProducts(state, k); v10AccountsFanAction(state, k);
}
const v10AccountsBaseDecorate = decorateV9Profile;
decorateV9Profile = function(k) {
  v10AccountsBaseDecorate(k);
  const state = v10AccountForms.get(document.querySelector('#inlineprofile'));
  if (state && state.id === k.id) { v10AccountsProducts(state, k); v10AccountsFanAction(state, k); }
};
