import {CREATURES,SPECIES} from './growth.mjs?art=17';
import {creatureArt} from './growth-view.mjs?art=17';
const gallery=document.querySelector('#gallery');
const ids=['egg','baby','sprout','wisp','forestling','waterling','shadowling','skyling','fireling','cloudling',...SPECIES.map(([id])=>id)];
gallery.innerHTML=ids.map(id=>`<article class="pet-card">${creatureArt(id,4)}<h2>${CREATURES[id].name}</h2><span role="status">きょうも、よろしく！</span><button data-pet="${id}">よろこぶ</button></article>`).join('');
gallery.addEventListener('click',e=>{const button=e.target.closest('button');if(!button||button.disabled)return;const card=button.closest('article');button.disabled=true;card.classList.add('celebrate');card.querySelector('[role="status"]').textContent='ありがとう！ うれしいな。';setTimeout(()=>{card.classList.remove('celebrate');button.disabled=false},1500)});
