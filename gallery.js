(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const images = [
    {src:'assets/gallery/g1.webp', title:'بداية الحكاية', category:'seed', alt:'بداية من مبادرة التشجير'},
    {src:'assets/gallery/g4.webp', title:'أول أثر', category:'planting', alt:'لحظة من نشاط الزراعة'},
    {src:'assets/gallery/about.webp', title:'أيدٍ تصنع الفرق', category:'team', alt:'فريق المبادرة'},
    {src:'assets/gallery/g1.webp', title:'شتلة بتفرق', category:'seed', alt:'شتلة من المبادرة'},
    {src:'assets/gallery/g4.webp', title:'معاً نحو الأخضر', category:'team', alt:'مشاركة في أنشطة المبادرة'},
    {src:'assets/gallery/about.webp', title:'رحلة مستمرة', category:'planting', alt:'من رحلة التشجير'}
  ];
  const chapters = [
    {n:'01', title:'الشتلة', desc:'كل حكاية كبيرة بتبدأ ببذرة صغيرة؛ هنا تبدأ رحلتنا من أول نبتة.', stage:1},
    {n:'02', title:'الزراعة', desc:'لحظة تتحول فيها الفكرة إلى فعل، وتبدأ أولى خطوات الأثر.', stage:2},
    {n:'03', title:'الري', desc:'الاستمرار هو سر النمو؛ عناية متواصلة تمنح الحياة فرصة تكبر.', stage:3},
    {n:'04', title:'الفريق', desc:'الأثر يكبر بتكاتف الأيدي؛ وكل مشاركة تضيف غصناً جديداً للحكاية.', stage:4}
  ];
  const leafSets = [[], [[210,190],[270,170]], [[170,170],[210,120],[270,145],[310,190],[190,245],[290,245]], [[150,155],[190,105],[240,85],[290,110],[335,165],[350,220],[305,250],[255,275],[195,260],[145,220],[220,190],[285,195],[240,145],[180,190]]];
  function treeSvg(stage) {
    const trunk = ['M240 390 Q238 355 240 325','M240 390 Q225 330 240 240','M240 390 Q220 300 240 160','M240 390 Q215 280 240 105'][stage-1];
    const branches = stage < 2 ? '' : `<path class="tree-branch" pathLength="1" d="M239 285 Q205 255 175 220 M240 260 Q280 235 310 195 M238 225 Q210 195 205 165 M242 205 Q275 175 285 140"/>`;
    const leaves = leafSets[stage-1].map(([x,y],i)=>`<ellipse class="tree-leaf" style="--d:${.15+i*.06}s" cx="${x}" cy="${y}" rx="${stage===4?23:18}" ry="${stage===4?11:9}" transform="rotate(${i%2?28:-28} ${x} ${y})"/>`).join('');
    return `<svg class="tree-svg" viewBox="0 0 480 440" role="img" aria-label="شجرة تنمو في الفصل ${stage}"><path class="tree-root" pathLength="1" d="M240 380 Q205 405 175 410 M240 380 Q275 405 310 410 M240 380 Q235 410 220 420 M240 380 Q250 410 265 420"/><path class="tree-trunk" pathLength="1" d="${trunk}"/>${branches}${leaves}<ellipse cx="240" cy="398" rx="105" ry="9" fill="#a4c3a2" opacity=".25"/></svg>`;
  }
  const chapterRoot = $('#chapterList');
  chapters.forEach(ch => {
    const section = document.createElement('article'); section.className='chapter reveal'; section.innerHTML=`<div class="chapter-copy"><span class="chapter-number">CHAPTER ${ch.n}</span><h3>${ch.title}</h3><p>${ch.desc}</p></div><div class="chapter-art">${treeSvg(ch.stage)}</div>`;
    chapterRoot.appendChild(section);
  });
  const grid = $('#galleryGrid');
  images.forEach((item,i)=>{
    const card=document.createElement('article');card.className='gallery-item';card.dataset.category=item.category;card.dataset.index=i;
    const img=document.createElement('img');img.src=item.src;img.alt=item.alt;img.loading='lazy';img.decoding='async';
    img.addEventListener('error',()=>{img.remove();card.classList.add('image-missing');});
    const label=document.createElement('span');label.textContent=item.title;card.append(img,label);grid.appendChild(card);
    card.addEventListener('click',()=>openLightbox(i));
  });
  const heroCards=[...document.querySelectorAll('[data-hero]')];let heroIndex=0;
  function renderHero(){heroCards.forEach((img,slot)=>{const item=images[(heroIndex+slot)%images.length];img.style.opacity='.25';const next=new Image();next.onload=()=>{img.src=item.src;img.alt=item.alt;img.style.opacity='1';};next.onerror=()=>{img.style.opacity='1';};next.src=item.src;});$('#heroCount').textContent=`${String(heroIndex+1).padStart(2,'0')} — ${String(images.length).padStart(2,'0')}`;}
  function stepHero(n){heroIndex=(heroIndex+n+images.length)%images.length;renderHero();}
  $('#heroPrev').addEventListener('click',()=>stepHero(-1));$('#heroNext').addEventListener('click',()=>stepHero(1));
  let timer=setInterval(()=>{if(!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches)stepHero(1);},5200);
  $('#heroGallery').addEventListener('pointerenter',()=>clearInterval(timer));$('#heroGallery').addEventListener('pointerleave',()=>{clearInterval(timer);timer=setInterval(()=>stepHero(1),5200);});renderHero();
  $('#filters').addEventListener('click',e=>{const b=e.target.closest('button[data-filter]');if(!b)return;$('#filters .active').classList.remove('active');b.classList.add('active');grid.querySelectorAll('.gallery-item').forEach(card=>{card.hidden=b.dataset.filter!=='all'&&card.dataset.filter!==b.dataset.filter;});});
  const dialog=$('#lightbox'),lbImage=$('#lbImage'),lbCaption=$('#lbCaption');let current=0,previousFocus=null;
  function openLightbox(i){current=i;previousFocus=document.activeElement;renderLightbox();dialog.showModal();document.body.style.overflow='hidden';$('.lb-close').focus();}
  function renderLightbox(){const item=images[current];lbImage.src=item.src;lbImage.alt=item.alt;lbCaption.textContent=`${item.title} · ${current+1} / ${images.length}`;}
  function closeLightbox(){dialog.close();document.body.style.overflow='';if(previousFocus)previousFocus.focus();}
  function stepLightbox(n){current=(current+n+images.length)%images.length;renderLightbox();}
  $('.lb-close').addEventListener('click',closeLightbox);$('.lb-prev').addEventListener('click',()=>stepLightbox(-1));$('.lb-next').addEventListener('click',()=>stepLightbox(1));dialog.addEventListener('click',e=>{if(e.target===dialog)closeLightbox();});
  document.addEventListener('keydown',e=>{if(!dialog.open)return;if(e.key==='ArrowLeft')stepLightbox(1);if(e.key==='ArrowRight')stepLightbox(-1);if(e.key==='Escape')closeLightbox();});
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible','in');observer.unobserve(entry.target);}}),{threshold:.25});document.querySelectorAll('.chapter,.reveal').forEach(el=>observer.observe(el));
  // Touch swipe support inside the lightbox.
  let touchX=0;dialog.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX;},{passive:true});dialog.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>55)stepLightbox(dx>0?1:-1);},{passive:true});
})();
