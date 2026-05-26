const con = require("../db");

// ARTICLES
const getArticles = async (req, res) => {
  try {
    const result = await con.query(
      `SELECT a.*, u.email AS author_email
       FROM articles a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC`,
    );
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const createArticle = async (req, res) => {
  try {
    const { title, owasp_category, content } = req.body;
    if (!title || !content)
      return res.status(400).json({ message: "title and content required" });

    const result = await con.query(
      "INSERT INTO articles (title, owasp_category, content, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, owasp_category || null, content, req.user.id],
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    // Admin hər şeyi silə bilər, user yalnız özünkünü
    if (req.user.role === "admin") {
      await con.query("DELETE FROM articles WHERE id = $1", [id]);
    } else {
      await con.query("DELETE FROM articles WHERE id = $1 AND user_id = $2", [
        id,
        req.user.id,
      ]);
    }
    return res.status(200).json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// CODE EXAMPLES
const getCodeExamples = async (req, res) => {
  try {
    const result = await con.query(
      `SELECT c.*, u.email AS author_email
       FROM code_examples c
       LEFT JOIN users u ON c.user_id = u.id
       ORDER BY c.created_at DESC`,
    );
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const createCodeExample = async (req, res) => {
  try {
    const {
      title,
      owasp_category,
      severity,
      vulnerable_code,
      fixed_code,
      explanation,
    } = req.body;
    if (!title || !vulnerable_code || !fixed_code) {
      return res
        .status(400)
        .json({ message: "title, vulnerable_code and fixed_code required" });
    }

    const result = await con.query(
      `INSERT INTO code_examples (title, owasp_category, severity, vulnerable_code, fixed_code, explanation, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        title,
        owasp_category || null,
        severity || "low",
        vulnerable_code,
        fixed_code,
        explanation || null,
        req.user.id,
      ],
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const deleteCodeExample = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === "admin") {
      await con.query("DELETE FROM code_examples WHERE id = $1", [id]);
    } else {
      await con.query(
        "DELETE FROM code_examples WHERE id = $1 AND user_id = $2",
        [id, req.user.id],
      );
    }
    return res.status(200).json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getArticles,
  createArticle,
  deleteArticle,
  getCodeExamples,
  createCodeExample,
  deleteCodeExample,
};
