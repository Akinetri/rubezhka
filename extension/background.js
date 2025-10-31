// Background service worker для управления данными

// Слушаем сообщения от content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStats') {
    getStatistics().then(sendResponse);
    return true; // Асинхронный ответ
  }
  
  if (request.action === 'clearData') {
    chrome.storage.local.clear(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'exportData') {
    chrome.storage.local.get('testAnswers', (data) => {
      sendResponse({ data: data.testAnswers || {} });
    });
    return true;
  }
  
  if (request.action === 'importData') {
    importData(request.data).then(sendResponse);
    return true;
  }
});

// Получаем статистику
async function getStatistics() {
  const data = await chrome.storage.local.get('testAnswers');
  const testAnswers = data.testAnswers || {};
  
  let correctCount = 0;
  let incorrectCount = 0;
  let lastUpdated = 0;
  
  Object.values(testAnswers).forEach(answer => {
    if (answer.status === 'correct') correctCount++;
    if (answer.status === 'incorrect') incorrectCount++;
    if (answer.lastUpdated > lastUpdated) lastUpdated = answer.lastUpdated;
  });
  
  return {
    totalCards: Object.keys(testAnswers).length,
    correctCount,
    incorrectCount,
    lastUpdated
  };
}

// Импортируем данные
async function importData(importedData) {
  try {
    const currentData = await chrome.storage.local.get('testAnswers');
    const testAnswers = currentData.testAnswers || {};
    
    // Объединяем данные
    Object.assign(testAnswers, importedData);
    
    await chrome.storage.local.set({ testAnswers });
    
    return { success: true, count: Object.keys(importedData).length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Инициализация при установке расширения
chrome.runtime.onInstalled.addListener(() => {
  console.log('SW-University Test Tracker установлен');
});
