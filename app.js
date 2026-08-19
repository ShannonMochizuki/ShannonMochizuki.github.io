
const DB_NAME='modelKitPortfolioDB', STORE='kits', VERSION=1;
let db, allKits=[];

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,VERSION);
    req.onupgradeneeded=()=>{ const d=req.result; if(!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE,{keyPath:'id'}); };
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
function tx(mode='readonly'){ return db.transaction(STORE,mode).objectStore(STORE); }
function getAll(){ return new Promise((res,rej)=>{const r=tx().getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}); }
function put(item){ return new Promise((res,rej)=>{const r=tx('readwrite').put(item);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);}); }
function del(id){ return new Promise((res,rej)=>{const r=tx('readwrite').delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);}); }
function clear(){ return new Promise((res,rej)=>{const r=tx('readwrite').clear();r.onsuccess=()=>res();r.onerror=()=>rej(r.error);}); }

async function seedIfEmpty(force=false){
  const existing=await getAll();
  if(existing.length && !force) return;
  const seed=await fetch('seed.json').then(r=>r.json());
  if(force) await clear();
  for(const k of seed) await put(k);
}
const money=v=>v==null?'—':`S$${Number(v).toFixed(2)}`;
const roi=k=>(k.value!=null&&k.paid!=null&&k.paid>0)?((k.value-k.paid)/k.paid)*100:null;
function render(){
  const q=document.querySelector('#search').value.toLowerCase().trim();
  const ff=document.querySelector('#franchiseFilter').value;
  const sort=document.querySelector('#sort').value;
  let data=allKits.filter(k=>(!ff||k.franchise===ff)&&(!q||`${k.name} ${k.series||''} ${k.grade||''}`.toLowerCase().includes(q)));
  if(sort==='value') data.sort((a,b)=>(b.value??-1)-(a.value??-1));
  else if(sort==='rarity') data.sort((a,b)=>(b.rarity??-1)-(a.rarity??-1));
  else if(sort==='roi') data.sort((a,b)=>(roi(b)??-999)-(roi(a)??-999));
  else data.sort((a,b)=>a.name.localeCompare(b.name));
  document.querySelector('#count').textContent=`${data.length} of ${allKits.length} kits`;

  const spent=allKits.reduce((s,k)=>s+(k.paid||0),0), val=allKits.reduce((s,k)=>s+(k.value||0),0), known=allKits.filter(k=>k.paid!=null).length;
  document.querySelector('#metrics').innerHTML=[
    ['Total kits',allKits.length,'collection size'],
    ['Known spent',money(spent),`${known} known costs`],
    ['Tracked value',money(val),'known market values'],
    ['Paper gain',money(val-spent),'not ROI-comparable when costs are missing']
  ].map(x=>`<div class="metric"><div class="muted">${x[0]}</div><div class="v">${x[1]}</div><div class="muted">${x[2]}</div></div>`).join('');

  document.querySelector('#list').innerHTML=data.map(k=>{
    const r=roi(k), cls=r==null?'':r>=0?'good':'bad';
    return `<article class="item" data-id="${k.id}">
      <div class="itemTop"><div><div class="name">${esc(k.name)}</div><div class="tags"><span class="tag">${esc(k.grade||'')}</span><span class="tag">${esc(k.scale||'')}</span><span class="tag">${esc(k.franchise||'')}</span></div></div>
      <div class="right"><div class="value">${money(k.value)}</div><div class="muted">rarity ${k.rarity??'—'}/10</div></div></div>
      <div class="itemBottom"><span>${k.paid==null?'cost unknown':`paid ${money(k.paid)}`}</span><span class="${cls}">${r==null?'ROI —':`${r>=0?'+':''}${r.toFixed(1)}% ROI`}</span></div>
    </article>`;
  }).join('');
  document.querySelectorAll('.item').forEach(el=>el.addEventListener('click',()=>openEditor(allKits.find(k=>k.id===el.dataset.id))));
}
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function openEditor(k=null){
  const d=document.querySelector('#editor'), f=id=>document.querySelector('#'+id);
  f('editorTitle').textContent=k?'Edit kit':'Add kit'; f('kitId').value=k?.id||'';
  ['name','franchise','grade','scale','series','paid','value','rarity','status','notes'].forEach(id=>f(id).value=k?.[id]??'');
  f('deleteBtn').style.display=k?'inline-block':'none'; d.showModal();
}
async function refresh(){ allKits=await getAll(); render(); }
document.querySelector('#addBtn').addEventListener('click',()=>openEditor());
document.querySelector('#saveBtn').addEventListener('click',async()=>{
  const f=id=>document.querySelector('#'+id), existing=f('kitId').value;
  const id=existing||`KIT-${String(Math.max(0,...allKits.map(k=>+k.id.split('-')[1]||0))+1).padStart(3,'0')}`;
  const item={id,name:f('name').value.trim(),franchise:f('franchise').value.trim(),grade:f('grade').value.trim(),scale:f('scale').value.trim(),series:f('series').value.trim(),
    paid:f('paid').value===''?null:+f('paid').value,value:f('value').value===''?null:+f('value').value,rarity:f('rarity').value===''?null:+f('rarity').value,status:f('status').value,notes:f('notes').value.trim()};
  if(!item.name) return;
  await put(item); document.querySelector('#editor').close(); await refresh();
});
document.querySelector('#deleteBtn').addEventListener('click',async()=>{
  const id=document.querySelector('#kitId').value; if(id&&confirm('Delete this kit?')){await del(id);document.querySelector('#editor').close();await refresh();}
});
['search','franchiseFilter','sort'].forEach(id=>document.querySelector('#'+id).addEventListener('input',render));
document.querySelector('#backupBtn').addEventListener('click',()=>document.querySelector('#backupDialog').showModal());
document.querySelector('#closeBackupBtn').addEventListener('click',()=>document.querySelector('#backupDialog').close());
document.querySelector('#exportBtn').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(allKits,null,2)],{type:'application/json'}), a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='model-kit-portfolio-backup.json';a.click();URL.revokeObjectURL(a.href);
});
document.querySelector('#importFile').addEventListener('change',async e=>{
  const file=e.target.files[0]; if(!file)return; const arr=JSON.parse(await file.text()); if(!Array.isArray(arr))return alert('Invalid backup.');
  await clear(); for(const k of arr) await put(k); await refresh(); document.querySelector('#backupDialog').close();
});
document.querySelector('#resetDataBtn').addEventListener('click',async()=>{if(confirm('Reset app data?')){await seedIfEmpty(true);await refresh();document.querySelector('#backupDialog').close();}});
(async()=>{ db=await openDB(); await seedIfEmpty(); await refresh(); if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js'); })();
