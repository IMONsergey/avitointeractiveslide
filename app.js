(() => {
  'use strict';

  // Тексты клиента. Порядок колонок и уровней задаётся только здесь.
  const categories = [
    { id: 'money', title: 'Деньги любят счёт', lines: 'Деньги любят<br> счёт', questions: [
      'Выручка есть, прибыли нет — какие расходы забыли учесть?',
      'Скидка дала продажи, но съела прибыль — когда можно снижать цену, а когда держать маржу?',
      'Продаж стало больше, но выросли ошибки — что подготовить перед ростом продаж?'
    ] },
    { id: 'budget', title: 'Куда ушёл бюджет', lines: 'Куда ушёл<br> бюджет', questions: [
      'Показы есть, переходов мало — что в объявлении не цепляет покупателя?',
      'Клики есть, заявок мало — что в объявлении может останавливать клиента от покупки?',
      'Бюджет потрачен, продаж нет — что исправить, чтобы продвижение работало эффективно?'
    ] },
    { id: 'deal', title: 'Сделка не доехала', lines: 'Сделка<br> не доехала', questions: [
      'Клиент написал и пропал — что чаще всего мешает довести диалог до сделки?',
      'Покупатель сомневается — что помогает быстрее снять недоверие?',
      'Почти купил, но передумал — где чаще всего срывается сделка?'
    ] }
  ];
  const levels = [
    { name: 'Разминка', bars: 1 },
    { name: 'Посложнее', bars: 2 },
    { name: 'Вызов', bars: 3 }
  ];
  const questions = categories.flatMap((category, col) => category.questions.map((text, row) => ({
    id: `${category.id}-${row + 1}`, category, level: levels[row], text,
    key: String(row * 3 + col + 1),
    number: String(row * 3 + col + 1).padStart(2, '0')
  })));
  const byId = new Map(questions.map(question => [question.id, question]));
  const byKey = new Map(questions.map(question => [question.key, question]));
  const storageKey = 'avito-business-questions:v1';
  const main = document.querySelector('#main-content');
  const resetButton = document.querySelector('#reset-button');
  const resetDialog = document.querySelector('#reset-dialog');
  const fullscreenButton = document.querySelector('#fullscreen-button');
  const announcement = document.querySelector('#announcement');
  const check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>';
  let completed = readProgress();
  let lastQuestion = null;
  let activeQuestion = null;
  let toastTimeout;

  function readProgress() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return new Set(Array.isArray(value) ? value.filter(id => byId.has(id)) : []);
    } catch { return new Set(); }
  }

  function saveProgress() {
    try { localStorage.setItem(storageKey, JSON.stringify([...completed])); }
    catch { notify('Отметки сохранятся только до закрытия страницы.'); }
  }

  function notify(message) {
    announcement.textContent = message;
    let toast = document.querySelector('.toast');
    if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.append(toast); }
    toast.textContent = message;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.remove(), 3500);
  }

  function card(question) {
    const answered = completed.has(question.id);
    return `<button class="question-card${answered ? ' is-complete' : ''}" data-question="${question.id}" data-level="${question.level.bars}" aria-keyshortcuts="${question.key}" aria-label="Вопрос ${question.key}. ${question.category.title}. ${question.level.name}. ${answered ? 'Уже открывали.' : 'Нажмите ' + question.key + ' на клавиатуре, чтобы открыть.'}">
      <span class="difficulty">${question.level.name}</span>
      <span class="card-footer" aria-hidden="true"><span class="card-number">${question.key}</span></span>
    </button>`;
  }

  function board() {
    const allDone = completed.size === questions.length;
    main.innerHTML = `<section class="board stage" aria-labelledby="board-title">
      <div class="board-heading">
        <div class="board-title-group"><h1 id="board-title" tabindex="-1">${allDone ? 'Всё обсудили!' : 'Выберите вопрос'}</h1><p class="board-shortcut">Нажмите цифру 1–9 на клавиатуре</p></div>
        <div class="progress" role="status" aria-label="Обсудили ${completed.size} из 9 вопросов">
          <span class="progress-label">Обсудили</span><div class="progress-numbers"><strong>${String(completed.size).padStart(2, '0')}</strong><span>/ 09</span></div>
        </div>
      </div>
      <div class="question-grid">${categories.map(category => `<section class="category" aria-labelledby="category-${category.id}"><div class="category-heading"><h2 id="category-${category.id}">${category.lines}</h2></div>${questions.filter(q => q.category.id === category.id).map(card).join('')}</section>`).join('')}</div>
    </section>`;
    document.title = 'Авито · Предпринимательский блиц';
  }

  function questionTypography(text) {
    return text
      // Keep short statements and prepositions together when a line wraps.
      .replace(/(\S+) (есть|нет|мало)(?=[,?\s]|$)/gu, '$1\u00a0$2')
      .replace(/(^|\s)(в|к|с|у|о|а|и|не|но|на|по|за|от|до|из|со|во) (?=\S)/giu, '$1$2\u00a0');
  }

  function questionScreen(question) {
    const parts = question.text.split(' — ');
    main.innerHTML = `<section class="question-view stage" aria-labelledby="question-title">
      <div class="question-panel" data-level="${question.level.bars}">
        <h1 id="question-title" tabindex="-1"><span class="question-lead">${questionTypography(parts[0])}<span class="question-prompt">&nbsp;—</span></span> <span class="question-prompt">${questionTypography(parts[1])}</span></h1>
      </div>
    </section>`;
    document.title = `${question.category.title} · Авито`;
  }

  function render(focus = false) {
    const id = location.hash.startsWith('#question/') ? location.hash.slice(10) : null;
    activeQuestion = byId.get(id) || null;
    if (activeQuestion) { markAnswered(activeQuestion); questionScreen(activeQuestion); } else board();
    document.body.classList.toggle('showing-question', Boolean(activeQuestion));
    resetButton.disabled = completed.size === 0;
    if (focus) {
      const target = activeQuestion ? document.querySelector('#question-title') : main.querySelector(`[data-question="${lastQuestion}"]`) || document.querySelector('#board-title');
      target?.focus({ preventScroll: true });
    }
  }

  function markAnswered(question) {
    if (!question || completed.has(question.id)) return;
    completed.add(question.id);
    saveProgress();
    announcement.textContent = `Вопрос ${question.number} открыт. Всего ${completed.size} из 9.`;
  }

  function openQuestion(question) {
    if (!question) return;
    lastQuestion = question.id;
    markAnswered(question);
    const nextHash = `#question/${question.id}`;
    if (location.hash === nextHash) render(true);
    else location.hash = nextHash;
  }

  function returnToBoard() {
    if (!activeQuestion) return;
    lastQuestion = activeQuestion.id;
    history.replaceState(null, '', location.pathname + location.search);
    render(true);
  }

  main.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.question) openQuestion(byId.get(button.dataset.question));
  });

  resetButton.addEventListener('click', () => { resetDialog.returnValue = ''; resetDialog.showModal(); });
  resetDialog.addEventListener('click', event => {
    if (event.target !== resetDialog) return;
    const rect = resetDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) resetDialog.close('cancel');
  });
  resetDialog.addEventListener('close', () => {
    if (resetDialog.returnValue !== 'reset') return;
    completed.clear();
    saveProgress();
    history.replaceState(null, '', location.pathname + location.search);
    lastQuestion = null;
    render(true);
    announcement.textContent = 'Новый раунд. Все девять вопросов доступны.';
  });

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { notify('Не удалось открыть полный экран. Используйте полноэкранный режим браузера.'); }
  }
  if (!document.fullscreenEnabled) fullscreenButton.hidden = true;
  fullscreenButton.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', () => {
    const label = document.fullscreenElement ? 'Свернуть экран' : 'На весь экран';
    fullscreenButton.setAttribute('aria-label', label);
    fullscreenButton.title = `${label} (F)`;
    fullscreenButton.querySelector('span').textContent = label;
  });
  document.addEventListener('keydown', event => {
    if (resetDialog.open || event.altKey || event.ctrlKey || event.metaKey || event.repeat || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    if (event.key === 'Escape' && activeQuestion) { event.preventDefault(); returnToBoard(); return; }
    if (event.code === 'KeyF' && document.fullscreenEnabled) { event.preventDefault(); toggleFullscreen(); return; }
    if (!activeQuestion) {
      const match = event.code.match(/^(?:Digit|Numpad)([1-9])$/);
      if (match) { event.preventDefault(); openQuestion(byKey.get(match[1])); }
    }
  });
  window.addEventListener('hashchange', () => render(true));
  window.addEventListener('storage', event => { if (event.key === storageKey || event.key === null) { completed = readProgress(); render(); } });
  render();
})();
