const ws = require('ws');
const auth = require('./auth');
const conversation = require('./conversation');

const wrap = (event, data) => JSON.stringify({ event, data });

const usersOnline = {};

exports.start = port => {
    const server = new ws.Server({ port });

    const broadcast = data => {
        server.clients.forEach(client => {
            if (client.readyState === ws.OPEN) client.send(data);
            else client.terminate();
        });
    };

    server.on('connection', socket => {
        const storage = { activity: 0 };

        const online = [];

        for (let id in usersOnline)
            online.push({ id, name: usersOnline[id].name });

        socket.send(wrap('init', { messages: conversation.get100(), online }));

        const login = (result, event) => {
            if (result.success) {
                storage.id = result.id;
                storage.name = result.name;

                if (usersOnline[storage.id]) {
                    usersOnline[storage.id].count++;
                } else {
                    usersOnline[storage.id] = { name: storage.name, count: 1 };
                    broadcast(wrap('login', { id: storage.id, name: storage.name }));
                }
            }

            socket.send(wrap(event, result));
        };

        const authorizedError = event => socket.send(wrap(event, { success: false, reason: 'authorized' }));

        socket.on('message', async message => {
            try {
                message = JSON.parse(message.toString());
            } catch (e) {
                return;
            }

            if ( ! ['exit', 'typing'].some(event => event == message.event)) {
                if (storage.activity > Date.now() - 500) return;
                storage.activity = Date.now();
            }

            switch (message.event) {
                case 'reg':
                    if (storage.id) return authorizedError(message.event);
                    return login(await auth.reg(message.name, message.password), message.event);
                case 'auth':
                    if (storage.id) return authorizedError(message.event);
                    return login(await auth.auth(message.name, message.password), message.event);
                case 'token':
                    if (storage.id) return authorizedError(message.event);
                    return login(await auth.token(message.token), message.event);
                case 'exit':
                    const user = usersOnline[storage.id];

                    if (user && ! --user.count) {
                        delete usersOnline[storage.id];
                        broadcast(wrap('logout', { id: storage.id, name: storage.name }));
                    };

                    delete storage.id;
                    delete storage.name;

                    return socket.send(wrap(message.event, null));
                case 'conversation':
                    if ( ! storage.id) return;
                    return broadcast(wrap(message.event, await conversation.message(message.content, storage.id, storage.name)));
                case 'typing':
                    if ( ! storage.id) return;
                    return broadcast(wrap(message.event, { id:  storage.id, name: storage.name }));
            }
        });

        socket.on('close', () => {
            const user = usersOnline[storage.id];

            if (user && ! --user.count) {
                delete usersOnline[storage.id];
                broadcast(wrap('logout', { id: storage.id, name: storage.name }));
            };

            socket.terminate();
        });

        socket.on('error', () => socket.close());
    });
};
