const express = require("express");
const Redis = require("ioredis");
const app = express();
const redis = new Redis();

app.use(express.json());

// Generate OTP and store
app.post("/send-otp", async (req, res) => {
  const { userId } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await redis.setex(`otp:${userId}`, 300, otp); // 5 mins expiry

// send otp via email
  res.json({ message: "OTP sent", otp });  
});

// Verify OTP
app.post("/verify-otp", async (req, res) => {
  const { userId, otp: inputOtp } = req.body;
  const storedOtp = await redis.get(`otp:${userId}`);

  if (!storedOtp) return res.status(400).json({ message: "OTP expired" });
  if (storedOtp !== inputOtp) return res.status(400).json({ message: "Invalid OTP" });

  await redis.del(`otp:${userId}`);
  res.json({ message: "OTP verified successfully" });
});

app.listen(3000, () => console.log("Server running on port 3000"));
