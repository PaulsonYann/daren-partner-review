/* Keep the real interface while explicitly separating the public demo from the local CRM. */
(function(){
'use strict';
const D=window.PublicDemo;
api=D.request;
v11DedicatedAdminPath=function(){return new URLSearchParams(location.search).get('view')==='admin'};
v11AdminRouteAddress=function(path){const u=new URL(location.href);if(path.startsWith('/admin'))u.searchParams.set('view','admin');else u.searchParams.delete('view');history.replaceState(null,'',u.pathname+u.search+u.hash)};
v11AdminNavigate=function(path){if(!['/','/admin','/admin/login'].includes(path))return;return v11AdminPendingGuard(()=>{v11AdminLeavePage(true);v11AdminRouteAddress(path);bootstrap()})};
function reset(){
 const open=()=>{document.body.style.overflow='hidden';document.querySelector('#overlay').innerHTML=`<div class="modalback"><section class="modal compacthelp" role="dialog" aria-modal="true" aria-label="重置演示资料"><div class="modalheading"><h2>重置当前浏览器的演示资料？</h2></div><p class="sectionnote">恢复本版虚构样例，清除你在本浏览器的演示修改。不会影响同事或本机正式系统。</p><div class="actions"><button type="button" class="btn" id="demo-cancel-reset">取消</button><button type="button" class="btn primary" id="demo-confirm-reset">确认重置</button></div><p id="demo-reset-error" role="alert" class="inlinecheck error"></p></section></div>`;document.querySelector('#demo-cancel-reset').onclick=forceClose;document.querySelector('#demo-confirm-reset').onclick=async()=>{try{D.save(D.seed());forceClose();if(typeof v11AdminReset==='function')v11AdminReset();await bootstrap();toast('已恢复虚构样例')}catch(e){document.querySelector('#demo-reset-error').textContent=e.message}};document.querySelector('#demo-cancel-reset').focus()};
 if(document.querySelector('#content')&&currentUser)return guardProfileLeave(()=>v11AdminPendingGuard(open));open();
}
D.reset=reset;
async function enter(id){try{D.read();sessionStorage.setItem(D.SESSION,String(id));if(id===102)v11AdminRouteAddress('/');else v11AdminRouteAddress('/admin');currentUser=null;await bootstrap()}catch(e){const out=document.querySelector('#demo-entry-error');if(out)out.textContent=e.message;else toast(e.message)}}
const originalLogin=loginScreen;
loginScreen=function(){
 originalLogin(false);authView=null;
 document.querySelector('.auth-feature').textContent='公开演示 · 纯虚构资料 · 本浏览器独立保存';
 document.querySelector('.auth-card h2').textContent='体验达人系统';
 document.querySelector('.auth-card>p').textContent='选择演示身份，查看最新界面。无需输入账号或密码。';
 const form=document.querySelector('#authform');form.onsubmit=e=>e.preventDefault();form.innerHTML=`<div class="demo-entry-buttons"><button type="button" class="btn primary auth-submit" id="demo-enter-bd">进入商务 BD 演示 ${I('arrow')}</button><button type="button" class="btn auth-submit" id="demo-enter-admin">进入管理员演示 ${I('shield')}</button></div><p id="demo-entry-error" class="inlinecheck error" role="alert"></p>`;
 form.querySelector('#demo-enter-bd').onclick=()=>enter(102);form.querySelector('#demo-enter-admin').onclick=()=>enter(101);
 document.querySelector('.auth-footnote').textContent='请勿录入真实客户、邮箱或密码。管理员角色为界面模拟，不提供访问保护；操作不会上传或跨电脑共享。';
 document.querySelector('.auth-footer').innerHTML='达人系统 · V11 公开演示　<button type="button" class="auth-link" id="demo-login-reset">重置演示资料</button>';
 document.querySelector('#demo-login-reset').onclick=reset;
 document.title='达人系统 · 公开演示';
 decorate();
};
accountDialog=function(){document.body.style.overflow='hidden';document.querySelector('#overlay').innerHTML=`<div class="modalback"><section class="modal compacthelp" role="dialog" aria-modal="true" aria-label="演示设置"><div class="modalheading"><h2>演示设置</h2><button type="button" class="iconbtn" aria-label="关闭设置" id="demo-close-settings">${I('close')}</button></div><p class="sectionnote">蓝色主题 · 当前浏览器独立资料。公开演示不修改任何登录密码，也不设置真实权限。</p><div class="actions"><button type="button" class="btn" id="demo-settings-reset">重置演示资料</button><button type="button" class="btn primary" id="demo-switch-role">切换演示身份</button></div></section></div>`;document.querySelector('#demo-close-settings').onclick=forceClose;document.querySelector('#demo-settings-reset').onclick=reset;document.querySelector('#demo-switch-role').onclick=()=>{forceClose();enter(currentUser?.role==='admin'?102:101)};document.querySelector('#demo-close-settings').focus()};
const baseRender=render;
render=function(...args){const result=baseRender.apply(this,args);decorate();return result};
function decorate(){
 for(const back of document.querySelectorAll('a[href="/"]')){back.href=location.pathname;back.onclick=e=>{e.preventDefault();v11AdminNavigate('/')}}
 const main=document.querySelector('.main');if(!main){const denied=document.querySelector('.v11-admin-access');if(denied&&!denied.querySelector('.demo-access-note')){const note=document.createElement('p');note.className='demo-access-note';note.textContent='公开演示 · 当前为虚构商务BD视角，可退出并选择管理员演示；本页不提供真实访问保护。';denied.querySelector('.panel')?.append(note)}return;}document.querySelector('#demo-banner')?.remove();const banner=document.createElement('div');banner.id='demo-banner';banner.className='demo-banner';banner.innerHTML=`<span><strong>V11 公开演示</strong> · 纯虚构数据，仅当前浏览器保存；请勿填写真实资料。</span><div><button type="button" id="demo-role">${currentUser?.role==='admin'?'切换商务 BD':'查看管理员演示'}</button><button type="button" id="demo-reset">重置演示资料</button></div>`;main.querySelector('.topbar')?.after(banner);banner.querySelector('#demo-reset').onclick=reset;banner.querySelector('#demo-role').onclick=()=>guardProfileLeave(()=>v11AdminPendingGuard(()=>enter(currentUser?.role==='admin'?102:101)));
 const back=document.querySelector('#v11-admin-return-workspace');if(back){back.href=location.pathname;back.onclick=e=>{e.preventDefault();v11AdminNavigate('/')}}
}
const baseBootstrap=bootstrap;
bootstrap=async function(...args){await baseBootstrap.apply(this,args);decorate();const error=document.querySelector('.startup-error');if(error&&!error.querySelector('#demo-startup-reset')){const button=document.createElement('button');button.id='demo-startup-reset';button.className='btn';button.textContent='重置演示资料';button.onclick=reset;error.append(button)}};
// File imports never leave this static site. The supported preview path is local UTF-8 CSV.
const baseImport=importDialog;
importDialog=function(){baseImport();const input=document.querySelector('#csvfile');if(input){input.accept='.csv,text/csv';const original=input.onchange;input.onchange=e=>{if(e.target.files[0]&&!e.target.files[0].name.toLowerCase().endsWith('.csv')){document.querySelector('#importerror').textContent='公开演示仅支持UTF-8 CSV，请先另存为CSV；请勿导入真实资料。';return}original?.(e)}}};
function protectCredentialPreviews(){
 for(const input of document.querySelectorAll('input[type="password"],input[data-auth-secret]')){
  input.value='';input.disabled=true;input.placeholder='演示不填写密码';input.autocomplete='off';
  const form=input.closest('form');if(!form)continue;
  for(const button of form.querySelectorAll('button[type="submit"],input[type="submit"]')){button.disabled=true;button.title='公开演示仅预览，不创建账号或修改权限'}
  if(!form.querySelector('.demo-credential-note')){const note=document.createElement('p');note.className='demo-credential-note';note.setAttribute('role','note');note.textContent='公开演示仅预览：不创建账号、不修改密码或权限，请勿填写真实凭证。';form.prepend(note)}
 }
}
new MutationObserver(protectCredentialPreviews).observe(document.querySelector('#app'),{childList:true,subtree:true});
new MutationObserver(protectCredentialPreviews).observe(document.querySelector('#overlay'),{childList:true,subtree:true});
setTheme();bootstrap();
})();
