/* V10 4C read-only projections. Fee roles and delivery facts come from the server. */
let v10HomeFeeLoad={user:null,store:null,items:null,trusted:false,status:'loading',error:'',updatedAt:'',sequence:0,promise:null};
const v10HomeFeeSessions=new WeakMap();
const v10HomeTaskSessions=new WeakMap();

function v10HomeFeeIdentity(){return typeof currentUser==='undefined'?null:currentUser;}
function v10HomeFeeSync(){
 const user=v10HomeFeeIdentity(),items=Array.isArray(store?.feeApplications)?store.feeApplications:null;
 if(user&&items&&!v10HomeFeeSessions.has(items))v10HomeFeeSessions.set(items,user);
 const trusted=!!user&&!!items&&v10HomeFeeSessions.get(items)===user;
 if(v10HomeFeeLoad.user!==user||v10HomeFeeLoad.store!==store||v10HomeFeeLoad.items!==items){
  v10HomeFeeLoad={user,store,items,trusted,status:trusted?'ready':'loading',error:'',updatedAt:'',sequence:v10HomeFeeLoad.sequence+1,promise:null};
 }
 return v10HomeFeeLoad;
}
function v10HomeFeesState(){
 const state=v10HomeFeeSync();
 return {status:state.status,error:state.error,hasData:state.trusted,updatedAt:state.updatedAt};
}
function v10HomeFeePaint(){
 if(v10HomeFeeIdentity()&&['home','fees'].includes(page)&&!document.querySelector('#overlay [role="dialog"]'))renderContent();
}
async function loadFeesState(options={}){
 const state=v10HomeFeeSync(),user=v10HomeFeeIdentity();
 if(!user)return false;
 if(state.promise&&!options.force)return state.promise;
 const source=store,items=state.items,sequence=++state.sequence;
 state.status='loading';state.error='';
 const current=()=>v10HomeFeeIdentity()===user&&v10HomeFeeLoad===state&&state.sequence===sequence;
 const unchanged=()=>store===source&&(Array.isArray(store.feeApplications)?store.feeApplications:null)===items;
 const pending=(async()=>{
  try{
   const result=await api('/api/fees');
   if(!current())return false;
   if(!unchanged()){v10HomeFeeSync();return false;}
   if(!Array.isArray(result?.items))throw Error('合作事项数据未完整返回，请重试');
   store.feeApplications=result.items;state.items=result.items;state.store=store;state.trusted=true;v10HomeFeeSessions.set(result.items,user);
   state.status='ready';state.error='';state.updatedAt=new Date().toISOString();
   v10HomeFeePaint();return true;
  }catch(error){
   if(!current())return false;
   if(!unchanged()){v10HomeFeeSync();return false;}
   state.status='error';state.error=error?.message||'合作事项加载失败，请重试';
   if(page==='fees'&&typeof toast==='function')toast(state.error);
   v10HomeFeePaint();return false;
  }finally{if(current())state.promise=null;}
 })();
 state.promise=pending;v10HomeFeePaint();return pending;
}
function v10HomeFeeRows(){
 const user=v10HomeFeeIdentity();if(!user||!v10HomeFeeSync().trusted)return [];
 const selected=new Map();
 for(const fee of Array.isArray(store.feeApplications)?store.feeApplications:[]){
  if(!fee||fee.id===undefined||fee.id===null||String(fee.id)==='')continue;
  const id=String(fee.id),prior=selected.get(id);
  if(!prior||Number(fee.version||0)>Number(prior.version||0))selected.set(id,fee);
 }
 return [...selected.values()].filter(fee=>{
  const sameOwner=fee.owner!==undefined&&fee.owner!==null&&String(fee.owner)===String(user.id);
  if(fee.isOwner===true)return fee.owner===undefined||fee.owner===null||sameOwner;
  return !sameOwner&&(fee.canApprove===true||fee.canReview===true);
 });
}
function v10HomeFeeProjection(){
 const state=v10HomeFeesState(),user=v10HomeFeeIdentity(),actionable=[],waiting=[],unassigned=[],groups={approval:[],publication:[],review:[]};
 const ownIds=new Set((typeof own==='function'?own():[]).filter(k=>!k.owner||String(k.owner)===String(user?.id)).map(k=>String(k.id)));
 for(const fee of v10HomeFeeRows()){
  if(!['submitted','approved'].includes(fee.status))continue;
  const owner=fee.isOwner===true&&(fee.owner===undefined||fee.owner===null||String(fee.owner)===String(user?.id));
  const available=owner&&fee.kolAvailable===true&&ownIds.has(String(fee.kolId));
  const delegated=!owner&&String(fee.owner)!==String(user?.id);
  const deliveries=Array.isArray(fee.deliveries)?fee.deliveries:[],missing=deliveries.filter(d=>d.published!==true),published=deliveries.some(d=>d.published===true);
  const pendingMoney=typeof feeMoneyPending==='function'?feeMoneyPending(fee):!!(fee.currency&&fee.currency!=='USD'||!fee.currency&&fee.amount);
  const reasons=[];
  const add=(type,label,mode,action='',extra={})=>reasons.push({type,kind:type,label,mode,action,...extra});
  if(fee.status==='submitted'){
   if(delegated&&fee.canApprove===true&&!pendingMoney)add('approval','待审批','action','approve');
   else add('approval',pendingMoney&&delegated&&fee.canApprove?'存量金额待处理':'等待审批','waiting');
  }
  if(missing.length){
   const extra={deliveryIds:missing.map(d=>String(d.id)),overdue:missing.some(d=>d.overdue===true),count:missing.length};
   if(available)add('publication',extra.overdue?'发布已逾期':'待登记发布','action','publication',extra);
   else add('publication',owner?'KOL已不在本人范围':'等待负责商务登记发布','waiting','',extra);
  }
  if(fee.status==='approved'&&published&&!fee.reviewRequested){
   if(available&&!pendingMoney)add('review','待提交核验','action','request_review');
   else add('review',owner?(pendingMoney?'存量金额待处理':'KOL已不在本人范围'):'等待负责商务提交核验','waiting');
  }
  if(fee.status==='approved'&&fee.reviewRequested&&(!fee.review||fee.needsReview===true)){
   if(delegated&&fee.canReview===true)add('review',fee.needsReview?'资料变更待复核':'待核验','action','verify');
   else if(fee.supervisorConfigured===false)add('review','待分配上级核验','unassigned');
   else add('review',fee.needsReview?'等待上级复核':'等待上级核验','waiting');
  }
  const entry=(subset)=>({id:String(fee.id),fee,reasons:subset,actionable:subset.some(reason=>reason.mode==='action')});
  const actions=reasons.filter(reason=>reason.mode==='action'),others=reasons.filter(reason=>reason.mode==='waiting'),unclaimed=reasons.filter(reason=>reason.mode==='unassigned');
  if(actions.length)actionable.push(entry(actions));
  if(others.length)waiting.push(entry(others));
  if(unclaimed.length)unassigned.push(entry(unclaimed));
  for(const type of Object.keys(groups)){const subset=actions.filter(reason=>reason.type===type);if(subset.length)groups[type].push(entry(subset));}
 }
 return {...state,actionable,waiting,unassigned,groups,actionCount:state.status==='ready'?actionable.length:null};
}
function v10HomeModel(){
 const user=v10HomeFeeIdentity();
 if(user&&store&&!v10HomeTaskSessions.has(store))v10HomeTaskSessions.set(store,user);
 const trusted=!!user&&v10HomeTaskSessions.get(store)===user;
 const all=(trusted&&typeof taskItems==='function'?taskItems():[]).filter(t=>!t.k?.owner||String(t.k.owner)===String(user.id)).slice().sort((a,b)=>((a.due||'9999')+(a.time||'23:59')).localeCompare((b.due||'9999')+(b.time||'23:59'))||String(a.id).localeCompare(String(b.id)));
 const tasks={all,today:all.filter(t=>taskGroup(t)==='today'),late:all.filter(t=>taskGroup(t)==='late'),week:all.filter(t=>inTaskTab(t,'week')),month:all.filter(t=>inTaskTab(t,'month')),unscheduled:all.filter(t=>taskGroup(t)==='unscheduled'),done:all.filter(t=>taskGroup(t)==='done')};
 tasks.counts=Object.fromEntries(Object.entries(tasks).map(([key,items])=>[key,items.length]));
 return {tasks,fees:v10HomeFeeProjection()};
}
