
const { Client } = require('pg');
(async () => {
    const client = new Client({ user: 'sa', host: 'localhost', database: 'lovelink_db', password: 'sa1234', port: 5432 });
    await client.connect();
    const res = await client.query("SELECT email, \"otpCode\", \"otpExpiresAt\" FROM users WHERE email = 'testuser1703728589@example.com'");
    console.log(JSON.stringify(res.rows[0], null, 2));
    await client.end();
})().catch(console.error);
