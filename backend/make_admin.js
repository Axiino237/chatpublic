
const { Client } = require('pg');
const fs = require('fs');
(async () => {
    const email = fs.readFileSync('last_test_email.txt', 'utf8').trim();
    const client = new Client({ user: 'sa', host: 'localhost', database: 'lovelink_db', password: 'sa1234', port: 5432 });
    await client.connect();
    await client.query("UPDATE users SET role = 'admin' WHERE email = $1", [email]);
    console.log(`Updated ${email} to admin role`);
    await client.end();
})().catch(console.error);
