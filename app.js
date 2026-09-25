(() => {
  'use strict';

  // Тексты клиента. Порядок колонок и уровней задаётся только здесь.
  const categories = [
    { id: 'money', title: 'Деньги любят счет', lines: 'Деньги<br> любят счет', questions: [
      'Выручка есть, прибыли нет — какие расходы забыли учесть?',
      'Скидка дала продажи, но съела прибыль — когда можно снижать цену, а когда держать маржу?',
      'Продаж стало больше, но выросли ошибки — что подготовить перед ростом продаж?'
    ] },
    { id: 'budget', title: 'Куда ушел бюджет', lines: 'Куда ушел<br> бюджет', questions: [
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
    teaser: text.split(' — ')[0], number: String(row * 3 + col + 1).padStart(2, '0')
  })));
  const byId = new Map(questions.map(question => [question.id, question]));
  const storageKey = 'avito-business-questions:v1';
  const main = document.querySelector('#main-content');
  const resetButton = document.querySelector('#reset-button');
  const resetDialog = document.querySelector('#reset-dialog');
  const fullscreenButton = document.querySelector('#fullscreen-button');
  const announcement = document.querySelector('#announcement');
  const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
  const check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>';
  const backArrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 5-7 7 7 7M3 12h18"/></svg>';
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

  function bars(level) {
    return `<span class="level-bars" aria-hidden="true">${[1, 2, 3].map(n => `<i class="${n <= level.bars ? 'on' : ''}"></i>`).join('')}</span>`;
  }

  function card(question) {
    const answered = completed.has(question.id);
    return `<button class="question-card${answered ? ' is-complete' : ''}" data-question="${question.id}" data-level="${question.level.bars}" aria-label="${question.category.title}. ${question.level.name}. Вопрос ${question.number}. ${answered ? 'Обсудили. Открыть снова.' : question.teaser}">
      <span class="card-top"><span class="difficulty">${bars(question.level)}${question.level.name}</span>${answered ? '<span class="card-status">Обсудили</span>' : ''}</span>
      <span class="card-bottom"><span class="card-number" aria-hidden="true">${question.number}</span><span class="card-teaser">${question.teaser}</span><span class="card-action">${answered ? check : arrow}</span></span>
    </button>`;
  }

  function board() {
    const allDone = completed.size === questions.length;
    main.innerHTML = `<section class="board stage" aria-labelledby="board-title">
      <div class="board-heading">
        <h1 id="board-title" tabindex="-1">${allDone ? 'Всё обсудили!' : 'Выберите вопрос'}</h1>
        <div class="progress" role="status" aria-label="Обсудили ${completed.size} из 9 вопросов">
          <span class="progress-label">Обсудили</span><div class="progress-numbers"><strong>${String(completed.size).padStart(2, '0')}</strong><span>/ 09</span></div>
          <div class="progress-track" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<i class="${i < completed.size ? 'filled' : ''}"></i>`).join('')}</div>
        </div>
      </div>
      <div class="question-grid">${categories.map(category => `<section class="category" aria-labelledby="category-${category.id}"><div class="category-heading"><h2 id="category-${category.id}">${category.lines}</h2></div>${questions.filter(q => q.category.id === category.id).map(card).join('')}</section>`).join('')}</div>
    </section>`;
    document.title = 'Авито · Вопросы для бизнеса';
  }

  function questionScreen(question) {
    const answered = completed.has(question.id);
    const parts = question.text.split(' — ');
    main.innerHTML = `<section class="question-view stage" aria-labelledby="question-title">
      <div class="question-nav"><button class="back-button" data-action="back">${backArrow}<span>К вопросам</span></button><span class="question-category">${question.category.title}</span><span class="question-counter">Вопрос ${question.number} <span>/ 09</span></span></div>
      <div class="question-panel" data-level="${question.level.bars}">
        <div class="question-panel-top"><span class="question-level">${bars(question.level)}${question.level.name}</span>${answered ? '<span class="discussion-label">' + check + 'Обсудили</span>' : ''}</div>
        <h1 id="question-title" tabindex="-1"><span>${parts[0]}</span><span class="question-prompt"> — ${parts[1]}</span></h1>
        <span class="oversized-number" aria-hidden="true">${question.number}</span>
      </div>
      <div class="question-actions">${answered ? '<button class="skip-button" data-action="undo">Снять отметку ответа</button>' : ''}<button class="button answer-button" data-action="answer">${check}<span>${answered ? 'К вопросам' : 'Ответили · к вопросам'}</span></button></div>
    </section>`;
    document.title = `${question.category.title} · Авито`;
  }

  function render(focus = false) {
    const id = location.hash.startsWith('#question/') ? location.hash.slice(10) : null;
    activeQuestion = byId.get(id) || null;
    if (activeQuestion) questionScreen(activeQuestion); else board();
    document.body.classList.toggle('showing-question', Boolean(activeQuestion));
    resetButton.disabled = completed.size === 0;
    if (focus) {
      const target = activeQuestion ? document.querySelector('#question-title') : main.querySelector(`[data-question="${lastQuestion}"]`) || document.querySelector('#board-title');
      target?.focus({ preventScroll: true });
    }
  }

  function returnToBoard(markAnswered) {
    if (!activeQuestion) return;
    lastQuestion = activeQuestion.id;
    if (markAnswered) {
      completed.add(activeQuestion.id);
      saveProgress();
      announcement.textContent = `Вопрос ${activeQuestion.number} обсудили. Всего ${completed.size} из 9.`;
    }
    history.replaceState(null, '', location.pathname + location.search);
    render(true);
  }

  main.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.question) {
      lastQuestion = button.dataset.question;
      location.hash = `question/${lastQuestion}`;
      return;
    }
    if (button.dataset.action === 'answer') returnToBoard(true);
    if (button.dataset.action === 'back') returnToBoard(false);
    if (button.dataset.action === 'undo' && activeQuestion) {
      completed.delete(activeQuestion.id);
      saveProgress();
      returnToBoard(false);
      announcement.textContent = 'Отметка ответа снята.';
    }
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
    if (event.key === 'Escape' && activeQuestion) { event.preventDefault(); returnToBoard(false); }
    if (event.code === 'KeyF' && document.fullscreenEnabled) { event.preventDefault(); toggleFullscreen(); }
  });
  window.addEventListener('hashchange', () => render(true));
  window.addEventListener('storage', event => { if (event.key === storageKey || event.key === null) { completed = readProgress(); render(); } });
  render();
})();
