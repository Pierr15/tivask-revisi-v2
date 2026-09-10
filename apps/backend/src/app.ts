import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import kbRoutes from "./routes/kb.routes";
import menuRoutes from "./routes/menu.routes";
import conversationRoutes from "./routes/conversation.routes";
import escalationRoutes from "./routes/escalation.routes";
import whatsappRoutes from "./routes/whatsapp.routes";
import { errorHandler } from "./middleware/errorHandler";
import { initWhatsAppClient } from "./whatsapp/whatsappService";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/knowledge-base", kbRoutes);
app.use("/api/menu-items", menuRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/escalations", escalationRoutes);
app.use("/api/whatsapp", whatsappRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Start WhatsApp client here
    initWhatsAppClient();
  });
}

export default app;
app.get("/", (req, res) => {
  res.json({
    message: "TIVAsk Backend is running",
    status: "ok",
  });
});
