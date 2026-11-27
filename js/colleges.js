// بيانات تجريبية فقط - لا يوجد اتصال بقاعدة البيانات في هذه النسخة.
const colleges=[
{name:'كلية علوم الحاسوب',points:150,trees:12,students:9},
{name:'كلية الهندسة',points:120,trees:10,students:8},
{name:'كلية الزراعة',points:90,trees:9,students:7},
{name:'كلية العلوم',points:60,trees:6,students:8}];
const students=[['سارة أحمد','علوم الحاسوب',12,'👑'],['محمد علي','الهندسة',10,'🌱'],['آية عمر','الزراعة',10,'🌱']];
const fmt=n=>Number(n).toLocaleString('en-US');
const sorted=[...colleges].sort((a,b)=>b.points-a.points);
document.getElementById('colleges').textContent=fmt(colleges.length);
document.getElementById('students').textContent=fmt(colleges.reduce((a,c)=>a+c.students,0));
document.getElementById('trees').textContent=fmt(colleges.reduce((a,c)=>a+c.trees,0));
const podium=document.getElementById('podium');
[sorted[1],sorted[0],sorted[2]].forEach((c,i)=>{const rank=i===0?2:i===1?1:3;const el=document.createElement('article');el.className=`podium-place place-${rank}`;if(rank===1)el.classList.add('first');el.innerHTML=`<div class="podium-medal">${rank===1?'🏆':rank===2?'🥈':'🥉'}</div><small class="place-label">المركز ${rank===1?'الأول':rank===2?'الثاني':'الثالث'}</small><h3>${c.name}</h3><p>${c.trees} أشجار · ${c.students} طلاب</p><strong>${fmt(c.points)} <small>نقطة</small></strong><div class="podium-step">${rank}</div>`;podium.appendChild(el)});
const ranking=document.getElementById('ranking'),max=sorted[0].points;
sorted.forEach((c,i)=>{const el=document.createElement('div');el.className='rank';el.innerHTML=`<span class="rankno">${i+1}</span><div><b>${c.name}</b><small>${fmt(c.points)} نقطة · ${c.trees} أشجار · ${c.students} طلاب · ${i===0?'في الصدارة':`الفارق عن الأولى ${max-c.points} نقطة`}</small><div class="bar"><i style="width:${c.points/max*100}%"></i></div></div><span class="score">${fmt(c.points)}<small>نقطة</small></span>`;ranking.appendChild(el)});
const list=document.getElementById('student-list');students.forEach(s=>{const el=document.createElement('div');el.innerHTML=`${s[3]} ${s[0]}<small>${s[1]} · ${s[2]} شتلات موثقة</small>`;list.appendChild(el)});
