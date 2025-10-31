// Popup script для управления расширением

// Элементы
const totalCardsEl = document.getElementById('totalCards');
const correctCountEl = document.getElementById('correctCount');
const incorrectCountEl = document.getElementById('incorrectCount');
const lastUpdateEl = document.getElementById('lastUpdate');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const clearBtn = document.getElementById('clearBtn');
const fileInput = document.getElementById('fileInput');

// Загружаем статистику при открытии попапа
async function loadStats() {
  const response = await chrome.runtime.sendMessage({ action: 'getStats' });
  
  totalCardsEl.textContent = response.totalCards;
  correctCountEl.textContent = response.correctCount;
  incorrectCountEl.textContent = response.incorrectCount;
  
  if (response.lastUpdated) {
    const date = new Date(response.lastUpdated);
    lastUpdateEl.textContent = `Последнее обновление: ${formatDate(date)}`;
  }
}

// Форматируем дату
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Показываем уведомление
function showNotification(message, isError = false) {
  const notification = document.createElement('div');
  notification.className = 'notification' + (isError ? ' error' : '');
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

// Экспорт данных
exportBtn.addEventListener('click', async () => {
  const response = await chrome.runtime.sendMessage({ action: 'exportData' });
  const data = response.data;
  
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `test-answers-backup-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification('Данные экспортированы!');
});

// Импорт данных
importBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    const response = await chrome.runtime.sendMessage({ 
      action: 'importData', 
      data: data 
    });
    
    if (response.success) {
      showNotification(`Импортировано ${response.count} карточек!`);
      loadStats();
    } else {
      showNotification('Ошибка импорта: ' + response.error, true);
    }
  } catch (error) {
    showNotification('Ошибка чтения файла: ' + error.message, true);
  }
  
  fileInput.value = '';
});

// Очистка данных
clearBtn.addEventListener('click', async () => {
  if (confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить!')) {
    await chrome.runtime.sendMessage({ action: 'clearData' });
    showNotification('Все данные удалены');
    loadStats();
  }
});

// Загружаем статистику при открытии
loadStats();