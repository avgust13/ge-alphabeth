const geWordEl = document.getElementById('georgianWord');
const inputsRowEl = document.getElementById('inputsRow');
const progressEl = document.getElementById('progress');
const translationEl = document.getElementById('translation');

const hintBtn = document.getElementById('hintBtn');
const nextBtn = document.getElementById('nextBtn');

let words = [];
let current = 0;
let order = [];
let orderIndex = 0;
let focusedInput = null;
let advanceTimer = null;

function shuffleOrder() {
  order = words.map((_, idx) => idx);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
}

function goToNextWord() {
  clearAdvanceTimer();
  orderIndex += 1;
  if (orderIndex >= order.length) {
    shuffleOrder();
    orderIndex = 0;
  }
  current = order[orderIndex];
  renderWord();
}

function goToPreviousWord() {
  clearAdvanceTimer();
  orderIndex = (orderIndex - 1 + order.length) % order.length;
  current = order[orderIndex];
  renderWord();
}

function clearAdvanceTimer() {
  if (!advanceTimer) return;
  clearTimeout(advanceTimer);
  advanceTimer = null;
}

function createLetterInput(expected, geLetter, idx) {
  const wrapper = document.createElement('div');
  wrapper.className = 'letter-cell';

  const label = document.createElement('span');
  label.className = 'letter-label';
  label.textContent = geLetter;

  const input = document.createElement('input');
  input.maxLength = 1;
  input.autocomplete = 'off';
  input.autocapitalize = 'off';
  input.spellcheck = false;
  input.inputMode = 'text';
  input.lang = 'ru';
  input.placeholder = '·';
  input.dataset.expected = expected;
  input.dataset.index = idx;

  input.addEventListener('focus', () => {
    focusedInput = input;
  });

  input.addEventListener('input', () => {
    input.value = input.value.toLowerCase().replace(/[^а-яё]/g, '');
    checkInput(input);
    if (input.value && getInputByIndex(idx + 1)) {
      getInputByIndex(idx + 1).focus();
    }
    checkWordCompleted();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !input.value && getInputByIndex(idx - 1)) {
      getInputByIndex(idx - 1).focus();
    }
  });

  wrapper.append(label, input);
  return wrapper;
}

function getInputByIndex(idx) {
  return inputsRowEl.querySelector(`input[data-index="${idx}"]`);
}

function checkInput(input) {
  const isCorrect = input.value === input.dataset.expected;
  input.classList.remove('correct', 'wrong');
  if (!input.value) return;
  input.classList.add(isCorrect ? 'correct' : 'wrong');
}

function checkWordCompleted() {
  const allInputs = [...inputsRowEl.querySelectorAll('input')];
  const done = allInputs.length && allInputs.every((el) => el.value === el.dataset.expected);
  if (done) {
    translationEl.textContent = words[current].translation;
    if (!advanceTimer) {
      advanceTimer = setTimeout(goToNextWord, 1800);
    }
  }
}

function renderWord() {
  const word = words[current];
  geWordEl.textContent = word.georgian;
  progressEl.textContent = `Слово ${orderIndex + 1} / ${words.length}`;
  translationEl.textContent = '';

  inputsRowEl.innerHTML = '';
  const russianLetters = [...word.russian];
  const geLetters = [...word.georgian];
  russianLetters.forEach((letter, idx) => {
    inputsRowEl.appendChild(createLetterInput(letter, geLetters[idx], idx));
  });

  getInputByIndex(0)?.focus();
}

function revealHint() {
  const target = inputsRowEl.contains(focusedInput) ? focusedInput : null;
  if (!target) return;
  target.value = target.dataset.expected;
  checkInput(target);
  target.focus();
  checkWordCompleted();
}

hintBtn.addEventListener('click', revealHint);

nextBtn.addEventListener('click', () => {
  goToNextWord();
});

let touchStartX = 0;
inputsRowEl.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
});
inputsRowEl.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].screenX - touchStartX;
  if (Math.abs(dx) < 40) return;
  if (dx < 0) {
    goToNextWord();
  } else {
    goToPreviousWord();
  }
});

(async function init() {
  const response = await fetch('./words.json');
  words = await response.json();
  shuffleOrder();
  current = order[orderIndex];
  renderWord();
})();
