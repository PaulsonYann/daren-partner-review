/* Keep the original KOL drawer mounted in memory while its child form is open. */
let v10DrawerChild = null, v10DrawerOpening = null;
const v10DrawerChildForms = new WeakMap();

function v10DrawerReturnValid(context) {
  return currentUser?.id === context.uid && page === context.page && own().some(k => k.id === context.id);
}
function v10DrawerReturnCapture(kind, id) {
  const parent = document.querySelector('.v10-kol-drawer');
  if (!parent || drawerId !== id || !['info','follow','cases'].includes(drawerTab)) return null;
  return {kind, id, tab: drawerTab, uid: currentUser?.id, page, parent, nodes: [...document.querySelector('#overlay').childNodes],
    profile: inlineSession, follow: followSession, focus: parent.contains(document.activeElement) ? document.activeElement : parent.querySelector(kind === 'contracts' ? '#v9contractquick' : '#v9feequick'),
    scroll: [parent, ...parent.querySelectorAll('.drawerbody,.v9profile-scroll,.v10-follow-scroll')].map(node => [node, node.scrollTop, node.scrollLeft]),
    finished: false, saving: 0, busy: false};
}
function v10DrawerReturnSuspend(context) {
  closeV10Choice(); clearTimeout(autoTimer);
  // A follow-up discarded in the existing leave prompt must not reappear as a draft.
  // A successful follow-up save updates this same session snapshot before leaving.
  const form = context.parent.querySelector('#followform');
  if (form && context.follow) {
    const baseline = JSON.parse(context.follow.snapshot);
    [...form.querySelectorAll('input,textarea,select')].forEach((input,index) => { if (typeof baseline[index] === 'string') input.value = baseline[index]; });
  }
  context.nodes.forEach(node => node.remove());
  inlineSession = null; followSession = null;
  v10DrawerChild = context;
}
function v10DrawerReturnFees(context) {
  const fees = feesAll().filter(f => f.kolId === context.id), box = context.parent.querySelector('#kolfees');
  if (box) {
    box.innerHTML = '<h3>合作稿费申请</h3><div class="actions">' + fees.map(f => `<button type="button" class="btn small" data-feeopen="${esc(f.id)}">${esc(f.title || f.number)} · ${esc(feeStatus[f.status] || '状态待核对')}</button>`).join('') + '</div>' + (fees.length ? '' : '<p class="muted v10-drawer-empty">暂无稿费申请</p>');
    box.querySelectorAll('[data-feeopen]').forEach(button => { button.onclick = () => openFee(button.dataset.feeopen); });
  }
  const followFees = [...context.parent.querySelectorAll('.v10-follow-section')].find(section => section.querySelector('h3')?.textContent === '合作稿费申请');
  if (followFees) {
    const section = v10FollowSection('合作稿费申请','money',fees.length ? `<div class="v10-follow-fees">${fees.map(f => `<article class="v10-follow-fee"><div><strong>${esc(f.title || '未命名草稿')}</strong><small>${esc(f.number || '申请单号未记录')}${f.amount !== '' && f.amount != null ? ' · '+esc(f.currency || '币种未知')+' '+esc(f.amount) : ''}</small></div><span class="fee-status fee-status-${esc(f.status)}">${esc(feeStatus[f.status] || '状态待核对')}</span><button type="button" class="textbtn" data-v10-follow-fee="${esc(f.id)}">查看详情 ${I('external')}</button></article>`).join('')}</div>` : '<p class="v10-follow-empty">暂无稿费申请</p>');
    section.querySelectorAll('[data-v10-follow-fee]').forEach(button => { button.onclick = () => openFee(button.dataset.v10FollowFee); });
    followFees.replaceWith(section);
  }
  const history = [...context.parent.querySelectorAll('.v10-follow-section')].find(section => section.querySelector('h3')?.textContent === '历史跟进记录');
  if (history) history.replaceWith(v10FollowSection('历史跟进记录','clock',v10FollowHistory(own().find(k => k.id === context.id).logs)));
}
const v10ReturnBaseForceClose = forceClose;
function v10DrawerReturnFinish(context) {
  if (v10DrawerChild !== context || context.finished) return;
  const valid = v10DrawerReturnValid(context);
  context.finished = true; v10DrawerChild = null; v10ReturnBaseForceClose();
  if (!valid) { context.nodes = []; return; }
  const overlay = document.querySelector('#overlay'); overlay.replaceChildren(...context.nodes); context.nodes = [];
  drawerId = context.id; drawerTab = context.tab; inlineSession = context.profile; followSession = context.follow; v7Draft = null;
  document.body.style.overflow = 'hidden';
  v10DrawerReturnFees(context);
  if (context.kind === 'promotions' && context.tab === 'cases') {
    const caseId = context.focus?.closest('[data-v10-case-id]')?.dataset.v10CaseId;
    enhanceV10Cases(context.parent, own().find(k => k.id === context.id));
    context.focus = [...context.parent.querySelectorAll('[data-v10-case-id]')].find(card => card.dataset.v10CaseId === caseId)?.querySelector('[data-v10-case-edit]') || context.parent.querySelector('[data-v10-case-add]');
  }
  const profile = context.parent.querySelector('#inlineprofile'); if (profile) observeIntro(profile);
  const focus = context.focus?.isConnected && !context.focus.closest('[hidden]') ? context.focus : context.parent.querySelector(context.kind === 'contracts' ? '#v9contractquick' : '#v9feequick');
  focus?.focus({preventScroll:true}); context.scroll.forEach(([node,top,left]) => { node.scrollTop = top; node.scrollLeft = left; });
}
// The fee editor calls this only after its mutation was acknowledged. Returning
// true for an obsolete owned form also prevents its old forceClose/openFee route.
function v10DrawerChildSaved(form) {
  const context = v10DrawerChildForms.get(form); if (!context) return false;
  if (v10DrawerChild === context && form.isConnected && v10DrawerReturnValid(context)) v10DrawerReturnFinish(context);
  else if (v10DrawerChild === context && !v10DrawerReturnValid(context)) { v10DrawerChild = null; context.nodes = []; }
  return true;
}
function v10DrawerReturnPrompt(context) {
  if (document.querySelector('#leaveprompt')) return;
  const prompt = document.createElement('div'); prompt.id = 'leaveprompt'; prompt.className = 'leaveprompt';
  prompt.innerHTML = '<div class="modalback"><section class="modal compacthelp" role="dialog" aria-modal="true" aria-label="未保存的子窗口"><h2>修改尚未保存</h2><p>请选择保存后返回，或继续编辑。</p><p class="inlinecheck error" role="alert" data-return-error></p><div class="actions"><button class="btn" id="keepediting">继续编辑</button><button class="btn" id="discardprofile">放弃修改</button><button class="btn primary" id="saveandleave">保存并返回</button></div></section></div>';
  document.querySelector('#overlay').append(prompt);
  prompt.querySelector('#keepediting').onclick = () => { prompt.remove(); context.form.querySelector('input:not([type=hidden]),textarea,select')?.focus(); };
  prompt.querySelector('#discardprofile').onclick = () => { if (context.busy || v7Draft?.busy) return; v10DrawerReturnFinish(context); };
  prompt.querySelector('#saveandleave').onclick = async event => {
    event.target.disabled = true;
    try { if (!await context.save() && prompt.isConnected) prompt.querySelector('[data-return-error]').textContent = context.form.querySelector('#v4error,#v7error')?.textContent || '保存未完成，输入已保留'; }
    catch (error) { if (prompt.isConnected) prompt.querySelector('[data-return-error]').textContent = error.message; }
    finally { if (event.target.isConnected) event.target.disabled = false; }
  };
  prompt.querySelector('#keepediting').focus();
}
const v10ReturnBaseClose = closeDrawer;
closeDrawer = function() {
  const context = v10DrawerChild;
  if (!context || !context.form?.isConnected || !v10DrawerReturnValid(context)) {
    if (context) { v10DrawerChild = null; context.nodes = []; }
    return v10ReturnBaseClose();
  }
  if (['contracts','promotions'].includes(context.kind) && context.saving && context.commitSucceeded) { v10DrawerReturnFinish(context); return; }
  if (context.busy || v7Draft?.busy) { toast('正在保存，请稍候'); return; }
  if (document.querySelector('#leaveprompt')) { document.querySelector('#keepediting')?.click(); return; }
  if (v7Snapshot(context.form) !== context.snapshot) { v10DrawerReturnPrompt(context); return; }
  v10DrawerReturnFinish(context);
};
forceClose = function() {
  const context = v10DrawerChild;
  if (context?.form?.isConnected && v10DrawerReturnValid(context)) { v10DrawerReturnFinish(context); return; }
  if (context) { v10DrawerChild = null; context.nodes = []; }
  return v10ReturnBaseForceClose();
};
const v10ReturnBaseModal = modalUI;
modalUI = function(title, body, onSave, compactKind) {
  const context = v10DrawerOpening;
  if (!context || !['contracts','promotions'].includes(context.kind)) return v10ReturnBaseModal(title,body,onSave,compactKind);
  v10DrawerReturnSuspend(context);
  const save = async () => {
    if (v10DrawerChild !== context || !context.form?.isConnected || !v10DrawerReturnValid(context)) return false;
    if (!context.form.reportValidity() || context.busy) return false;
    context.busy = true; context.saving++; context.commitSucceeded = false;
    try { await onSave(); return context.finished; }
    catch (error) { if (context.form.isConnected) context.form.querySelector('#v4error').textContent = error.message; return false; }
    finally { context.saving--; context.busy = false; }
  };
  v10ReturnBaseModal(title,body,save,compactKind);
  context.form = document.querySelector('#v4form'); context.save = save; v10DrawerChildForms.set(context.form,context);
};
const v10ReturnBaseDraftModal = draftModal;
draftModal = function(...args) {
  const context = v10DrawerOpening;
  if (context?.kind === 'fees') v10DrawerReturnSuspend(context);
  v10ReturnBaseDraftModal(...args);
  if (context?.kind === 'fees') { context.form = document.querySelector('#v7form'); context.save = () => v7Draft?.form === context.form ? v7Draft.save() : Promise.resolve(false); v10DrawerChildForms.set(context.form,context); }
};
function v10DrawerReturnOpen(kind,id,open) {
  const context = v10DrawerReturnCapture(kind,id); if (!context) return open();
  guardProfileLeave(() => {
    if (!v10DrawerReturnValid(context)) return;
    v10DrawerOpening = context;
    try {
      open();
      if (context.form) context.snapshot = v7Snapshot(context.form);
    } finally {
      v10DrawerOpening = null;
      if (!context.form && context.parent.isConnected) { inlineSession = context.profile; followSession = context.follow; }
    }
  });
}
const v10ReturnBaseEntry = entryDialog;
entryDialog = function(kind,id,...args) {
  if (!['contracts','promotions'].includes(kind)) return v10ReturnBaseEntry(kind,id,...args);
  return v10DrawerReturnOpen(kind,id,() => {
    v10ReturnBaseEntry(kind,id,...args);
    const context = v10DrawerChild;
    if (kind === 'promotions' && context?.kind === kind && context.form?.isConnected) {
      // Use the final form submit chain, including case fields and delivery links.
      context.save = async () => { await context.form.onsubmit({target:context.form,preventDefault(){}}); return context.finished; };
    }
  });
};
const v10ReturnBaseFeeEditor = feeEditor;
feeEditor = function(original,id) { return v10DrawerReturnOpen('fees',original?.kolId || id,() => v10ReturnBaseFeeEditor(original,id)); };
const v10ReturnBaseCommit = commit;
commit = async function(next) {
  const context = v10DrawerChild, owned = ['contracts','promotions'].includes(context?.kind) && context.saving && context.form?.isConnected;
  const result = await v10ReturnBaseCommit(next);
  if (owned && result) {
    if (v10DrawerChild !== context || !context.form.isConnected || !v10DrawerReturnValid(context)) return false;
    context.commitSucceeded = true;
  }
  return result;
};
const v10ReturnBaseGuard = guardProfileLeave;
guardProfileLeave = function(action) {
  const context = v10DrawerChild;
  if (context && v10DrawerReturnValid(context) && (context.busy || v7Draft?.busy)) { toast('正在保存，请稍候'); return; }
  return v10ReturnBaseGuard(action);
};
window.addEventListener('beforeunload',event => {
  const context = v10DrawerChild;
  if (context?.form?.isConnected && (context.busy || v7Snapshot(context.form) !== context.snapshot)) { event.preventDefault(); event.returnValue = ''; }
});
