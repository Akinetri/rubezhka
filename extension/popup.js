// Загружаем статистику при открытии popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  
  // Обработчики кнопок
  document.getElementById('export-btn').addEventListener('click', exportData);
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', importData);
  document.getElementById('clear-btn').addEventListener('click', clearData);
  document.getElementById('refresh-btn').addEventListener('click', loadStats);
});

// Загружаем статистику
async function loadStats() {
  const data = await chrome.storage.local.get('cards');
  const cardsDB = data.cards || {};
  
  const stats = {
    total: 0,
    correct: 0,
    incorrect: 0,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0
  };
  
  Object.values(cardsDB).forEach(card => {
    stats.total++;
    if (card.status === 'correct') stats.correct++;
    if (card.status === 'incorrect') stats.incorrect++;
    
    if (card.confidence >= 80) stats.highConfidence++;
    else if (card.confidence >= 50) stats.mediumConfidence++;
    else stats.lowConfidence++;
  });
  
  // Обновляем UI
  document.getElementById('total-cards').textContent = stats.total;
  document.getElementById('correct-cards').textContent = stats.correct;
  document.getElementById('incorrect-cards').textContent = stats.incorrect;
  document.getElementById('high-confidence').textContent = stats.highConfidence;
  document.getElementById('medium-confidence').textContent = stats.mediumConfidence;
  document.getElementById('low-confidence').textContent = stats.lowConfidence;
}

// Экспорт данных
async function exportData() {
  const data = await chrome.storage.local.get('cards');
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `sw-university-backup-${Date.now()}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  showNotification('✓ Данные экспортированы', 'success');
}

// Импорт данных
async function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      await chrome.storage.local.set(data);
      await loadStats();
      showNotification('✓ Данные импортированы', 'success');
    } catch (err) {
      showNotification('✗ Ошибка импорта: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

// Очистка данных
async function clearData() {
  if (!confirm('Вы уверены? Это удалит все сохраненные данные!')) {
    return;
  }
  
  await chrome.storage.local.clear();
  await loadStats();
  showNotification('✓ Все данные удалены', 'success');
}

// Показываем уведомление
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
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