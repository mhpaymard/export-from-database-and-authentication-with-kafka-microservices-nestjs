const bcrypt = require('bcrypt');

async function hashPasswords() {
  const users = [
    { username: 'admin', password: 'admin123' },
    { username: 'john_doe', password: 'password123' },
    { username: 'jane_smith', password: 'password123' },
    { username: 'bob_admin', password: 'admin123' },
  ];

  console.log('Hashed passwords for database update:\n');

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`-- ${user.username} (password: ${user.password})`);
    console.log(`UPDATE users SET password = '${hash}' WHERE username = '${user.username}';`);
    console.log('');
  }
}

hashPasswords().catch(console.error);
