// =====================  IMPORTS  ==========================
import app from "./app.js";
import connectDB from "./config/db.config.js";

// =====================  CONFIGURATION  =====================
const PORT = process.env.PORT || 5000;

// =====================  SERVER INITIALIZATION  =============
connectDB();
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
