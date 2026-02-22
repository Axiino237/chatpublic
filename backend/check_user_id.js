
const { Client } = require('pg');
(async () => {
    const client = new Client({ user: 'sa', host: 'localhost', database: 'lovelink_db', password: 'sa1234', port: 5432 });
    await client.connect();
    const res = await client.query("SELECT * FROM users WHERE id = '934257df-1068-4197-8602-f340a6f2a8a1'");
    console.log(JSON.stringify(res.rows[0], null, 2));
    await client.end();
})().catch(console.error);
