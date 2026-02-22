
const { io } = require("socket.io-client");
const fs = require('fs');

async function testChat() {
    const email = fs.readFileSync('last_test_email.txt', 'utf8').trim();
    // I need a token for this user
    const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "Password123!" })
    });
    const { accessToken, user } = await response.json();
    const userId = user.id;

    const socket = io("http://localhost:3000", {
        auth: { token: accessToken }
    });

    socket.on("connect", () => {
        console.log("Connected to WebSocket");
        socket.emit("joinPublic", "Global");
    });

    socket.on("receivePublicMessage", (msg) => {
        console.log("Received public message:", msg);
        if (msg.content === "Hello from test script!") {
            console.log("SUCCESS: Message received back!");
            socket.disconnect();
            process.exit(0);
        }
    });

    socket.on("exception", (err) => {
        console.error("Socket exception:", err);
    });

    socket.on("connect_error", (err) => {
        console.error("Connect error:", err.message);
        process.exit(1);
    });

    setTimeout(() => {
        console.log("Sending message...");
        socket.emit("sendPublicMessage", { roomId: "Global", senderId: userId, content: "Hello from test script!" });
    }, 2000);

    setTimeout(() => {
        console.log("Timeout waiting for message response");
        socket.disconnect();
        process.exit(1);
    }, 10000);
}

testChat();
