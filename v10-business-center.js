/* V10-022: the original training component is mounted inside the business hub. */
Object.assign(pageNames,{business:'商务中心',training:'商务中心'});
let v10BusinessView={user:null,active:'commission',policy:'policy',training:null,restoreTraining:false};
function v10BusinessState(){
 const user=typeof currentUser==='undefined'?null:currentUser;
 if(v10BusinessView.user!==user)v10BusinessView={user,active:'commission',policy:'policy',training:null,restoreTraining:false};
 return v10BusinessView;
}
function v10BusinessIcon(name){
 const paths={book:'<path d="M12 5c-3-2-6-2-9-1v16c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1ZM12 5v16"/>',coins:'<ellipse cx="10" cy="6" rx="7" ry="3"/><path d="M3 6v5c0 4 14 4 14 0V6M3 11v5c0 3 8 4 12 2M17 9c3 0 5 1 5 3v6c0 3-7 4-10 1v-5M17 15c2 0 4-1 5-2"/>',document:'<path d="M6 3h9l4 4v14H6ZM14 3v5h5M9 12h7M9 16h6"/>',gift:'<path d="M3 8h18v5H3ZM5 13v8h14v-8M12 8v13M12 8H8a3 3 0 1 1 3-3ZM12 8h4a3 3 0 1 0-3-3Z"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/>'};
 return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.document}</svg>`;
}
function v10BusinessCommissionHTML(){
 const state=v10BusinessState();
 const policies={policy:['商务提成制度 · demo','仅供查看文件结构，非正式制度、未生效；正式正文待补充。'],rules:['规则说明待补充','待现行制度确认后，补充适用范围及规则说明。'],faq:['常见问题待补充','待现行制度确认后，整理相关问题与答复。']};
 const [title,description]=policies[state.policy];
 const demoLinks=state.policy==='policy'?'<div class="v10-business-demoactions"><a class="btn" href="商务提成制度-待定演示.txt" target="_blank" rel="noopener">查看演示文件</a><a class="textbtn" href="商务提成制度-待定演示.txt" download="商务提成制度-demo演示文件-非正式制度未生效.txt">下载演示文件</a></div>':'';
 return `<section class="panel v10-business-section" aria-labelledby="v10-business-commission-title"><h2 class="sr-only" id="v10-business-commission-title">商务提成</h2><div class="v10-business-policy"><div class="v10-business-policyhead"><span class="v10-business-icon">${v10BusinessIcon('document')}</span><h3>提成制度</h3><span class="v10-business-pending">演示文件 · 未生效</span></div><div class="v10-business-policytabs" role="tablist" aria-label="提成制度内容">${[['policy','提成制度'],['rules','规则说明'],['faq','常见问题']].map(([id,label])=>`<button type="button" role="tab" id="v10-business-tab-${id}" aria-controls="v10-business-policy-panel" aria-selected="${state.policy===id}" tabindex="${state.policy===id?'0':'-1'}" data-business-policy="${id}">${label}</button>`).join('')}</div><div class="v10-business-policybody" id="v10-business-policy-panel" role="tabpanel" aria-labelledby="v10-business-tab-${state.policy}" tabindex="0"><strong>${title}</strong><p>${description}</p>${demoLinks}</div></div><p class="v10-business-note">${v10BusinessIcon('info')}正式制度待确认，当前演示文件不用于计算或结算。</p></section>`;
}
function v10BusinessResourcesHTML(){return `<section class="panel v10-business-section" aria-labelledby="v10-business-resources-title"><h2 class="sr-only" id="v10-business-resources-title">商务资料</h2><div class="v10-business-resources">${[['常用话术','商务沟通话术参考'],['合作模板','合作流程与文档模板']].map(([label,description])=>`<article class="v10-business-resource"><span class="v10-business-icon muted">${v10BusinessIcon('document')}</span><div><h3>${label}</h3><p>${description}</p><span>资料待补充</span></div></article>`).join('')}</div><p class="v10-business-note">${v10BusinessIcon('info')}按已确认资料逐步补充。</p></section>`;}
function v10BusinessHTML(){
 const state=v10BusinessState();
 return `<div class="v10-business-center"><section class="panel v10-business-overview" aria-labelledby="v10-business-title"><header><h1 class="sr-only" id="v10-business-title">商务中心</h1><p>学习方法 · 查看制度 · 查找资料</p></header><nav class="v10-business-modules" aria-label="商务中心模块">${[['training','book','商务培训','课程学习与标准认可'],['commission','coins','商务提成','提成制度与规则说明'],['resources','document','商务资料','常用话术与合作模板'],['gifts','gift','产品赠送','赠送意向与草稿记录']].map(([id,icon,label,summary])=>`<button type="button" class="v10-business-module ${state.active===id?'active':''}" data-business-module="${id}" aria-pressed="${state.active===id}" aria-controls="v10-business-content"><span class="v10-business-icon">${v10BusinessIcon(icon)}</span><span><strong>${label}</strong><small>${summary}</small></span></button>`).join('')}</nav></section><div id="v10-business-content" data-business-content></div></div>`;
}
function v10BusinessFocusPolicy(id){
 const tab=document.querySelector(`[data-business-policy="${id}"]`),strip=tab?.closest('.v10-business-policytabs');if(!tab||!strip)return;
 tab.focus({preventScroll:true});
 const bounds=strip.getBoundingClientRect(),item=tab.getBoundingClientRect(),left=bounds.left+strip.clientLeft,right=left+strip.clientWidth;
 // Move only the horizontal strip. Native scrollIntoView would also move the page.
 if(item.left<left)strip.scrollLeft-=left-item.left;else if(item.right>right)strip.scrollLeft+=item.right-right;
}
function v10BusinessCaptureTraining(){
 const state=v10BusinessState();if(learningAccount!==state.user)return;
 const reading=learningCaptureReading();if(reading)reading.focus=null;
 state.training={selected:learningSelected,filter:learningFilter,query,scrollTop:(document.scrollingElement||document.documentElement).scrollTop,reading};
}
function v10BusinessRestoreTraining(){
 const saved=v10BusinessState().training;
 learningSelected=saved?.selected||'';learningFilter=saved?.filter||'all';query=saved?.query||'';
}
function v10BusinessSelectModule(destination,button){
 if(!['training','commission','resources','gifts'].includes(destination))return;
 const state=v10BusinessState();learningSession();
 if(state.active===destination){button?.focus({preventScroll:true});return;}
 guardProfileLeave(()=>{if(currentUser!==state.user||page!=='business')return;
 if(state.active==='training')v10BusinessCaptureTraining();
 state.active=destination;state.restoreTraining=destination==='training';
 button?.focus({preventScroll:true});renderContent();});
}
function v10BusinessOpenTraining(id){
 const state=v10BusinessState();learningSession();
 if(id){if(!learningRows('training').some(course=>course.id===id))return;state.training={selected:id,filter:'all',query:'',scrollTop:0,reading:null};learningLast.training=id;}
 if(state.active!=='training')v10BusinessSelectModule('training',document.querySelector('[data-business-module="training"]'));
 else if(id){state.restoreTraining=true;renderContent();}
}
function v10BusinessRefreshLearning(){
 const user=v10BusinessState().user,pending=loadLearning();if(page==='business'&&currentUser===user)renderContent();return pending;
}
function bindV10BusinessUI(){
 document.querySelectorAll('[data-business-module]').forEach(button=>{
  button.onclick=()=>v10BusinessSelectModule(button.dataset.businessModule,button);
  button.onkeydown=event=>{const ids=['training','commission','resources','gifts'],index=ids.indexOf(button.dataset.businessModule);let next;if(event.key==='ArrowRight')next=ids[(index+1)%ids.length];else if(event.key==='ArrowLeft')next=ids[(index+ids.length-1)%ids.length];else if(event.key==='Home')next=ids[0];else if(event.key==='End')next=ids[ids.length-1];else return;event.preventDefault();v10BusinessSelectModule(next,document.querySelector(`[data-business-module="${next}"]`));};
 });
 document.querySelectorAll('[data-business-training]').forEach(button=>button.onclick=()=>{learningSelected='';renderContent();});
 document.querySelectorAll('[data-business-course]').forEach(button=>button.onclick=()=>v10BusinessOpenTraining(button.dataset.businessCourse));
 document.querySelectorAll('[data-business-refresh]').forEach(button=>button.onclick=()=>v10BusinessRefreshLearning());
 document.querySelectorAll('[data-business-policy]').forEach(button=>{
  button.onclick=()=>{v10BusinessState().policy=button.dataset.businessPolicy;renderContent();v10BusinessFocusPolicy(button.dataset.businessPolicy);};
  button.onkeydown=event=>{const ids=['policy','rules','faq'],index=ids.indexOf(button.dataset.businessPolicy);let next;if(event.key==='ArrowRight')next=ids[(index+1)%ids.length];else if(event.key==='ArrowLeft')next=ids[(index+ids.length-1)%ids.length];else if(event.key==='Home')next=ids[0];else if(event.key==='End')next=ids[ids.length-1];else return;event.preventDefault();v10BusinessState().policy=next;renderContent();v10BusinessFocusPolicy(next);};
 });
}
function v10BusinessCaptureFocus(){
 const element=document.activeElement;if(!element?.closest('.v10-business-center'))return null;
 return {user:currentUser,element,id:element.id,top:(document.scrollingElement||document.documentElement).scrollTop,tabsLeft:document.querySelector('.v10-business-policytabs')?.scrollLeft||0};
}
const v10BusinessPreviousRenderContent=renderContent;
renderContent=function(){
 const state=v10BusinessState();
 if(page!=='business'){v10BusinessPreviousRenderContent();return;}
 learningSession();
 const focus=v10BusinessCaptureFocus(),restore=state.restoreTraining;state.restoreTraining=false;
 if(restore&&state.active==='training')v10BusinessRestoreTraining();
 const content=document.querySelector('#content');let hub=content.querySelector('.v10-business-center');
 if(!hub||hub.businessOwner!==currentUser){renderWorkspaceContent(v10BusinessHTML());hub=content.querySelector('.v10-business-center');hub.businessOwner=currentUser;}
 const region=hub.querySelector('[data-business-content]'),previousModule=region.dataset.module;
 const training=state.active==='training';
 if(training&&previousModule==='training'&&deferSearchCompositionRender())return;
 const previous=training?(learningCaptureReading()||(restore?state.training?.reading:null)):null;
 hub.querySelectorAll('[data-business-module]').forEach(button=>{const selected=button.dataset.businessModule===state.active;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));});
 if(training){renderWorkspaceContent(learningHTML('training'),region);learningRestoreReading(previous);bindLearningUI();}
 else if(state.active==='gifts'&&typeof mountV10Gifts==='function')mountV10Gifts(region);
 else renderWorkspaceContent(state.active==='commission'?v10BusinessCommissionHTML():v10BusinessResourcesHTML(),region);
 region.dataset.module=state.active;bindV10BusinessUI();
 if(focus&&focus.user===currentUser){const target=focus.element.isConnected?focus.element:focus.id?document.getElementById(focus.id):null;if(target&&!target.disabled&&target!==document.activeElement)target.focus({preventScroll:true});const strip=document.querySelector('.v10-business-policytabs');if(strip)strip.scrollLeft=focus.tabsLeft;if(!restore)(document.scrollingElement||document.documentElement).scrollTop=focus.top;}
 if(training&&restore&&state.training)(document.scrollingElement||document.documentElement).scrollTop=state.training.scrollTop;
};
const v10BusinessPreviousNav=nav;
nav=function(destination){
 const state=v10BusinessState(),user=state.user,from=page;
 if((from==='business'&&state.active==='training'||from==='training')&&learningAccount===user)v10BusinessCaptureTraining();
 if(destination==='training'){destination='business';state.active='training';}
 if(destination==='business'&&state.active==='training')state.restoreTraining=true;
 v10BusinessPreviousNav(destination);
 if(page!==destination||currentUser!==user)return;
};
