const bcrypt = require('bcrypt');
const crypto = require('crypto');
const users = require('./db/models/users');

const tokens = {};

exports.exit = id => {
    for (let token in tokens)
        if (tokens[token][id] == id)
            delete tokens[token];
};

exports.token = token => {
    if (tokens[token])
        return {
            success: true,
            id: tokens[token].id,
            name: tokens[token].name
        }

    return { success: false };
};

exports.auth = async (name, password) => {
    const user = await users.findOne({ where: { name } }); // TODO запрашивать по имени в нижнем регистре

    if (user) {
        const match = await bcrypt.compare(password, user.hash);

        if (match) {
            let token;

            do token = crypto.randomBytes(32).toString('hex');
            while (tokens[token]);

            tokens[token] = {
                id: user.id,
                name: user.name
            };

            return {
                success: true,
                id: user.id,
                name: user.name,
                token
            };
        }

        return { success: false, reason: 'password' };
    }

    return { success: false, reason: 'name' };
};

exports.reg = async (name, password) => {
    const nameRule = /^[A-Z][A-Za-z0-9_`]{2,15}$/;

    if ( ! nameRule.test(name)) return { success: false, reason: 'name' };
    if (typeof password != 'string' || password.length < 5) return { success: false, reason: 'password' };

    const user = await users.findOne({ where: { name } });

    if (user) return { success: false, reason: 'taken' };

    const hash = await bcrypt.hash(password, 10);
    const newbie = await users.create({ name, hash });

    let token;

    do token = crypto.randomBytes(16).toString('hex');
    while (tokens[token]);

    tokens[token] = {
        id: newbie.id,
        name: newbie.name
    };

    return {
        success: true,
        id: newbie.id,
        name: newbie.name,
        token
    };
};
