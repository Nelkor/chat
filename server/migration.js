const users = require('./db/models/users');
const messages = require('./db/models/messages');

async function migrate() {
  await users.sync();
  await messages.sync();
}

migrate().then(() => {
  console.log('Migration done!');
  process.exit(0);
});
