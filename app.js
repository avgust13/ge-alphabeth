const geWordEl = document.getElementById('georgianWord');
const inputsRowEl = document.getElementById('inputsRow');
const meaningEl = document.getElementById('meaning');
const similarityEl = document.getElementById('similarity');
const progressEl = document.getElementById('progress');

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const hintBtn = document.getElementById('hintBtn');

let words = [];
let current = 0;

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
  input.placeholder = '·';
  input.dataset.expected = expected;
  input.dataset.index = idx;

  input.addEventListener('input', () => {
    input.value = input.value.toLowerCase().replace(/[^a-z]/g, '');
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
    setTimeout(() => {
      current = (current + 1) % words.length;
      renderWord();
    }, 450);
  }
}

function renderWord() {
  const word = words[current];
  geWordEl.textContent = word.georgian;
  meaningEl.textContent = word.meaning;
  similarityEl.textContent = word.similarity;
  progressEl.textContent = `Слово ${current + 1} / ${words.length}`;

  inputsRowEl.innerHTML = '';
  const latinLetters = [...word.latin];
  const geLetters = [...word.georgian];
  latinLetters.forEach((letter, idx) => {
    inputsRowEl.appendChild(createLetterInput(letter, geLetters[idx], idx));
  });

  getInputByIndex(0)?.focus();
}

function revealHint() {
  const inputs = [...inputsRowEl.querySelectorAll('input')];
  const target = inputs.find((el) => el.value !== el.dataset.expected);
  if (!target) return;
  target.value = target.dataset.expected;
  checkInput(target);
  if (getInputByIndex(Number(target.dataset.index) + 1)) {
    getInputByIndex(Number(target.dataset.index) + 1).focus();
  }
  checkWordCompleted();
}

prevBtn.addEventListener('click', () => {
  current = (current - 1 + words.length) % words.length;
  renderWord();
});

nextBtn.addEventListener('click', () => {
  current = (current + 1) % words.length;
  renderWord();
});

hintBtn.addEventListener('click', revealHint);

let touchStartX = 0;
inputsRowEl.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
});
inputsRowEl.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].screenX - touchStartX;
  if (Math.abs(dx) < 40) return;
  current = dx < 0 ? (current + 1) % words.length : (current - 1 + words.length) % words.length;
  renderWord();
});

(async function init() {
  const response = await fetch('./words.json');
  words = await response.json();
  renderWord();
})();
