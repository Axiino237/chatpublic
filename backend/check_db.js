
const { Client } = require('pg');

async function checkUser() {
    const client = new Client({
        user: 'sa',
        host: 'localhost',
        database: 'lovelink_db',
        password: 'sa1234',
        port: 5432,
    });
    await client.connect();
    const res = await client.query('SELECT username, "firstName", "lastName", email FROM users ORDER BY "createdAt" DESC LIMIT 1');
    console.log(JSON.stringify(res.rows[0], null, 2));
    await client.end();
}

checkUser().catch(console.error);
