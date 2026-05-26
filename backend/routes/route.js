const express = require("express");
const router = express.Router();
const path = require("path");

const controller = require("../controllers/authController");
const learnController = require("../controllers/learnController");
const reportController = require("../controllers/reportController");
const {
  authenticateToken,
  authorizeAdmin,
} = require("../controllers/authController");

router.use(express.static(path.join(__dirname, "../../frontend")));

// Səhifələr
router.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../../frontend/home.html")),
);
router.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "../../frontend/login.html")),
);
router.get("/register", (req, res) =>
  res.sendFile(path.join(__dirname, "../../frontend/register.html")),
);
router.get("/forgotpassword", (req, res) =>
  res.sendFile(path.join(__dirname, "../../frontend/forgot.html")),
);
router.get("/profile", (req, res) =>
  res.sendFile(path.join(__dirname, "../../frontend/profile.html")),
);
router.get("/learn", (req, res) =>
  res.sendFile(path.join(__dirname, "../../frontend/learn.html")),
);
router.get("/report", (req, res) =>
  res.sendFile(path.join(__dirname, "../../frontend/report.html")),
);
router.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "../../frontend/admin.html")),
);

// Auth
router.post("/login", controller.login);
router.post("/register", controller.register);
router.post("/forgotpassword", controller.forgotpassword);
router.post("/resetpassword", controller.resetpassword);
router.post("/refresh", controller.refreshtoken);
router.post("/logout", controller.logout);

// Profile
router.get("/api/profile", authenticateToken, reportController.getProfileData);

// Reports — hər authenticated user
router.post("/api/reports", authenticateToken, reportController.createReport);
router.get("/api/reports", authenticateToken, reportController.getUserReports);

// Learn — oxumaq hər kəs üçün
router.get(
  "/api/learn/articles",
  authenticateToken,
  learnController.getArticles,
);
router.get(
  "/api/learn/code",
  authenticateToken,
  learnController.getCodeExamples,
);

// Learn — yazmaq hər authenticated user üçün (learnController içində user_id saxlanır)
router.post(
  "/api/learn/articles",
  authenticateToken,
  learnController.createArticle,
);
router.post(
  "/api/learn/code",
  authenticateToken,
  learnController.createCodeExample,
);

// Learn — silmək: admin hər şeyi silir, user özünkünü (learnController içində yoxlanır)
router.delete(
  "/api/learn/articles/:id",
  authenticateToken,
  learnController.deleteArticle,
);
router.delete(
  "/api/learn/code/:id",
  authenticateToken,
  learnController.deleteCodeExample,
);

// Admin — yalnız admin
router.get(
  "/api/admin/reports",
  authenticateToken,
  authorizeAdmin,
  reportController.getAllReports,
);
router.patch(
  "/api/admin/reports/:id",
  authenticateToken,
  authorizeAdmin,
  reportController.updateReportStatus,
);

// Global error handler
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

module.exports = router;
