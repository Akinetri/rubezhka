// Состояние расширения
let state = {
  isHidden: false,
  selectedCards: new Set(),
  potentiallyCorrect: new Set(),
  potentiallyIncorrect: new Set(),
  testId: null,
  isTestActive: false
};

// Получаем ID теста из URL
function getTestId() {
  const match = window.location.pathname.match(/\/iq\/(\d+)/);
  return match ? match[1] : null;
}

// Генерируем уникальный ID для карточки (хеш от текста + позиция)
function generateCardId(text, position) {
  const str = text + '|' + position;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'card_' + Math.abs(hash).toString(36);
}

// Получаем все карточки на странице
function getAllCards() {
  const cards = [];
  const cardElements = document.querySelectorAll('.MuiCardActionArea-root');
  
  cardElements.forEach((card, index) => {
    const textElement = card.querySelector('p');
    if (textElement) {
      const text = textElement.textContent.trim();
      const cardId = generateCardId(text, index);
      cards.push({
        element: card,
        id: cardId,
        text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        fullText: text,
        position: index
      });
    }
  });
  
  return cards;
}

// Проверяем, выбрана ли карточка
function isCardSelected(cardElement) {
  const parent = cardElement.closest('.MuiBox-root');
  if (!parent) return false;
  
  // Проверяем наличие зеленого фона или других индикаторов выбора
  const computedStyle = window.getComputedStyle(parent);
  const bgColor = computedStyle.backgroundColor;
  
  // Зеленоватый оттенок означает выбор
  const rgb = bgColor.match(/\d+/g);
  if (rgb && rgb.length >= 3) {
    const [r, g, b] = rgb.map(Number);
    return g > r && g > b; // Зеленый компонент доминирует
  }
  
  return false;
}

// Добавляем визуальные индикаторы к карточкам
async function updateCardVisuals() {
  const cards = getAllCards();
  const storedData = await chrome.storage.local.get('testAnswers');
  const testAnswers = storedData.testAnswers || {};
  
  cards.forEach(card => {
    const answer = testAnswers[card.id];
    const parent = card.element.closest('.MuiBox-root');
    
    if (!parent) return;
    
    // Удаляем старые индикаторы
    parent.classList.remove('test-tracker-correct', 'test-tracker-incorrect', 'test-tracker-hidden');
    
    // Добавляем новые индикаторы
    if (answer) {
      if (answer.status === 'correct') {
        parent.classList.add('test-tracker-correct');
      } else if (answer.status === 'incorrect') {
        parent.classList.add('test-tracker-incorrect');
      }
      
      if (state.isHidden) {
        parent.classList.add('test-tracker-hidden');
      }
    }
  });
}

// Отслеживаем клики по карточкам
function trackCardClicks() {
  const cards = getAllCards();
  
  cards.forEach(card => {
    card.element.addEventListener('click', () => {
      setTimeout(() => {
        const selected = isCardSelected(card.element);
        if (selected) {
          state.selectedCards.add(card.id);
        } else {
          state.selectedCards.delete(card.id);
        }
      }, 100);
    });
  });
}

// Обрабатываем завершение теста
async function handleTestCompletion(isSuccess) {
  if (!isSuccess) {
    // Сдался - очищаем потенциальные данные
    state.potentiallyCorrect.clear();
    state.potentiallyIncorrect.clear();
    state.selectedCards.clear();
    showNotification('Данные не сохранены (тест не завершен)');
    return;
  }
  
  // Успешное завершение - сохраняем данные
  const cards = getAllCards();
  const updates = {};
  
  cards.forEach(card => {
    if (state.selectedCards.has(card.id)) {
      updates[card.id] = {
        text: card.text,
        status: 'correct',
        testId: state.testId,
        lastUpdated: Date.now()
      };
    } else {
      updates[card.id] = {
        text: card.text,
        status: 'incorrect',
        testId: state.testId,
        lastUpdated: Date.now()
      };
    }
  });
  
  // Получаем существующие данные и объединяем
  const storedData = await chrome.storage.local.get('testAnswers');
  const testAnswers = storedData.testAnswers || {};
  
  Object.assign(testAnswers, updates);
  
  await chrome.storage.local.set({ testAnswers });
  
  showNotification(`Сохранено: ${Object.keys(updates).length} карточек`);
  
  // Очищаем состояние
  state.selectedCards.clear();
  state.potentiallyCorrect.clear();
  state.potentiallyIncorrect.clear();
  
  // Обновляем визуальные индикаторы
  await updateCardVisuals();
}

// Отслеживаем кнопки завершения теста
function trackTestCompletion() {
  // Ищем кнопку "Проверить ответ" или аналогичные
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          // Проверяем на наличие сообщения об успехе
          const successMessage = node.textContent?.includes('Поздравляем') || 
                                node.textContent?.includes('Правильно') ||
                                node.textContent?.includes('Тест пройден');
          
          if (successMessage) {
            handleTestCompletion(true);
          }
          
          // Проверяем кнопку "Сдаться"
          if (node.textContent?.includes('Сдаться') && node.tagName === 'BUTTON') {
            node.addEventListener('click', () => {
              handleTestCompletion(false);
            });
          }
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Показываем уведомление
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'test-tracker-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Обработчик клавиши H
document.addEventListener('keydown', (e) => {
  if (e.key === 'h' || e.key === 'H' || e.key === 'р' || e.key === 'Р') {
    state.isHidden = !state.isHidden;
    updateCardVisuals();
    showNotification(state.isHidden ? 'Индикаторы скрыты' : 'Индикаторы показаны');
  }
});

// Инициализация
function init() {
  state.testId = getTestId();
  state.isTestActive = true;
  
  // Небольшая задержка для загрузки контента
  setTimeout(() => {
    trackCardClicks();
    trackTestCompletion();
    updateCardVisuals();
  }, 1000);
}

// Запускаем при загрузке страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Обновляем визуалы при изменении DOM
const pageObserver = new MutationObserver(() => {
  updateCardVisuals();
});

pageObserver.observe(document.body, {
  childList: true,
  subtree: true
});