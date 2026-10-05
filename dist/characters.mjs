import {SPECIES} from './growth.mjs?art=9';
import {creatureArt} from './growth-view.mjs?art=9';
const gallery=document.querySelector('#gallery');
gallery.innerHTML=SPECIES.map(([id,name])=>`<article class="pet-card">${creatureArt(id,4)}<h2>${name}</h2><span role="status">きょうも、よろしく！</span><button data-pet="${id}">よろこぶ</button></article>`).join('');
gallery.addEventListener('click',e=>{const button=e.target.closest('button');if(!button||button.disabled)return;const card=button.closest('article');button.disabled=true;card.classList.add('celebrate');card.querySelector('[role="status"]').textContent='ありがとう！ うれしいな。';setTimeout(()=>{card.classList.remove('celebrate');button.disabled=false},1500)});
