
const express = require('express');
const Redis = require('ioredis');

const app = express();

const redis = new Redis({ host: '127.0.0.1', port: 6379 });

redis.on('connect', () => console.log(' Connected to Redis...'));
redis.on('error', (err) => console.error('Redis error:', err.message));

// app.get('/', (req, res)=>{
//     return res.end("you are in home page");
// })

const getClientId = (req) => req.ip;


// app.get('/', async (req, res) => {
//   try {
//     const count = await redis.incr('visits');
//     res.send(`
//       <!doctype html>
//       <html>
//         <head><meta charset="utf-8"><title>Visitor Counter</title></head>
//         <body style="font-family: system-ui, sans-serif; padding: 24px;">
//           <h1>Simple Redis Visitor Counter</h1>
//           <p>Total visits: <strong style="font-size: 28px;">${count}</strong></p>
//           <p>Refresh this page to increase the number.</p>
//           <p>
//             Quick links:
//             <a href="/count">/count (JSON)</a> |
//             <a href="/reset">/reset</a>
//           </p>
//         </body>
//       </html>
//     `);
//   } catch (err) {
//     res.status(500).send('Redis error: ' + err.message);
//   }
// })

// app.get('/count', async (req, res) => {
//   try {
//     const value = await redis.get('visits'); 
//     res.json({ visits: Number(value || 0) });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// })

app.get('/', async (req, res) => {
    const userIp = getClientId(req)
    console.log("my ip is : ", userIp);
    // res.send(`my IP: ${userIp}`);
    
    // increase the count of visits
    const totalVisits = await redis.incr("visits")
    if (totalVisits === 1) {
      await redis.expire("visits", 86400); 
    }
    
    await redis.sadd("visitors", userIp);
    const ttl = await redis.ttl("visitors");
    if (ttl === -1) {
      await redis.expire("visitors", 86400);
    }

    // Get current unique visitor count
    const uniqueCount = await redis.scard("visitors");

    res.send(`
      <!doctype html>
      <html>
        <head><meta charset="utf-8"><title>Visitor Counter</title></head>
        <body style="font-family: system-ui, sans-serif; padding: 24px;">
          <h1>Redis Visitor Counter</h1>
          <p>Total visits today: <strong style="font-size: 28px;">${totalVisits}</strong></p>
          <p>Unique visitors today: <strong style="font-size: 28px;">${uniqueCount}</strong></p>
          <p>Your IP: <code>${userIp}</code></p>
          <p>Auto reset daily at first key expiry (24 hours).</p>
          <p>
            <a href="/count">/count (JSON)</a>
            <a href = "/reset" >/reset </a>
          </p>
        </body>
      </html>
    `);

})

app.get("/count", async (req, res) => {
  try {
    const visits = await redis.get("visits");
    const unique = await redis.scard("visitors");
    res.json({ totalVisits: Number(visits || 0), uniqueVisitors: unique });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.get("/reset", async (req, res) => {
  try {
    await redis.del("visits");
    await redis.del("visitors");
    res.send('Counter reset. Visit <a href="/">home</a> to start again.');
  } catch (err) {
    res.status(500).send("Redis error: " + err.message);
  }
})


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}...`);
});