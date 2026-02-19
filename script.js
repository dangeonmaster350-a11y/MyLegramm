// Состояние приложения
let currentUser = null;
let currentChat = null;
let verificationCode = null;
let timerInterval = null;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    checkSavedSession();
    setupEventListeners();
});

// Проверка сохраненной сессии
function checkSavedSession() {
    const savedUser = localStorage.getItem('telegramUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showChats();
    }
}

// Настройка слушателей событий
function setupEventListeners() {
    // Валидация номера телефона
    document.getElementById('phone-number').addEventListener('input', validatePhone);
    document.getElementById('code-input').addEventListener('input', validateCode);
}

// Валидация телефона
function validatePhone() {
    const phone = document.getElementById('phone-number').value;
    const sendBtn = document.getElementById('send-code-btn');
    sendBtn.disabled = phone.length < 10;
}

// Валидация кода
function validateCode() {
    const code = document.getElementById('code-input').value;
    const verifyBtn = document.getElementById('verify-code-btn');
    verifyBtn.disabled = code.length !== 5;
}

// Отправка кода подтверждения
function sendCode() {
    const countryCode = document.getElementById('country-code').value;
    const phoneNumber = document.getElementById('phone-number').value;
    const fullPhone = '+' + countryCode + phoneNumber;
    
    // Сохраняем номер
    sessionStorage.setItem('tempPhone', fullPhone);
    document.getElementById('phone-display').textContent = fullPhone;
    
    // Генерируем "код подтверждения" (в реальном приложении здесь был бы API)
    verificationCode = Math.floor(10000 + Math.random() * 90000).toString();
    console.log('Код подтверждения:', verificationCode); // Для тестирования
    
    // Показываем уведомление
    showNotification(`Код отправлен на ${fullPhone}`);
    
    // Переходим к вводу кода
    document.getElementById('step-phone').classList.add('hidden');
    document.getElementById('step-code').classList.remove('hidden');
    
    // Запускаем таймер
    startTimer(60);
}

// Проверка кода
function verifyCode() {
    const enteredCode = document.getElementById('code-input').value;
    
    if (enteredCode === verificationCode) {
        // Создаем пользователя
        currentUser = {
            id: Date.now(),
            phone: sessionStorage.getItem('tempPhone'),
            name: 'Пользователь',
            avatar: '👤'
        };
        
        localStorage.setItem('telegramUser', JSON.stringify(currentUser));
        showNotification('✅ Успешный вход!');
        
        // Показываем экран чатов
        showChats();
    } else {
        showNotification('❌ Неверный код', 'error');
    }
}

// Таймер для повторной отправки
function startTimer(seconds) {
    const timerSpan = document.querySelector('#timer span');
    const timerDiv = document.getElementById('timer');
    
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        seconds--;
        timerSpan.textContent = seconds;
        
        if (seconds <= 0) {
            clearInterval(timerInterval);
            timerDiv.innerHTML = '<button class="btn-link" onclick="resendCode()">Отправить повторно</button>';
        }
    }, 1000);
}

// Повторная отправка кода
function resendCode() {
    verificationCode = Math.floor(10000 + Math.random() * 90000).toString();
    console.log('Новый код:', verificationCode);
    showNotification('✅ Новый код отправлен');
    startTimer(60);
}

// Возврат к вводу номера
function backToPhone() {
    document.getElementById('step-code').classList.add('hidden');
    document.getElementById('step-phone').classList.remove('hidden');
    if (timerInterval) clearInterval(timerInterval);
}

// Пропуск email
function skipEmail() {
    showChats();
}

// Сохранение email
function saveEmail() {
    const email = document.getElementById('email-input').value;
    if (email && currentUser) {
        currentUser.email = email;
        localStorage.setItem('telegramUser', JSON.stringify(currentUser));
    }
    showChats();
}

// Показать экран чатов
function showChats() {
    hideAllScreens();
    document.getElementById('chats-screen').classList.add('active');
    loadChats();
}

// Показать контакты
function showContacts() {
    hideAllScreens();
    document.getElementById('contacts-screen').classList.add('active');
    loadContacts();
}

// Показать настройки
function showSettings() {
    hideAllScreens();
    document.getElementById('settings-screen').classList.add('active');
    updateProfileDisplay();
}

// Вернуться к чатам
function backToChats() {
    showChats();
}

// Скрыть все экраны
function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

// Загрузка чатов
function loadChats() {
    const chatsList = document.getElementById('chats-list');
    const savedChats = JSON.parse(localStorage.getItem('chats') || '[]');
    
    chatsList.innerHTML = '';
    
    if (savedChats.length === 0) {
        // Демо-данные
        savedChats.push(
            {
                id: 1,
                name: 'Иван Петров',
                lastMessage: 'Привет! Как дела?',
                time: '12:30',
                avatar: '👨'
            },
            {
                id: 2,
                name: 'Мария Сидорова',
                lastMessage: 'Фото 📸',
                time: '11:15',
                avatar: '👩'
            }
        );
    }
    
    savedChats.forEach(chat => {
        const chatElement = createChatElement(chat);
        chatsList.appendChild(chatElement);
    });
}

// Создание элемента чата
function createChatElement(chat) {
    const div = document.createElement('div');
    div.className = 'chat-item';
    div.onclick = () => openChat(chat);
    
    div.innerHTML = `
        <div class="chat-item-avatar">${chat.avatar}</div>
        <div class="chat-item-info">
            <div class="chat-item-name">${chat.name}</div>
            <div class="chat-item-last-message">${chat.lastMessage}</div>
        </div>
        <div class="chat-item-time">${chat.time}</div>
    `;
    
    return div;
}

// Открыть чат
function openChat(chat) {
    currentChat = chat;
    document.getElementById('chat-name').textContent = chat.name;
    document.getElementById('chat-avatar').textContent = chat.avatar;
    
    hideAllScreens();
    document.getElementById('messages-screen').classList.add('active');
    
    loadMessages();
}

// Загрузка сообщений
function loadMessages() {
    const container = document.getElementById('messages-container');
    const messages = JSON.parse(localStorage.getItem(`chat_${currentChat.id}`) || '[]');
    
    container.innerHTML = '';
    
    messages.forEach(msg => {
        const messageElement = createMessageElement(msg);
        container.appendChild(messageElement);
    });
    
    // Скролл вниз
    container.scrollTop = container.scrollHeight;
}

// Создание элемента сообщения
function createMessageElement(msg) {
    const div = document.createElement('div');
    div.className = `message ${msg.sender === currentUser.id ? 'outgoing' : 'incoming'}`;
    
    div.innerHTML = `
        <div class="message-text">${msg.text}</div>
        <div class="message-time">
            ${msg.time}
            ${msg.sender === currentUser.id ? '<span class="message-status">✓✓</span>' : ''}
        </div>
    `;
    
    return div;
}

// Отправка сообщения
function sendMessage() {
    const input = document.getElementById('message-text');
    const text = input.value.trim();
    
    if (!text || !currentChat) return;
    
    const message = {
        id: Date.now(),
        text: text,
        sender: currentUser.id,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
    
    // Сохраняем сообщение
    const messages = JSON.parse(localStorage.getItem(`chat_${currentChat.id}`) || '[]');
    messages.push(message);
    localStorage.setItem(`chat_${currentChat.id}`, JSON.stringify(messages));
    
    // Обновляем последнее сообщение в чате
    updateChatLastMessage(currentChat.id, text);
    
    // Очищаем поле и обновляем сообщения
    input.value = '';
    loadMessages();
}

// Обновление последнего сообщения в чате
function updateChatLastMessage(chatId, text) {
    const chats = JSON.parse(localStorage.getItem('chats') || '[]');
    const chat = chats.find(c => c.id === chatId);
    
    if (chat) {
        chat.lastMessage = text;
        chat.time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        localStorage.setItem('chats', JSON.stringify(chats));
    }
}

// Загрузка контактов
function loadContacts() {
    const contactsList = document.getElementById('contacts-list');
    contactsList.innerHTML = '';
    
    // Демо-контакты
    const contacts = [
        { id: 1, name: 'Иван Петров', phone: '+7 900 123-45-67', avatar: '👨' },
        { id: 2, name: 'Мария Сидорова', phone: '+7 911 234-56-78', avatar: '👩' },
        { id: 3, name: 'Алексей Иванов', phone: '+7 922 345-67-89', avatar: '👨' }
    ];
    
    contacts.forEach(contact => {
        const contactElement = createContactElement(contact);
        contactsList.appendChild(contactElement);
    });
}

// Создание элемента контакта
function createContactElement(contact) {
    const div = document.createElement('div');
    div.className = 'chat-item';
    div.onclick = () => startChatWithContact(contact);
    
    div.innerHTML = `
        <div class="chat-item-avatar">${contact.avatar}</div>
        <div class="chat-item-info">
            <div class="chat-item-name">${contact.name}</div>
            <div class="chat-item-last-message">${contact.phone}</div>
        </div>
    `;
    
    return div;
}

// Начать чат с контактом
function startChatWithContact(contact) {
    const newChat = {
        id: contact.id,
        name: contact.name,
        avatar: contact.avatar,
        lastMessage: '',
        time: ''
    };
    
    const chats = JSON.parse(localStorage.getItem('chats') || '[]');
    if (!chats.find(c => c.id === contact.id)) {
        chats.push(newChat);
        localStorage.setItem('chats', JSON.stringify(chats));
    }
    
    openChat(newChat);
}

// Обновление профиля
function updateProfileDisplay() {
    if (currentUser) {
        document.getElementById('profile-name').textContent = currentUser.name;
        document.getElementById('profile-phone').textContent = currentUser.phone;
    }
}

// Новый чат
function newChat() {
    showContacts();
}

// Добавить контакт
function addContact() {
    const name = prompt('Введите имя контакта:');
    const phone = prompt('Введите номер телефона:');
    
    if (name && phone) {
        showNotification(`✅ Контакт ${name} добавлен`);
    }
}

// Прикрепить файл
function attachFile() {
    showNotification('📎 Функция загрузки файлов будет доступна в следующем обновлении');
}

// Открыть меню чата
function openChatMenu() {
    showNotification('Меню чата');
}

// Переключение темы
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('darkTheme', isDark);
}

// Показать профиль
function showProfile() {
    showNotification('Редактирование профиля');
}

// Выход из аккаунта
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('telegramUser');
        currentUser = null;
        hideAllScreens();
        document.getElementById('auth-screen').classList.add('active');
    }
}

// Показать уведомление
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}