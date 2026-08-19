const APP_VERSION='8.0';
const BUILD_ID='2026-08-20-v8';

const DB_NAME='modelKitPortfolioDB';
const KIT_STORE='kits';
const PHOTO_STORE='photos';
const PAINT_STORE='paints';
const VERSION=3;

let db, allKits=[], allPhotos=[], allPaints=[], activeEditorId=null;

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,VERSION);
    req.onupgradeneeded=()=>{
      const d=req.result;
      if(!d.objectStoreNames.contains(KIT_STORE)) d.createObjectStore(KIT_STORE,{keyPath:'id'});
      if(!d.objectStoreNames.contains(PHOTO_STORE)){
        const s=d.createObjectStore(PHOTO_STORE,{keyPath:'id'});
        s.createIndex('kitId','kitId',{unique:false});
      }
      if(!d.objectStoreNames.contains(PAINT_STORE)){
        d.createObjectStore(PAINT_STORE,{keyPath:'id'});
      }
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}

function store(name,mode='readonly'){
  return db.transaction(name,mode).objectStore(name);
}
function getAllStore(name){
  return new Promise((res,rej)=>{
    const r=store(name).getAll();
    r.onsuccess=()=>res(r.result);
    r.onerror=()=>rej(r.error);
  });
}
function putStore(name,item){
  return new Promise((res,rej)=>{
    const r=store(name,'readwrite').put(item);
    r.onsuccess=()=>res();
    r.onerror=()=>rej(r.error);
  });
}
function deleteStore(name,id){
  return new Promise((res,rej)=>{
    const r=store(name,'readwrite').delete(id);
    r.onsuccess=()=>res();
    r.onerror=()=>rej(r.error);
  });
}
function clearStore(name){
  return new Promise((res,rej)=>{
    const r=store(name,'readwrite').clear();
    r.onsuccess=()=>res();
    r.onerror=()=>rej(r.error);
  });
}

async function seedIfEmpty(){
  const existing=await getAllStore(KIT_STORE);
  if(existing.length) return;
  const seed=await fetch('seed.json').then(r=>r.json());
  for(const k of seed) await putStore(KIT_STORE,k);
}

const money=v=>v==null?'—':`S$${Number(v).toFixed(2)}`;
const roi=k=>(k.value!=null&&k.paid!=null&&k.paid>0)?((k.value-k.paid)/k.paid)*100:null;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const photosFor=kitId=>allPhotos.filter(p=>p.kitId===kitId).sort((a,b)=>(b.cover?1:0)-(a.cover?1:0)||(a.createdAt||0)-(b.createdAt||0));
const coverFor=kitId=>photosFor(kitId).find(p=>p.cover)||photosFor(kitId)[0]||null;

function blobUrl(photo){
  if(!photo) return null;
  if(photo._url) return photo._url;
  photo._url=URL.createObjectURL(photo.blob);
  return photo._url;
}


const paintById=id=>allPaints.find(p=>p.id===id);
const paintLabel=p=>p?[p.brand,p.code,p.name].filter(Boolean).join(' '):'Unknown paint';

function renderPaintInventorySummary(){
  const summary=document.querySelector('#paintSummary');
  const quick=document.querySelector('#paintQuickList');
  if(!summary||!quick) return;
  const inStock=allPaints.filter(p=>p.stock==='In stock').length;
  const low=allPaints.filter(p=>p.stock==='Low').length;
  summary.textContent=`${allPaints.length} paints · ${inStock} in stock${low?` · ${low} low`:''}`;
  if(!allPaints.length){
    quick.innerHTML='<span class="muted">No paints added yet.</span>';
    return;
  }
  quick.innerHTML=allPaints.slice(0,12).map(p=>{
    const cls=(p.stock||'').toLowerCase().replace(' ','');
    return `<span class="paintChip ${cls}"><span class="paintDot"></span>${esc([p.code,p.name].filter(Boolean).join(' ')||p.brand||'Paint')}</span>`;
  }).join('');
}

function renderKitPaintPicker(){
  const box=document.querySelector('#kitPaintPicker');
  if(!box) return;
  const kit=activeEditorId?allKits.find(k=>k.id===activeEditorId):null;
  const selected=new Set(kit?.paintIds||[]);
  if(!allPaints.length){
    box.innerHTML='<div class="muted">Add paints to your inventory first.</div>';
    return;
  }
  box.innerHTML=allPaints
    .slice()
    .sort((a,b)=>paintLabel(a).localeCompare(paintLabel(b)))
    .map(p=>`<label class="paintCheck">
      <input type="checkbox" value="${p.id}" ${selected.has(p.id)?'checked':''}>
      <span class="paintCheckText">${esc(paintLabel(p))}</span>
      <span class="paintCheckStock">${esc(p.stock||'')}</span>
    </label>`).join('');
}

function selectedKitPaintIds(){
  return [...document.querySelectorAll('#kitPaintPicker input[type="checkbox"]:checked')].map(x=>x.value);
}

function render(){
  const q=document.querySelector('#search').value.toLowerCase().trim();
  const ff=document.querySelector('#franchiseFilter').value;
  const sort=document.querySelector('#sort').value;

  let data=allKits.filter(k=>
    (!ff||k.franchise===ff) &&
    (!q||`${k.name} ${k.series||''} ${k.grade||''}`.toLowerCase().includes(q))
  );

  if(sort==='value') data.sort((a,b)=>(b.value??-1)-(a.value??-1));
  else if(sort==='rarity') data.sort((a,b)=>(b.rarity??-1)-(a.rarity??-1));
  else if(sort==='roi') data.sort((a,b)=>(roi(b)??-999)-(roi(a)??-999));
  else data.sort((a,b)=>a.name.localeCompare(b.name));

  document.querySelector('#count').textContent=`${data.length} of ${allKits.length} kits`;

  const spent=allKits.reduce((s,k)=>s+(k.paid||0),0);
  const val=allKits.reduce((s,k)=>s+(k.value||0),0);
  const known=allKits.filter(k=>k.paid!=null).length;
  const matched=allKits.filter(k=>k.paid!=null&&k.value!=null);
  const matchedPaid=matched.reduce((s,k)=>s+k.paid,0);
  const matchedValue=matched.reduce((s,k)=>s+k.value,0);
  const gain=matchedValue-matchedPaid;

  document.querySelector('#metrics').innerHTML=[
    ['Total kits',allKits.length,'collection size'],
    ['Known spent',money(spent),`${known} known costs`],
    ['Tracked value',money(val),'known market values'],
    ['Comparable gain',money(gain),`${matched.length} kits with cost + value`]
  ].map(x=>`<div class="metric"><div class="muted">${x[0]}</div><div class="v">${x[1]}</div><div class="muted">${x[2]}</div></div>`).join('');

  document.querySelector('#list').innerHTML=data.map(k=>{
    const r=roi(k), cls=r==null?'':r>=0?'good':'bad';
    const cover=coverFor(k.id), src=cover?blobUrl(cover):null;
    const thumb=src
      ? `<img class="thumb" src="${src}" alt="">`
      : `<div class="thumb placeholder" aria-hidden="true">📦</div>`;

    return `<article class="item" data-id="${k.id}">
      <div class="itemBody">
        <div class="itemTop">
          <div class="itemMain">
            ${thumb}
            <div>
              <div class="name">${esc(k.name)}</div>
              <div class="tags">
                <span class="tag">${esc(k.grade||'')}</span>
                <span class="tag">${esc(k.scale||'')}</span>
                <span class="tag">${esc(k.franchise||'')}</span>
              </div>
              ${photosFor(k.id).length ? `<div class="muted" style="margin-top:5px">${photosFor(k.id).length} photo${photosFor(k.id).length===1?'':'s'}</div>` : ''}
            </div>
          </div>
          <div class="right">
            <div class="value">${money(k.value)}</div>
            <div class="muted">rarity ${k.rarity??'—'}/10</div>
          </div>
        </div>
        ${(k.paintIds||[]).length?`<div class="tilePaints">Paints: ${(k.paintIds||[]).map(id=>paintById(id)).filter(Boolean).map(p=>esc([p.code,p.name].filter(Boolean).join(' '))).join(' · ')}</div>`:''}
        <div class="itemBottom">
          <span>${k.paid==null?(k.paidJpy!=null?`paid ¥${Number(k.paidJpy).toLocaleString()}`:'cost unknown'):`paid ${money(k.paid)}${k.paidJpy!=null?` · ¥${Number(k.paidJpy).toLocaleString()}`:''}`}</span>
          <span class="${cls}">${r==null?'ROI —':`${r>=0?'+':''}${r.toFixed(1)}% ROI`}</span>
        </div>
      </div>
    </article>`;
  }).join('');

  document.querySelectorAll('.item').forEach(el=>
    el.addEventListener('click',()=>openEditor(allKits.find(k=>k.id===el.dataset.id)))
  );
}

function renderEditorPhotos(){
  const grid=document.querySelector('#photoGrid');
  if(!activeEditorId){
    grid.innerHTML='<div class="emptyPhotos">Save the kit first, then add photos.</div>';
    document.querySelector('#photoInput').disabled=true;
    return;
  }
  document.querySelector('#photoInput').disabled=false;

  const photos=photosFor(activeEditorId);
  if(!photos.length){
    grid.innerHTML='<div class="emptyPhotos">No photos yet.</div>';
    return;
  }

  grid.innerHTML=photos.map(p=>`
    <div class="photoTile" data-photo-id="${p.id}">
      <img src="${blobUrl(p)}" alt="">
      ${p.cover?'<div class="photoCover">Cover</div>':''}
      <div class="photoActions">
        <button type="button" data-action="cover">${p.cover?'Cover':'Set cover'}</button>
        <button type="button" data-action="delete">Remove</button>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.photoTile').forEach(tile=>{
    tile.querySelector('[data-action="cover"]').addEventListener('click',async e=>{
      e.stopPropagation();
      await setCover(tile.dataset.photoId);
    });
    tile.querySelector('[data-action="delete"]').addEventListener('click',async e=>{
      e.stopPropagation();
      await removePhoto(tile.dataset.photoId);
    });
  });
}

function openEditor(k=null){
  const d=document.querySelector('#editor'), f=id=>document.querySelector('#'+id);
  activeEditorId=k?.id||null;
  f('editorTitle').textContent=k?'Edit kit':'Add kit';
  f('kitId').value=k?.id||'';
  ['name','franchise','grade','scale','series','paid','paidJpy','value','rarity','status','notes']
    .forEach(id=>f(id).value=k?.[id]??'');
  f('deleteBtn').style.display=k?'inline-block':'none';
  renderEditorPhotos();
  renderKitPaintPicker();
  d.showModal();
}

async function refresh(){
  allKits=await getAllStore(KIT_STORE);
  allPhotos=await getAllStore(PHOTO_STORE);
  allPaints=await getAllStore(PAINT_STORE);
  render();
  renderPaintInventorySummary();
  if(document.querySelector('#editor').open){
    renderEditorPhotos();
    renderKitPaintPicker();
  }
  if(document.querySelector('#paintDialog')?.open) renderPaintList();
}

function nextKitId(){
  return `KIT-${String(Math.max(0,...allKits.map(k=>+String(k.id).split('-')[1]||0))+1).padStart(3,'0')}`;
}

async function compressImage(file){
  const bitmap=await createImageBitmap(file);
  const maxEdge=1400;
  const scale=Math.min(1,maxEdge/Math.max(bitmap.width,bitmap.height));
  const width=Math.max(1,Math.round(bitmap.width*scale));
  const height=Math.max(1,Math.round(bitmap.height*scale));
  const canvas=document.createElement('canvas');
  canvas.width=width; canvas.height=height;
  const ctx=canvas.getContext('2d',{alpha:false});
  ctx.drawImage(bitmap,0,0,width,height);
  bitmap.close();
  return await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.82));
}

async function addPhotos(files){
  if(!activeEditorId) return;
  const existing=photosFor(activeEditorId);
  let isFirst=existing.length===0;

  for(const file of files){
    if(!file.type.startsWith('image/')) continue;
    const blob=await compressImage(file);
    const rec={
      id:`P-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      kitId:activeEditorId,
      blob,
      cover:isFirst,
      createdAt:Date.now(),
      originalName:file.name||''
    };
    isFirst=false;
    await putStore(PHOTO_STORE,rec);
  }
  await refresh();
}

async function setCover(photoId){
  const target=allPhotos.find(p=>p.id===photoId);
  if(!target) return;
  const same=photosFor(target.kitId);

  for(const p of same){
    if(p.cover!== (p.id===photoId)){
      await putStore(PHOTO_STORE,{...p,cover:p.id===photoId,_url:undefined});
    }
  }
  await refresh();
}

async function removePhoto(photoId){
  const p=allPhotos.find(x=>x.id===photoId);
  if(!p) return;
  if(!confirm('Remove this photo?')) return;

  const wasCover=p.cover;
  const kitId=p.kitId;
  await deleteStore(PHOTO_STORE,photoId);

  if(wasCover){
    const remaining=(await getAllStore(PHOTO_STORE)).filter(x=>x.kitId===kitId);
    if(remaining.length){
      remaining.sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
      await putStore(PHOTO_STORE,{...remaining[0],cover:true});
    }
  }
  await refresh();
}

function blobToDataUrl(blob){
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=()=>resolve(r.result);
    r.onerror=()=>reject(r.error);
    r.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl){
  const [meta,b64]=dataUrl.split(',');
  const mime=(meta.match(/data:(.*?);base64/)||[])[1]||'image/jpeg';
  const bytes=atob(b64);
  const arr=new Uint8Array(bytes.length);
  for(let i=0;i<bytes.length;i++) arr[i]=bytes.charCodeAt(i);
  return new Blob([arr],{type:mime});
}


function clearPaintEditor(){
  ['paintId','paintBrand','paintCode','paintName','paintNotes'].forEach(id=>document.querySelector('#'+id).value='');
  document.querySelector('#paintType').value='';
  document.querySelector('#paintStock').value='In stock';
  document.querySelector('#paintEditorTitle').textContent='Add paint';
  document.querySelector('#paintDeleteBtn').style.display='none';
}

function renderPaintList(){
  const list=document.querySelector('#paintList');
  if(!list) return;
  if(!allPaints.length){
    list.innerHTML='<div class="muted">No paints in inventory yet.</div>';
    return;
  }
  list.innerHTML=allPaints.slice().sort((a,b)=>paintLabel(a).localeCompare(paintLabel(b))).map(p=>`
    <button type="button" class="paintRow" data-paint-id="${p.id}">
      <div class="paintRowMain">
        <div class="paintRowName">${esc(paintLabel(p))}</div>
        <div class="paintRowMeta">${esc([p.type,p.notes].filter(Boolean).join(' · '))}</div>
      </div>
      <span class="stockBadge ${esc(p.stock||'')}">${esc(p.stock||'')}</span>
    </button>`).join('');
  list.querySelectorAll('.paintRow').forEach(row=>row.addEventListener('click',()=>{
    const p=allPaints.find(x=>x.id===row.dataset.paintId);
    if(!p) return;
    document.querySelector('#paintId').value=p.id;
    document.querySelector('#paintBrand').value=p.brand||'';
    document.querySelector('#paintCode').value=p.code||'';
    document.querySelector('#paintName').value=p.name||'';
    document.querySelector('#paintType').value=p.type||'';
    document.querySelector('#paintStock').value=p.stock||'In stock';
    document.querySelector('#paintNotes').value=p.notes||'';
    document.querySelector('#paintEditorTitle').textContent='Edit paint';
    document.querySelector('#paintDeleteBtn').style.display='inline-block';
  }));
}

async function savePaint(){
  const id=document.querySelector('#paintId').value || `PAINT-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
  const rec={
    id,
    brand:document.querySelector('#paintBrand').value.trim(),
    code:document.querySelector('#paintCode').value.trim(),
    name:document.querySelector('#paintName').value.trim(),
    type:document.querySelector('#paintType').value,
    stock:document.querySelector('#paintStock').value,
    notes:document.querySelector('#paintNotes').value.trim()
  };
  if(!rec.name&&!rec.code) return alert('Enter a paint name or code.');
  await putStore(PAINT_STORE,rec);
  clearPaintEditor();
  await refresh();
}

async function deletePaint(){
  const id=document.querySelector('#paintId').value;
  if(!id||!confirm('Delete this paint from your inventory?')) return;
  await deleteStore(PAINT_STORE,id);
  for(const k of allKits){
    if((k.paintIds||[]).includes(id)){
      await putStore(KIT_STORE,{...k,paintIds:(k.paintIds||[]).filter(x=>x!==id)});
    }
  }
  clearPaintEditor();
  await refresh();
}

async function exportBackup(){
  const status=document.querySelector('#backupStatus');
  status.textContent='Preparing backup…';

  const photos=[];
  for(const p of allPhotos){
    photos.push({
      id:p.id,kitId:p.kitId,cover:!!p.cover,createdAt:p.createdAt||null,
      originalName:p.originalName||'',dataUrl:await blobToDataUrl(p.blob)
    });
  }

  const backup={
    format:'model-kit-portfolio',
    version:2,
    exportedAt:new Date().toISOString(),
    kits:allKits,
    paints:allPaints,
    photos
  };

  const blob=new Blob([JSON.stringify(backup)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`model-kit-portfolio-full-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  status.textContent=`Backup exported: ${allKits.length} kits, ${allPaints.length} paints, ${photos.length} photos.`;
}

async function importBackupFile(file){
  const status=document.querySelector('#backupStatus');
  status.textContent='Importing…';

  const parsed=JSON.parse(await file.text());

  // Support the old array-only backup format.
  if(Array.isArray(parsed)){
    await clearStore(KIT_STORE);
    for(const k of parsed) await putStore(KIT_STORE,k);
    await refresh();
    status.textContent=`Imported ${parsed.length} kits. No photos were present in this older backup.`;
    return;
  }

  if(parsed?.format!=='model-kit-portfolio'||!Array.isArray(parsed.kits)){
    throw new Error('Invalid backup format.');
  }

  await clearStore(KIT_STORE);
  await clearStore(PHOTO_STORE);
  await clearStore(PAINT_STORE);

  for(const k of parsed.kits) await putStore(KIT_STORE,k);
  for(const p of (parsed.paints||[])) await putStore(PAINT_STORE,p);
  for(const p of (parsed.photos||[])){
    await putStore(PHOTO_STORE,{
      id:p.id,kitId:p.kitId,cover:!!p.cover,createdAt:p.createdAt||Date.now(),
      originalName:p.originalName||'',blob:dataUrlToBlob(p.dataUrl)
    });
  }

  await refresh();
  status.textContent=`Imported ${parsed.kits.length} kits, ${(parsed.paints||[]).length} paints and ${(parsed.photos||[]).length} photos.`;
}

document.querySelector('#addBtn').addEventListener('click',()=>openEditor());

document.querySelector('#saveBtn').addEventListener('click',async()=>{
  const f=id=>document.querySelector('#'+id);
  const existing=f('kitId').value;
  const id=existing||nextKitId();

  const item={
    id,
    name:f('name').value.trim(),
    franchise:f('franchise').value.trim(),
    grade:f('grade').value.trim(),
    scale:f('scale').value.trim(),
    series:f('series').value.trim(),
    paid:f('paid').value===''?null:+f('paid').value,
    paidJpy:f('paidJpy').value===''?null:+f('paidJpy').value,
    value:f('value').value===''?null:+f('value').value,
    rarity:f('rarity').value===''?null:+f('rarity').value,
    status:f('status').value,
    paintIds:selectedKitPaintIds(),
    notes:f('notes').value.trim()
  };

  if(!item.name) return;
  await putStore(KIT_STORE,item);
  activeEditorId=id;
  f('kitId').value=id;
  await refresh();
  document.querySelector('#editor').close();
});

document.querySelector('#deleteBtn').addEventListener('click',async()=>{
  const id=document.querySelector('#kitId').value;
  if(!id||!confirm('Delete this kit and all of its locally stored photos?')) return;

  for(const p of photosFor(id)) await deleteStore(PHOTO_STORE,p.id);
  await deleteStore(KIT_STORE,id);
  document.querySelector('#editor').close();
  activeEditorId=null;
  await refresh();
});

document.querySelector('#photoInput').addEventListener('change',async e=>{
  const files=[...e.target.files];
  e.target.value='';
  if(files.length) await addPhotos(files);
});

['search','franchiseFilter','sort'].forEach(id=>
  document.querySelector('#'+id).addEventListener('input',render)
);


document.querySelector('#paintInventoryBtn').addEventListener('click',()=>{
  clearPaintEditor();
  renderPaintList();
  document.querySelector('#paintDialog').showModal();
});
document.querySelector('#closePaintBtn').addEventListener('click',()=>document.querySelector('#paintDialog').close());
document.querySelector('#paintSaveBtn').addEventListener('click',savePaint);
document.querySelector('#paintDeleteBtn').addEventListener('click',deletePaint);
document.querySelector('#paintClearBtn').addEventListener('click',clearPaintEditor);

document.querySelector('#backupBtn').addEventListener('click',()=>{
  document.querySelector('#backupStatus').textContent='';
  document.querySelector('#backupDialog').showModal();
});
document.querySelector('#closeBackupBtn').addEventListener('click',()=>document.querySelector('#backupDialog').close());
document.querySelector('#exportBtn').addEventListener('click',exportBackup);

document.querySelector('#importFile').addEventListener('change',async e=>{
  const file=e.target.files[0];
  e.target.value='';
  if(!file) return;
  try{ await importBackupFile(file); }
  catch(err){ document.querySelector('#backupStatus').textContent=`Import failed: ${err.message}`; }
});

document.querySelector('#resetDataBtn').addEventListener('click',async()=>{
  if(!confirm('Delete all collection records and all locally stored photos from this device?')) return;
  await clearStore(KIT_STORE);
  await clearStore(PHOTO_STORE);
  await clearStore(PAINT_STORE);
  await refresh();
  document.querySelector('#backupStatus').textContent='All local app data deleted.';
});


async function updateVersionStatus(){
  const badge=document.querySelector('#appVersionBadge');
  if(!badge) return;
  badge.textContent=`v${APP_VERSION}`;
  try{
    const r=await fetch(`version.json?ts=${Date.now()}`,{cache:'no-store'});
    const remote=await r.json();
    if(remote.version!==APP_VERSION){
      badge.textContent=`v${APP_VERSION} ↑`;
      badge.title=`Update available: v${remote.version}`;
    }else{
      badge.title='Latest deployed version';
    }
  }catch(e){
    badge.title='Offline version check unavailable';
  }
}
(async()=>{
  updateVersionStatus();
  db=await openDB();
  await seedIfEmpty();
  await refresh();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
})();
