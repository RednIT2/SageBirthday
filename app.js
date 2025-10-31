const beginBtn = document.getElementById('begin-btn');
const heroSection = document.getElementById('hero');
const stage = document.getElementById('main-stage');
const hpFill = document.getElementById('hp-fill');
const hpValue = document.getElementById('hp-value');
const messagesEl = document.getElementById('messages');
const messageTemplate = document.getElementById('message-template');
const barrierField = document.getElementById('barrier-field');
const slowField = document.getElementById('slow-field');
const skillBarrier = document.getElementById('skill-barrier');
const skillSlow = document.getElementById('skill-slow');
const skillHeal = document.getElementById('skill-heal');
const skillRevive = document.getElementById('skill-revive');
const healingRing = document.getElementById('healing-ring');
const reviveModal = document.getElementById('revive-modal');
const closeReviveBtn = document.getElementById('close-revive');
const codeForm = document.getElementById('code-form');
const protocolCodeInput = document.getElementById('protocol-code');
const secretLetter = document.getElementById('secret-letter');
const birthdayName = document.getElementById('birthday-name');
const audioToggle = document.getElementById('audio-toggle');
const motionToggle = document.getElementById('motion-toggle');
const cake = document.getElementById('cake');
const orbs = document.getElementById('orbs');
const minigameResult = document.getElementById('minigame-result');

const state = {
  hp: 0,
  maxHp: 100,
  unlockedMessages: new Set(),
  mainMessageUnlocked: false,
  resurrectionUsed: false,
  audioEnabled: true,
  reduceMotion: false,
  secretCode: 'SAGE',
  healCharging: false,
  dragData: {
    activeOrb: null,
    healedSlots: new Set(),
  },
};

let heroAtropos = null;
let stageAtropos = null;
let skillsAtropos = null;

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Atropos !== 'function') return;
  heroAtropos = Atropos({
    el: '.atropos-hero',
    activeOffset: 28,
    shadow: true,
    highlight: true,
    clickable: true,
  });
});

function initStageAtropos() {
  if (stageAtropos || typeof Atropos !== 'function') return;
  stageAtropos = Atropos({
    el: '.atropos-stage',
    activeOffset: 22,
    shadow: true,
    highlight: true,
    clickable: true,
  });
}

const smallMessages = [
  'Hôm nay phải cười 200% nhé!',
  'Buff may mắn suốt năm!',
  'Mọi trận đều top-frag cảm xúc tốt đẹp!',
  'Luôn giữ bình tĩnh như Sage nhé!',
  'Chúc toàn bộ goal đều full HP!'
];

beginBtn?.addEventListener('click', () => {
  heroSection.classList.add('hero--exit');
  setTimeout(() => {
    heroSection.hidden = true;
    stage.hidden = false;
    if (heroAtropos?.destroy) {
      heroAtropos.destroy();
      heroAtropos = null;
    }
    initStageAtropos();
    if (stageAtropos?.refresh) {
      stageAtropos.refresh();
    }
    stage.focus?.();
  }, 650);
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateHP(amount) {
  state.hp = clamp(state.hp + amount, 0, state.maxHp);
  const percent = Math.round((state.hp / state.maxHp) * 100);
  hpFill.style.width = `${percent}%`;
  hpFill.parentElement?.setAttribute('aria-valuenow', String(percent));
  hpValue.textContent = `${percent}%`;
}

function addMessage(text) {
  if (state.unlockedMessages.has(text)) return;
  state.unlockedMessages.add(text);
  const messageNode = messageTemplate.content.firstElementChild.cloneNode(true);
  messageNode.querySelector('.message-card__text').textContent = text;
  messagesEl.appendChild(messageNode);
  playTone('orb');
}

function spawnConfetti(container, amount = 18) {
  const colors = ['#7ad6c7', '#4ab6a9', '#ff4655', '#f3f5f7'];
  for (let i = 0; i < amount; i += 1) {
    const confetti = document.createElement('span');
    confetti.className = 'confetti';
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 45 + 35;
    confetti.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
    confetti.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
    confetti.style.background = colors[i % colors.length];
    confetti.style.left = `${50 + Math.random() * 40 - 20}%`;
    confetti.style.top = `${50 + Math.random() * 30 - 15}%`;
    container.appendChild(confetti);
    setTimeout(() => confetti.remove(), 1500);
  }
}

function createFirework(container) {
  const firework = document.createElement('span');
  firework.className = 'firework';
  firework.style.left = `${20 + Math.random() * 60}%`;
  firework.style.top = `${20 + Math.random() * 50}%`;
  container.appendChild(firework);
  setTimeout(() => firework.remove(), 1200);
}

let audioContext;

function ensureAudioContext() {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioContext = new AudioContext();
    }
  }
  if (audioContext?.state === 'suspended') {
    audioContext.resume();
  }
}

function playTone(type) {
  if (!state.audioEnabled) return;
  ensureAudioContext();
  if (!audioContext) return;

  const ctx = audioContext;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type === 'revive' ? 'triangle' : 'sine';
  oscillator.frequency.value = type === 'revive' ? 660 : 420;

  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(type === 'revive' ? 0.12 : 0.06, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (type === 'revive' ? 1.2 : 0.35));

  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + (type === 'revive' ? 1.2 : 0.35));

  if (type === 'revive') {
    const second = ctx.createOscillator();
    const secondGain = ctx.createGain();
    second.type = 'sine';
    second.frequency.value = 880;
    secondGain.gain.setValueAtTime(0.001, now + 0.05);
    secondGain.gain.linearRampToValueAtTime(0.06, now + 0.2);
    secondGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    second.connect(secondGain).connect(ctx.destination);
    second.start(now + 0.05);
    second.stop(now + 1.4);
  }
}

skillBarrier?.addEventListener('click', () => {
  const barrier = document.createElement('div');
  barrier.className = 'barrier';
  const offsetX = Math.random() * 60 + 10;
  const offsetY = Math.random() * 40 + 10;
  barrier.style.left = `${offsetX}%`;
  barrier.style.top = `${offsetY}%`;
  barrierField.appendChild(barrier);
  setTimeout(() => barrier.remove(), 1600);
  spawnConfetti(barrierField, 20);
  const message = smallMessages[state.unlockedMessages.size % smallMessages.length];
  addMessage(message);
  updateHP(12);
});

skillSlow?.addEventListener('click', () => {
  const slowOrb = document.createElement('div');
  slowOrb.className = 'slow-orb';
  slowOrb.style.left = `${Math.random() * 70 + 10}%`;
  slowField.appendChild(slowOrb);
  slowOrb.addEventListener('animationend', () => {
    spawnConfetti(slowField, 30);
    createFirework(slowField);
    slowOrb.remove();
    addMessage('Nhịp sống chậm lại để tận hưởng từng khoảnh khắc.');
    updateHP(10);
  }, { once: true });
});

let healStart = 0;
let healFrameId;

function resetHealing() {
  state.healCharging = false;
  healingRing.classList.remove('is-charging');
  healingRing.style.setProperty('--progress', 0);
  if (healFrameId) {
    cancelAnimationFrame(healFrameId);
    healFrameId = null;
  }
}

function handleHealing(now) {
  if (!state.healCharging) return;
  const elapsed = now - healStart;
  const duration = 2200;
  const progress = Math.min(elapsed / duration, 1);
  healingRing.style.setProperty('--progress', progress * 100);
  if (progress < 1) {
    healFrameId = requestAnimationFrame(handleHealing);
  } else if (!state.mainMessageUnlocked) {
    state.mainMessageUnlocked = true;
    resetHealing();
    updateHP(state.maxHp);
    addMessage('Sinh nhật vui vẻ! Chúc bạn luôn bình tĩnh như Sage, dịu dàng mà mạnh mẽ. Mong mọi mục tiêu đều full HP, mọi ước mơ đều được revive 💚');
  } else {
    resetHealing();
  }
}

function startHealing() {
  if (state.healCharging) return;
  state.healCharging = true;
  healStart = performance.now();
  healingRing.classList.add('is-charging');
  healFrameId = requestAnimationFrame(handleHealing);
}

skillHeal?.addEventListener('pointerdown', startHealing);
skillHeal?.addEventListener('keydown', (event) => {
  if (event.code === 'Enter' || event.code === 'Space') {
    event.preventDefault();
    startHealing();
  }
});

['pointerup', 'pointerleave', 'blur', 'keyup'].forEach((evt) => {
  skillHeal?.addEventListener(evt, () => {
    resetHealing();
  });
});

skillRevive?.addEventListener('click', () => {
  if (state.resurrectionUsed) return;
  state.resurrectionUsed = true;
  reviveModal.hidden = false;
  updateHP(18);
  spawnConfetti(barrierField, 28);
  spawnConfetti(slowField, 28);
  createFirework(slowField);
  playTone('revive');
});

closeReviveBtn?.addEventListener('click', () => {
  reviveModal.hidden = true;
});

reviveModal?.addEventListener('click', (event) => {
  if (event.target === reviveModal) {
    reviveModal.hidden = true;
  }
});

audioToggle?.addEventListener('change', () => {
  state.audioEnabled = audioToggle.checked;
});

motionToggle?.addEventListener('change', () => {
  state.reduceMotion = motionToggle.checked;
  document.body.dataset.reduceMotion = state.reduceMotion ? 'true' : 'false';
  if (state.reduceMotion) {
    destroyAtropos();
  } else {
    initAtropos();
  }
});

codeForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = protocolCodeInput.value.trim();
  if (!input) return;
  const normalized = input.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase();
  const code = state.secretCode.toUpperCase();
  if (normalized === code) {
    birthdayName.textContent = input;
    secretLetter.hidden = false;
    addMessage('ACCESS GRANTED // Đồng đội đặc biệt xuất hiện!');
    updateHP(15);
  } else {
    secretLetter.hidden = true;
    minigameResult.textContent = 'Sai mã rồi! Thử lại nhé.';
    setTimeout(() => {
      if (minigameResult.textContent === 'Sai mã rồi! Thử lại nhé.') {
        minigameResult.textContent = '';
      }
    }, 2000);
  }
  protocolCodeInput.value = '';
});

function handleDragStart(event) {
  const target = event.target.closest('.orb');
  if (!target) return;
  state.dragData.activeOrb = target;
  event.dataTransfer?.setData('text/plain', target.dataset.orb);
  event.dataTransfer?.setDragImage?.(target, 30, 30);
  setTimeout(() => target.classList.add('is-dragging'), 0);
}

function handleDragEnd(event) {
  const target = event.target.closest('.orb');
  if (!target) return;
  target.classList.remove('is-dragging');
}

function handleDragOver(event) {
  event.preventDefault();
}

function handleDrop(event) {
  event.preventDefault();
  const slot = event.currentTarget;
  const orbId = event.dataTransfer?.getData('text/plain') || state.dragData.activeOrb?.dataset.orb;
  if (!orbId || slot.dataset.slot !== orbId) {
    slot.classList.remove('healed');
    minigameResult.textContent = 'Sai vị trí rồi! Thử chỗ khác nhé.';
    return;
  }
  slot.classList.add('healed');
  if (state.dragData.activeOrb) {
    state.dragData.activeOrb.setAttribute('draggable', 'false');
    state.dragData.activeOrb.classList.remove('is-dragging');
    state.dragData.activeOrb.classList.add('orb--locked');
    slot.appendChild(state.dragData.activeOrb);
  }
  state.dragData.activeOrb = null;
  state.dragData.healedSlots.add(slot.dataset.slot);
  addMessage(`Orb ${orbId} đã chữa lành một góc bánh!`);
  updateHP(6);
  playTone('orb');
  if (state.dragData.healedSlots.size === 5) {
    minigameResult.textContent = 'Bánh đã full HP! Mở khoảnh khắc kỷ niệm ngay nào!';
    createFirework(cake);
  } else {
    minigameResult.textContent = `Còn ${5 - state.dragData.healedSlots.size} vết nứt cần heal.`;
  }
}

orbs?.addEventListener('dragstart', handleDragStart);
orbs?.addEventListener('dragend', handleDragEnd);

const cracks = cake?.querySelectorAll('.cake__crack') || [];
cracks.forEach((crack) => {
  crack.addEventListener('dragover', handleDragOver);
  crack.addEventListener('drop', handleDrop);
});

function initAtropos() {
  if (typeof Atropos !== 'function' || state.reduceMotion) return;

  const heroEl = document.querySelector('.atropos-hero');
  if (heroEl && !heroAtropos) {
    heroAtropos = Atropos({
      el: heroEl,
      activeOffset: 32,
      rotateXMax: 14,
      rotateYMax: 18,
      shadow: true,
      shadowScale: 1.04,
      shadowOffset: 24,
      highlight: false,
      clickable: true,
    });
  }

  const stageEl = document.querySelector('.atropos-stage');
  if (stageEl && !stageAtropos) {
    stageAtropos = Atropos({
      el: stageEl,
      activeOffset: 18,
      rotateXMax: 8,
      rotateYMax: 10,
      shadow: false,
      highlight: false,
      clickable: true,
    });
  }

  const skillsEl = document.querySelector('.skills-atropos');
  if (skillsEl && !skillsAtropos) {
    skillsAtropos = Atropos({
      el: skillsEl,
      activeOffset: 14,
      rotateXMax: 10,
      rotateYMax: 10,
      shadow: false,
      highlight: false,
      clickable: true,
    });
  }
}

function destroyAtropos() {
  if (heroAtropos) {
    heroAtropos.destroy();
    heroAtropos = null;
  }
  if (stageAtropos) {
    stageAtropos.destroy();
    stageAtropos = null;
  }
  if (skillsAtropos) {
    skillsAtropos.destroy();
    skillsAtropos = null;
  }
}

// Accessibility: close modal with Escape
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !reviveModal.hidden) {
    reviveModal.hidden = true;
  }
});

// Prefers reduced motion default
if (motionToggle && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  motionToggle.checked = true;
  motionToggle.dispatchEvent(new Event('change'));
}

if (!state.reduceMotion) {
  initAtropos();
}
