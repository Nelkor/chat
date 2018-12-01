const messages = require('./db/models/messages');
const users = require('./db/models/users');

const last100 = [];

messages.findAll({
    limit: 100,
    order: [ ['id', 'DESC'] ],
    include: { model: users }
}).then(all => all.forEach(message => {
    last100.unshift({
        id: message.id,
        userId: message.userId,
        name: message.user.name,
        content: message.content,
        time: message.createdAt
    });
}));

exports.get100 = () => last100;

exports.message = async (content, userId, name) => {
    if ( ! content || typeof content != 'string' || content.length > 256) return null;

    const message = await messages.create({ content, userId });
    const result = { id: message.id, userId, name, content, time: message.createdAt };

    last100.push(result);

    if (last100.length > 100) last100.shift();

    return result;
};
