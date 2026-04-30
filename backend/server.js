import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import tmcRoutes from "./routes/tmcRoutes.js";
import mainDataRoutes from "./routes/mainDataRoutes.js";
import callDetailsRoutes from "./routes/callDetailsRoutes.js";
import presentationDetailRoutes from "./routes/presentationDetailRoutes.js";
import formDetailRoutes from "./routes/formDetailRoutes.js";
import goalDetailRoutes from "./routes/goalDetailRoutes.js";
import employeeDetailRoutes from "./routes/employeeDetailRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import hrPerformanceRoutes from "./routes/hrPerformanceRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import websiteDeveloperRoutes from "./routes/websiteDeveloperRoutes.js";
import digitalMarketingRoutes from "./routes/digitalMarketingRoutes.js";
import crmOptimizationRoutes from "./routes/crmOptimizationRoutes.js";
import crmPhotoshootRoutes from "./routes/crmPhotoshootRoutes.js";
import crmContactNumberRoutes from "./routes/crmContactNumberRoutes.js";
import crmSuspendedPageRoutes from "./routes/crmSuspendedPageRoutes.js";
import crmPageHandlingRoutes from "./routes/crmPageHandlingRoutes.js";
import crmGmbProfileRoutes from "./routes/crmGmbProfileRoutes.js";
import crmGoogleOtherServiceRoutes from "./routes/crmGoogleOtherServiceRoutes.js";
import hrCallRoutes from "./routes/hrCallRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminPerformanceRoutes from "./routes/adminPerformanceRoutes.js";
import adminBusinessDetailsRoutes from "./routes/adminBusinessDetailsRoutes.js";
import baUpdateRoutes from "./routes/baUpdateRoutes.js";
import callingDataRoutes from "./routes/callingDataRoutes.js";

console.log("cwd =", process.cwd());
console.log("MONGO_URI =", process.env.MONGO_URI);
console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log("EMAIL_PASS exists =", !!process.env.EMAIL_PASS);

connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("CRM API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/tmc", tmcRoutes);
app.use("/api/main-data", mainDataRoutes);
app.use("/api/call-details", callDetailsRoutes);
app.use("/api/presentation-details", presentationDetailRoutes);
app.use("/api/forms", formDetailRoutes);
app.use("/api/goals", goalDetailRoutes);
app.use("/api/employee-details", employeeDetailRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/hr-performance", hrPerformanceRoutes);
app.use("/api/hr-calls", hrCallRoutes);
app.use("/api/users", userRoutes);
app.use("/api/website-developer", websiteDeveloperRoutes);
app.use("/api/digital-marketing", digitalMarketingRoutes);
app.use("/api/crm/optimization", crmOptimizationRoutes);
app.use("/api/crm/photoshoot", crmPhotoshootRoutes);
app.use("/api/crm/contact-number", crmContactNumberRoutes);
app.use("/api/crm/suspended-page", crmSuspendedPageRoutes);
app.use("/api/crm/page-handling", crmPageHandlingRoutes);
app.use("/api/crm/gmb-profile", crmGmbProfileRoutes);
app.use("/api/crm/google-other-services", crmGoogleOtherServiceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/performance", adminPerformanceRoutes);
app.use("/api/admin/business-details", adminBusinessDetailsRoutes);
app.use("/api/ba-updates", baUpdateRoutes);
app.use("/api/calling-data", callingDataRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});