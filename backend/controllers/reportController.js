const con = require("../db");

// User öz reportlarını yaradır
const createReport = async (req, res) => {
  try {
    const userId = req.user.id; // JWT-dən gəlir
    const {
      title,
      category,
      severity,
      target,
      description,
      steps,
      impact,
      recommendation,
    } = req.body;

    if (!title || !category || !severity || !description || !steps) {
      return res.status(400).json({
        message:
          "title, category, severity, description and steps are required",
      });
    }

    const result = await con.query(
      `INSERT INTO reports (user_id, title, category, severity, target, description, steps, impact, recommendation, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'open') RETURNING *`,
      [
        userId,
        title,
        category,
        severity,
        target || null,
        description,
        steps,
        impact || null,
        recommendation || null,
      ],
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// User öz reportlarını görür
const getUserReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await con.query(
      "SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
    );
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Profile üçün summary məlumat
const getProfileData = async (req, res) => {
  try {
    const userId = req.user.id;

    const userRes = await con.query(
      "SELECT email,role, created_at FROM users WHERE id = $1",
      [userId],
    );
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const reports = await con.query(
      "SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10",
      [userId],
    );

    const statsRes = await con.query(
      `SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'accepted') AS accepted,
        COUNT(*) FILTER (WHERE severity = 'critical') AS critical
       FROM reports WHERE user_id = $1`,
      [userId],
    );

    const stats = statsRes.rows[0];

    return res.json({
      email: user.email,
      created_at: user.created_at,
      total: parseInt(stats.total),
      accepted: parseInt(stats.accepted),
      critical: parseInt(stats.critical),
      reports: reports.rows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Admin — bütün reportları görür
const getAllReports = async (req, res) => {
  try {
    const result = await con.query(
      `SELECT r.*, u.email FROM reports r
       JOIN users u ON r.user_id = u.id
       ORDER BY r.created_at DESC`,
    );
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Admin — report statusunu dəyişir
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ["open", "accepted", "rejected", "fixed"];
    if (!allowed.includes(status))
      return res.status(400).json({ message: "Invalid status" });

    await con.query("UPDATE reports SET status = $1 WHERE id = $2", [
      status,
      id,
    ]);
    return res.status(200).json({ message: "Status updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  createReport,
  getUserReports,
  getProfileData,
  getAllReports,
  updateReportStatus,
};
