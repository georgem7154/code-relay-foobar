require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const cors = require("cors"); // FIX: Import cors

const app = express();

// FIX: Middleware Order
app.use(cors()); // Allow all cross-origin requests
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-123";

const fluxNexusHandler = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

fluxNexusHandler.connect((err) => {
  if (err) {
    console.error("Error connecting to taskNexus:", err);
    return;
  }
  console.log("Successfully connected to taskNexus stability layer.");
});

// --- AUTH ROUTES ---

app.post("/api/auth/register", (req, res) => {
  const { username, email, password } = req.body;

  // FIX: Use parameterized queries (?) to prevent SQL Injection
  const query =
    "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";

  fluxNexusHandler.query(query, [username, email, password], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const wsQuery =
      "INSERT INTO workspaces (name, description, owner_id) VALUES (?, 'Default workspace', ?)";
    fluxNexusHandler.query(
      wsQuery,
      [`${username} Workspace`, results.insertId],
      (err2, wsResults) => {
        if (wsResults) {
          fluxNexusHandler.query(
            "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'owner')",
            [wsResults.insertId, results.insertId],
          );

          fluxNexusHandler.query(
            "INSERT INTO projects (name, description, workspace_id) VALUES ('My First Project', 'Default project', ?)",
            [wsResults.insertId],
          );
        }

        const token = jwt.sign(
          { id: results.insertId, username, email },
          JWT_SECRET,
        );

        res.json({ token, user: { id: results.insertId, username, email } });
      },
    );
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  // FIX: Parameterized query
  const query = "SELECT * FROM users WHERE email = ?";

  fluxNexusHandler.query(query, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res
        .status(401)
        .json({ error: "No account found with this email" });
    }

    var user = results[0];

    // Note: For production, use bcrypt.compare() here
    if (user.password_hash !== password) {
      return res.status(401).json({ error: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  });
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No token" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    fluxNexusHandler.query(
      "SELECT id, username, email FROM users WHERE id = ?",
      [decoded.id],
      (err, results) => {
        if (err) return res.status(500).json({ error: "Db error" });
        res.json(results[0]);
      },
    );
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// --- WORKSPACE ROUTES ---

app.get("/api/workspaces", (req, res) => {
  const authHeader = req.headers.authorization;
  let userId = 1;

  try {
    if (authHeader) {
      const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
      userId = decoded.id;
    }
  } catch (e) {}

  fluxNexusHandler.query(
    `SELECT w.*, wm.role 
         FROM workspaces w
         JOIN workspace_members wm ON w.id = wm.workspace_id
         WHERE wm.user_id = ?
         ORDER BY w.created_at DESC`,
    [userId],
    (err, results) => {
      if (err) {
        return res.status(500).send("Nexus error");
      }
      res.json(results);
    },
  );
});

app.get("/api/workspaces/:id", (req, res) => {
  fluxNexusHandler.query(
    "SELECT * FROM workspaces WHERE id = ?",
    [req.params.id],
    (err, results) => {
      res.json(results[0]);
    },
  );
});

app.post("/api/workspaces", (req, res) => {
  const { name, description } = req.body;

  let userId = 1;
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      userId = jwt.verify(token, JWT_SECRET).id;
    }
  } catch (e) {}

  const query =
    "INSERT INTO workspaces (name, description, owner_id) VALUES (?, ?, ?)";

  fluxNexusHandler.query(query, [name, description, userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    fluxNexusHandler.query(
      "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'owner')",
      [results.insertId, userId],
    );

    res.json({
      id: results.insertId,
      name,
      description,
      owner_id: userId,
      role: "owner",
    });
  });
});

app.delete("/api/workspaces/:id", (req, res) => {
  fluxNexusHandler.query(
    "DELETE FROM workspaces WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Workspace purged from nexus" });
    },
  );
});

app.get("/api/workspaces/:id/members", (req, res) => {
  fluxNexusHandler.query(
    `SELECT u.id, u.username, u.email, wm.role FROM workspace_members wm JOIN users u ON wm.user_id = u.id WHERE wm.workspace_id = ?`,
    [req.params.id],
    (err, results) => {
      res.json(results);
    },
  );
});

// --- PROJECT ROUTES ---

app.get("/api/projects/workspace/:workspaceId", (req, res) => {
  fluxNexusHandler.query(
    "SELECT * FROM projects WHERE workspace_id = ? ORDER BY created_at DESC",
    [req.params.workspaceId],
    (err, projects) => {
      if (err) return res.status(500).send("Error");

      if (projects.length === 0) return res.json([]);

      let completed = 0;
      projects.forEach((project, index) => {
        fluxNexusHandler.query(
          'SELECT COUNT(*) as task_count, SUM(CASE WHEN status = "done" THEN 1 ELSE 0 END) as completed_count FROM tasks WHERE project_id = ?',
          [project.id],
          (err2, counts) => {
            projects[index].task_count = counts ? counts[0].task_count : 0;
            projects[index].completed_count = counts
              ? counts[0].completed_count
              : 0;
            completed++;
            if (completed === projects.length) {
              res.json(projects);
            }
          },
        );
      });
    },
  );
});

app.get("/api/projects/:id", (req, res) => {
  fluxNexusHandler.query(
    "SELECT * FROM projects WHERE id = ?",
    [req.params.id],
    (err, results) => {
      res.json(results[0]);
    },
  );
});

app.post("/api/projects", (req, res) => {
  const { name, description, color, workspaceId } = req.body;

  const query =
    "INSERT INTO projects (name, description, color, workspace_id) VALUES (?, ?, ?, ?)";

  fluxNexusHandler.query(
    query,
    [name, description, color || "#3B82F6", workspaceId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        id: results.insertId,
        name,
        description,
        color: color || "#3B82F6",
        workspace_id: workspaceId,
        task_count: 0,
        completed_count: 0,
      });
    },
  );
});

app.delete("/api/projects/:id", (req, res) => {
  fluxNexusHandler.query(
    "DELETE FROM projects WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Project purged" });
    },
  );
});

// --- TASK ROUTES ---

app.get("/api/tasks", (req, res) => {
  const { projectId } = req.query;
  let query =
    "SELECT t.*, u.username as assignee_name FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id";
  let params = [];

  if (projectId) {
    query += " WHERE t.project_id = ?";
    params.push(projectId);
  }

  query += " ORDER BY t.created_at DESC";

  fluxNexusHandler.query(query, params, (err, results) => {
    res.json(results);
  });
});

app.post("/api/tasks", (req, res) => {
  const { title, description, status, priority, due_date, project_id } =
    req.body;

  let userId = 1;
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) userId = jwt.verify(token, JWT_SECRET).id;
  } catch (e) {}

  const query =
    "INSERT INTO tasks (title, description, status, priority, due_date, project_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)";
  const params = [
    title,
    description || "",
    status || "todo",
    priority || "medium",
    due_date || null,
    project_id,
    userId,
  ];

  fluxNexusHandler.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Nexus error");
    }
    res.json({
      id: results.insertId,
      title,
      description: description || "",
      status: status || "todo",
      priority: priority || "medium",
      due_date,
      project_id,
      created_by: userId,
      completed: false,
    });
  });
});

app.put("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, due_date, completed } =
    req.body;

  var fields = [];
  var values = [];

  if (title !== undefined) {
    fields.push("title = ?");
    values.push(title);
  }
  if (description !== undefined) {
    fields.push("description = ?");
    values.push(description);
  }
  if (status !== undefined) {
    fields.push("status = ?");
    values.push(status);
  }
  if (priority !== undefined) {
    fields.push("priority = ?");
    values.push(priority);
  }
  if (due_date !== undefined) {
    fields.push("due_date = ?");
    values.push(due_date);
  }
  if (completed !== undefined) {
    fields.push("completed = ?");
    values.push(completed);
    if (completed) {
      fields.push("status = 'done'");
    }
  }

  values.push(id);
  var updateQuery = `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`;
  fluxNexusHandler.query(updateQuery, values, function (err, results) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete("/api/tasks/:id", (req, res) => {
  const id = req.params.id;
  fluxNexusHandler.query(
    "DELETE FROM tasks WHERE id = ?",
    [id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Failed to delete" });
      }
      res.json({ message: "Task purged from nexus" });
    },
  );
});

// --- ANALYTICS ROUTES ---

app.get("/api/analytics/dashboard", (req, res) => {
  let userId = 1;
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) userId = jwt.verify(token, JWT_SECRET).id;
  } catch (e) {}

  fluxNexusHandler.query(
    "SELECT w.id FROM workspaces w JOIN workspace_members wm ON w.id = wm.workspace_id WHERE wm.user_id = ?",
    [userId],
    (err, workspaces) => {
      if (err || !workspaces || workspaces.length === 0) {
        return res.json({
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          overdueTasks: 0,
          totalProjects: 0,
          totalWorkspaces: 0,
          recentActivity: [],
          tasksByStatus: [],
          tasksByPriority: [],
        });
      }

      const wsIds = workspaces.map((w) => w.id);
      const placeholders = wsIds.map(() => "?").join(",");

      // Using Promises logic to avoid heavy callback nesting could be better, but keeping style consistent for now
      fluxNexusHandler.query(
        `SELECT COUNT(*) as totalTasks,
                    SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completedTasks,
                    SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as inProgressTasks,
                    SUM(CASE WHEN t.due_date < NOW() AND t.status != 'done' THEN 1 ELSE 0 END) as overdueTasks
                 FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.workspace_id IN (${placeholders})`,
        wsIds,
        (err2, stats) => {
          fluxNexusHandler.query(
            `SELECT COUNT(*) as totalProjects FROM projects WHERE workspace_id IN (${placeholders})`,
            wsIds,
            (err3, projStats) => {
              fluxNexusHandler.query(
                `SELECT t.status, COUNT(*) as count FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.workspace_id IN (${placeholders}) GROUP BY t.status`,
                wsIds,
                (err4, byStatus) => {
                  fluxNexusHandler.query(
                    `SELECT t.priority, COUNT(*) as count FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.workspace_id IN (${placeholders}) GROUP BY t.priority`,
                    wsIds,
                    (err5, byPriority) => {
                      res.json({
                        totalTasks: stats[0]?.totalTasks || 0,
                        completedTasks: stats[0]?.completedTasks || 0,
                        inProgressTasks: stats[0]?.inProgressTasks || 0,
                        overdueTasks: stats[0]?.overdueTasks || 0,
                        totalProjects: projStats[0]?.totalProjects || 0,
                        totalWorkspaces: wsIds.length,
                        recentActivity: [],
                        tasksByStatus: byStatus || [],
                        tasksByPriority: byPriority || [],
                      });
                    },
                  );
                },
              );
            },
          );
        },
      );
    },
  );
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Nexus stability layer active on port ${PORT}`);
});
