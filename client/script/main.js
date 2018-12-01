let socket, id;
let messages = [];

const users = {};
const typing = {};

const updateMessages = (userId, cb) => window.messages.querySelectorAll(`[data-user="${userId}"]`).forEach(cb);
const messagesAddClass = (userId, className) => updateMessages(userId, node => node.classList.add(className));
const messagesRemoveClass = (userId, className) => updateMessages(userId, node => node.classList.remove(className));

const addMessage = message => {
    const divMessage = document.createElement('div');

    divMessage.classList.add('message');
    divMessage.dataset.user = message.userId;

    if (message.userId == id) divMessage.classList.add('my');
    if (users[message.userId]) divMessage.classList.add('online');

    const messageHead = document.createElement('div');
    const messageBody = document.createElement('div');
    const messageAuthor = document.createElement('div');
    const messageTime = document.createElement('div');

    messageHead.className = 'message-head';
    messageBody.className = 'message-body';
    messageAuthor.className = 'message-author';
    messageTime.className = 'message-time';

    messageBody.innerHTML = message.content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    messageAuthor.innerHTML = message.name;
    messageTime.innerHTML = new Date(message.time).toLocaleString();

    messageHead.appendChild(messageAuthor);
    messageHead.appendChild(messageTime);

    divMessage.appendChild(messageHead);
    divMessage.appendChild(messageBody);

    window.messages.appendChild(divMessage);

    while (window.messages.children.length > 100) window.messages.removeChild(window.messages.firstChild);
};

const addEvent = event => {
    const divEvent = document.createElement('div');

    divEvent.innerHTML = event;

    window.list_events.appendChild(divEvent);

    while (window.list_events.children.length > 20) window.list_events.removeChild(window.list_events.firstChild);
};

const auth = (myId, name) => {
    id = myId;

    window.your_name.innerHTML = name;

    window.login.classList.add('disabled');
    window.password.classList.add('disabled');
    window.enter.classList.add('disabled');
    window.reg.classList.add('disabled');

    window.exit.classList.remove('disabled');

    window.login.value = '';
    window.password.value = '';
    window.response.innerHTML = '';

    return messagesAddClass(id, 'my');
};

const connect = () => {
    socket = new WebSocket('ws://localhost:3779');

    socket.onopen = () => {
        const token = localStorage.getItem('token');
        if (token) socket.send(JSON.stringify({ event: 'token', token }));
    };

    socket.onclose = () => setTimeout(connect, 1000);
    socket.onerror = () => socket.close();

    socket.onmessage = event => {
        const message = JSON.parse(event.data);
        const data = message.data;

        console.log(message);

        switch (message.event) {
            case 'init':
                data.online.forEach(user => users[user.id] = user.name);
                messages = data.messages;
                window.messages.innerHTML = '';

                messages.forEach(message => addMessage(message));

                return window.messages.scrollTop = window.messages.scrollHeight;
            case 'reg':
                if (data.success) {
                    auth(data.id, data.name);
                    localStorage.setItem('token', data.token);
                } else {
                    switch (data.reason) {
                        case 'name':
                            return window.response.innerHTML = 'Имя не подходит';
                        case 'password':
                            return window.response.innerHTML = 'Пароль не подходит';
                        case 'taken':
                            return window.response.innerHTML = 'Такое имя уже занято';
                    }
                }

                return;
            case 'auth':
                if (data.success) {
                    auth(data.id, data.name);
                    localStorage.setItem('token', data.token);
                } else {
                    switch (data.reason) {
                        case 'name':
                            return window.response.innerHTML = 'Неверное имя пользователя';
                        case 'password':
                            return window.response.innerHTML = 'Неверный пароль';
                    }
                }

                return;
            case 'token':
                if (data.success) {
                    auth(data.id, data.name);
                } else {
                    localStorage.removeItem('token');
                }

                return;
            case 'exit':
                id = 0;

                window.your_name.innerHTML = 'не авторизованы';

                window.login.classList.remove('disabled');
                window.password.classList.remove('disabled');
                window.enter.classList.remove('disabled');
                window.reg.classList.remove('disabled');

                window.exit.classList.add('disabled');

                return window.messages.querySelectorAll('.my').forEach(node => node.classList.remove('my'));
            case 'login':
                users[data.id] = data.name;

                addEvent(data.name + ' вошёл в чат');

                return messagesAddClass(data.id, 'online');
            case 'logout':
                delete users[data.id];

                addEvent(data.name + ' вышел');

                return messagesRemoveClass(data.id, 'online');
            case 'conversation':
                if (messages.some(message => message.id == data.id)) return;

                const scrollDown = window.messages.scrollTop + window.messages.offsetHeight == window.messages.scrollHeight;

                addMessage(message.data);

                if (scrollDown) window.messages.scrollTop = window.messages.scrollHeight;

                delete typing[data.userId];

                return messagesRemoveClass(data.userId, 'typing');
            case 'typing':
                if ( ! typing[data.id]) addEvent(data.name + ' набирает сообщение');

                typing[data.id] = Date.now();

                return messagesAddClass(data.id, 'typing');
        }
    };
};

document.addEventListener('DOMContentLoaded', () => {
    connect();

    window.message.addEventListener('keypress', event => {
        if (event.key != 'Enter') return socket.send(JSON.stringify({ event: 'typing' }));

        const content = window.message.value;

        if ( ! content) return;

        socket.send(JSON.stringify({ event: 'conversation', content }));

        window.message.value = '';
    });

    window.enter.addEventListener('click', () => {
        const name = window.login.value;
        const password = window.password.value;

        if ( ! name || ! password) return;

        socket.send(JSON.stringify({ event: 'auth', name, password }));
    });

    window.reg.addEventListener('click', () => {
        const name = window.login.value;
        const password = window.password.value;

        if ( ! name || ! password) return;

        socket.send(JSON.stringify({ event: 'reg', name, password }));
    });

    window.exit.addEventListener('click', () => {
        socket.send('{"event":"exit"}');
        localStorage.removeItem('token');
    });

    setInterval(() => {
        for (let userId in typing)
            if (typing[userId] < Date.now() - 1000) {
                delete typing[userId];
                messagesRemoveClass(userId, 'typing');
            }
    }, 100);
});
