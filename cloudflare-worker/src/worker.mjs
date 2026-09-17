const DAY=86400000,MAX=50*1024*1024;
const BLOCKED=new Set(['exe','bat','cmd','com','scr','msi','apk','sh','ps1']);
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8',...headers}});
function cors(request,env){const origin=request.headers.get('Origin')||'';const allowed=(env.ALLOWED_ORIGIN||'').split(',').map(x=>x.trim());return allowed.includes(origin)?{'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Methods':'POST,PATCH,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,X-File-Name,X-Delete-Token'}:{}}
function safeName(value){let name='archivo';try{name=decodeURIComponent(value||'archivo')}catch{}return name.replace(/[\\/\u0000-\u001f\u007f]/g,'_').trim().slice(0,180)||'archivo'}
const extension=name=>(name.split('.').pop()||'').toLowerCase();
function randomToken(){const a=new Uint8Array(32);crypto.getRandomValues(a);return [...a].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function hash(value){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function row(env,id){return env.DB.prepare('SELECT * FROM files WHERE id = ?').bind(id).first()}
async function authorized(request,file){const token=request.headers.get('X-Delete-Token')||'';return token&&await hash(token)===file.token_hash}
async function erase(env,file){await env.FILES.delete(file.object_key);await env.DB.prepare('DELETE FROM files WHERE id = ?').bind(file.id).run()}
export default {
 async fetch(request,env){
  const url=new URL(request.url),headers=cors(request,env);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  try{
   if(request.method==='POST'&&url.pathname==='/api/files'){
    if(request.headers.get('Origin')&&!headers['Access-Control-Allow-Origin'])return json({error:'Origen no autorizado.'},403);
    const size=Number(request.headers.get('Content-Length')||0),name=safeName(request.headers.get('X-File-Name'));
    if(!size)return json({error:'El archivo está vacío o no indica su tamaño.'},400,headers);
    if(size>MAX)return json({error:'El archivo supera el máximo de 50 MB.'},413,headers);
    if(BLOCKED.has(extension(name)))return json({error:'Este tipo de archivo está bloqueado por seguridad.'},415,headers);
    const id=crypto.randomUUID(),token=randomToken(),created=Date.now(),expires=created+DAY,key=`uploads/${id}`;
    await env.FILES.put(key,request.body,{httpMetadata:{contentType:request.headers.get('Content-Type')||'application/octet-stream'},customMetadata:{originalName:name}});
    try{await env.DB.prepare('INSERT INTO files (id, object_key, original_name, content_type, size_bytes, token_hash, created_at, expires_at, keep) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)').bind(id,key,name,request.headers.get('Content-Type')||'application/octet-stream',size,await hash(token),created,expires).run()}catch(error){await env.FILES.delete(key);throw error}
    return json({id,deleteToken:token,createdAt:created,expiresAt:expires,downloadUrl:`${url.origin}/f/${id}`},201,headers);
   }
   if(request.method==='POST'&&url.pathname==='/api/links'){
    if(request.headers.get('Origin')&&!headers['Access-Control-Allow-Origin'])return json({error:'Origen no autorizado.'},403);
    const body=await request.json().catch(()=>null),slug=String(body?.slug||'').toLowerCase(),target=String(body?.target||'').trim();
    if(!/^[a-z0-9_-]{3,32}$/.test(slug))return json({error:'El nombre corto debe tener de 3 a 32 letras, números, guion o guion bajo.'},400,headers);
    if(['api','cdn-cgi'].includes(slug))return json({error:'Ese nombre está reservado.'},400,headers);
    let destination;try{destination=new URL(target);if(!['http:','https:'].includes(destination.protocol))throw 0}catch{return json({error:'La URL de destino no es válida.'},400,headers)}
    try{await env.DB.prepare('INSERT INTO short_links (slug, target_url, created_at, visits) VALUES (?, ?, ?, 0)').bind(slug,destination.href,Date.now()).run()}catch(error){if(String(error).toLowerCase().includes('unique'))return json({error:'Ese nombre corto ya está ocupado. Elige otro.'},409,headers);throw error}
    return json({slug,targetUrl:destination.href,shortUrl:`${url.origin}/${slug}`},201,headers);
   }
   const short=url.pathname.match(/^\/([a-z0-9_-]{3,32})$/i);
   if(request.method==='GET'&&short){const slug=short[1].toLowerCase();const link=await env.DB.prepare('SELECT target_url FROM short_links WHERE slug = ?').bind(slug).first();if(!link)return new Response('Enlace corto no encontrado.',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8'}});await env.DB.prepare('UPDATE short_links SET visits = visits + 1 WHERE slug = ?').bind(slug).run();return Response.redirect(link.target_url,302)}
   const download=url.pathname.match(/^\/f\/([0-9a-f-]{36})$/i);
   if(request.method==='GET'&&download){const file=await row(env,download[1]);if(!file)return new Response('Archivo no encontrado.',{status:404});if(!file.keep&&file.expires_at<=Date.now()){await erase(env,file);return new Response('Este archivo ha caducado.',{status:410})}const object=await env.FILES.get(file.object_key);if(!object){await env.DB.prepare('DELETE FROM files WHERE id = ?').bind(file.id).run();return new Response('Archivo no encontrado.',{status:404})}const h=new Headers();object.writeHttpMetadata(h);h.set('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(file.original_name)}`);h.set('Content-Length',String(file.size_bytes));h.set('X-Content-Type-Options','nosniff');h.set('Cache-Control','private, no-store');return new Response(object.body,{headers:h})}
   const manage=url.pathname.match(/^\/api\/files\/([0-9a-f-]{36})$/i);
   if(manage&&(request.method==='PATCH'||request.method==='DELETE')){const file=await row(env,manage[1]);if(!file)return json({error:'El archivo ya no existe.'},404,headers);if(!await authorized(request,file))return json({error:'No autorizado.'},403,headers);if(request.method==='DELETE'){await erase(env,file);return json({ok:true},200,headers)}const body=await request.json().catch(()=>null);if(!body||typeof body.keep!=='boolean')return json({error:'Solicitud incorrecta.'},400,headers);const expires=body.keep?null:Date.now()+DAY;await env.DB.prepare('UPDATE files SET keep = ?, expires_at = ? WHERE id = ?').bind(body.keep?1:0,expires,file.id).run();return json({ok:true,keep:body.keep,expiresAt:expires},200,headers)}
   return json({error:'Ruta no encontrada.'},404,headers);
  }catch(error){console.error(error);return json({error:'Servicio temporalmente no disponible.'},500,headers)}
 },
 async scheduled(_event,env,ctx){ctx.waitUntil((async()=>{const result=await env.DB.prepare('SELECT * FROM files WHERE keep = 0 AND expires_at <= ? LIMIT 100').bind(Date.now()).all();for(const file of result.results||[])await erase(env,file)})())}
};
