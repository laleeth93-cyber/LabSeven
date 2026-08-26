async function run() {
    const res = await fetch('http://127.0.0.1:3000/api/whatsapp/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId: 2 })
    });
    console.log(res.status);
    const data = await res.text();
    console.log(data);
}
run();
