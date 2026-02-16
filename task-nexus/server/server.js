require("dotenv").config();
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- CONFIGURATION ---
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-123";
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://georgem:george123@projects.bhrv3vc.mongodb.net/task_nexus?retryWrites=true&w=majority";
const PORT = process.env.PORT || 5000;

// --- MONGODB CONNECTION ---
let db;
let client;

async function connectToDatabase() {
  try {
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    db = client.db("task_nexus");

    // Create indexes for better performance
    await createIndexes();

    console.log("✓ Successfully connected to MongoDB task_nexus database");
    return db;
  } catch (error) {
    console.error("✗ Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
}

async function createIndexes() {
  try {
    const users = db.collection("users");
    await users.createIndex({ email: 1 }, { unique: true });
    await users.createIndex({ username: 1 }, { unique: true });

    const workspaces = db.collection("workspaces");
    await workspaces.createIndex({ owner_id: 1 });

    const workspace_members = db.collection("workspace_members");
    await workspace_members.createIndex(
      { workspace_id: 1, user_id: 1 },
      { unique: true },
    );
    await workspace_members.createIndex({ user_id: 1 });

    const projects = db.collection("projects");
    await projects.createIndex({ workspace_id: 1 });

    const tasks = db.collection("tasks");
    await tasks.createIndex({ project_id: 1 });
    await tasks.createIndex({ assignee_id: 1 });
    await tasks.createIndex({ status: 1 });
    await tasks.createIndex({ due_date: 1 });

    const notifications = db.collection("notifications");
    await notifications.createIndex({ user_id: 1 });
    await notifications.createIndex({ created_at: -1 });

    console.log("✓ Database indexes created successfully");
  } catch (error) {
    console.error("✗ Error creating indexes:", error.message);
  }
}

// --- HELPER FUNCTIONS ---

function validateObjectId(id, fieldName = "ID") {
  if (!id || !ObjectId.isValid(id)) {
    throw new Error(`Invalid ${fieldName}`);
  }
  return new ObjectId(id);
}

function extractUserId(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.id;
  } catch (error) {
    return null;
  }
}

function handleError(res, error, defaultMessage = "Internal server error") {
  console.error("Error:", error);

  if (error.code === 11000) {
    // Duplicate key error
    const field = Object.keys(error.keyPattern)[0];
    return res.status(400).json({
      error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
    });
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || defaultMessage;

  res.status(statusCode).json({ error: message });
}

// --- AUTH ROUTES ---

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email, and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Note: In production, hash password with bcrypt
    // const password_hash = await bcrypt.hash(password, 10);
    const password_hash = password; // Using plain password for now (NOT RECOMMENDED FOR PRODUCTION)

    // Create user
    const users = db.collection("users");
    const userResult = await users.insertOne({
      username,
      email,
      password_hash,
      avatar_url: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const userId = userResult.insertedId;

    // Create default workspace
    const workspaces = db.collection("workspaces");
    const workspaceResult = await workspaces.insertOne({
      name: `${username} Workspace`,
      description: "Default workspace",
      owner_id: userId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const workspaceId = workspaceResult.insertedId;

    // Add user as workspace owner
    const workspace_members = db.collection("workspace_members");
    await workspace_members.insertOne({
      workspace_id: workspaceId,
      user_id: userId,
      role: "owner",
      joined_at: new Date(),
    });

    // Create default project
    const projects = db.collection("projects");
    await projects.insertOne({
      name: "My First Project",
      description: "Default project",
      color: "#3B82F6",
      workspace_id: workspaceId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Generate JWT
    const token = jwt.sign(
      { id: userId.toString(), username, email },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: userId.toString(),
        username,
        email,
      },
    });
  } catch (error) {
    handleError(res, error, "Registration failed");
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const users = db.collection("users");
    const user = await users.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ error: "No account found with this email" });
    }

    // Note: In production, use bcrypt.compare(password, user.password_hash)
    if (user.password_hash !== password) {
      return res.status(401).json({ error: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    handleError(res, error, "Login failed");
  }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const users = db.collection("users");
    const user = await users.findOne(
      { _id: new ObjectId(decoded.id) },
      { projection: { password_hash: 0 } },
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    handleError(res, error, "Authentication failed");
  }
});

// --- WORKSPACE ROUTES ---

app.get("/api/workspaces", async (req, res) => {
  try {
    const userId = extractUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const workspace_members = db.collection("workspace_members");
    const workspaces = db.collection("workspaces");

    // Find all workspaces where user is a member
    const memberships = await workspace_members
      .find({ user_id: new ObjectId(userId) })
      .toArray();

    const workspaceIds = memberships.map((m) => m.workspace_id);

    if (workspaceIds.length === 0) {
      return res.json([]);
    }

    // Get workspace details
    const workspaceList = await workspaces
      .find({ _id: { $in: workspaceIds } })
      .sort({ created_at: -1 })
      .toArray();

    // Add role to each workspace
    const result = workspaceList.map((ws) => {
      const membership = memberships.find((m) => m.workspace_id.equals(ws._id));
      return {
        id: ws._id.toString(),
        name: ws.name,
        description: ws.description,
        owner_id: ws.owner_id.toString(),
        role: membership?.role || "member",
        created_at: ws.created_at,
        updated_at: ws.updated_at,
      };
    });

    res.json(result);
  } catch (error) {
    handleError(res, error, "Failed to fetch workspaces");
  }
});

app.get("/api/workspaces/:id", async (req, res) => {
  try {
    const workspaceId = validateObjectId(req.params.id, "Workspace ID");
    const workspaces = db.collection("workspaces");

    const workspace = await workspaces.findOne({ _id: workspaceId });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    res.json({
      id: workspace._id.toString(),
      name: workspace.name,
      description: workspace.description,
      owner_id: workspace.owner_id.toString(),
      created_at: workspace.created_at,
      updated_at: workspace.updated_at,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch workspace");
  }
});

app.post("/api/workspaces", async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = extractUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Workspace name is required" });
    }

    const workspaces = db.collection("workspaces");
    const workspaceResult = await workspaces.insertOne({
      name,
      description: description || "",
      owner_id: new ObjectId(userId),
      created_at: new Date(),
      updated_at: new Date(),
    });

    const workspaceId = workspaceResult.insertedId;

    // Add user as workspace owner
    const workspace_members = db.collection("workspace_members");
    await workspace_members.insertOne({
      workspace_id: workspaceId,
      user_id: new ObjectId(userId),
      role: "owner",
      joined_at: new Date(),
    });

    res.json({
      id: workspaceId.toString(),
      name,
      description: description || "",
      owner_id: userId,
      role: "owner",
    });
  } catch (error) {
    handleError(res, error, "Failed to create workspace");
  }
});

app.delete("/api/workspaces/:id", async (req, res) => {
  try {
    const workspaceId = validateObjectId(req.params.id, "Workspace ID");
    const userId = extractUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const workspaces = db.collection("workspaces");
    const workspace = await workspaces.findOne({ _id: workspaceId });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    // Check if user is the owner
    if (workspace.owner_id.toString() !== userId) {
      return res.status(403).json({ error: "Only workspace owner can delete" });
    }

    // Delete workspace and related data
    await workspaces.deleteOne({ _id: workspaceId });
    await db
      .collection("workspace_members")
      .deleteMany({ workspace_id: workspaceId });

    // Delete projects and tasks in this workspace
    const projects = db.collection("projects");
    const projectList = await projects
      .find({ workspace_id: workspaceId })
      .toArray();
    const projectIds = projectList.map((p) => p._id);

    if (projectIds.length > 0) {
      await db
        .collection("tasks")
        .deleteMany({ project_id: { $in: projectIds } });
      await projects.deleteMany({ workspace_id: workspaceId });
    }

    res.json({ message: "Workspace purged from nexus" });
  } catch (error) {
    handleError(res, error, "Failed to delete workspace");
  }
});

app.get("/api/workspaces/:id/members", async (req, res) => {
  try {
    const workspaceId = validateObjectId(req.params.id, "Workspace ID");

    const workspace_members = db.collection("workspace_members");
    const users = db.collection("users");

    const members = await workspace_members
      .find({ workspace_id: workspaceId })
      .toArray();

    const userIds = members.map((m) => m.user_id);

    if (userIds.length === 0) {
      return res.json([]);
    }

    const userList = await users
      .find({ _id: { $in: userIds } }, { projection: { password_hash: 0 } })
      .toArray();

    const result = userList.map((user) => {
      const membership = members.find((m) => m.user_id.equals(user._id));
      return {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: membership?.role || "member",
      };
    });

    res.json(result);
  } catch (error) {
    handleError(res, error, "Failed to fetch workspace members");
  }
});

app.post("/api/workspaces/:id/invite", async (req, res) => {
  try {
    const { email } = req.body;
    const workspaceId = validateObjectId(req.params.id, "Workspace ID");

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find user by email
    const users = db.collection("users");
    const user = await users.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User with this email not found" });
    }

    const userId = user._id;

    // Check if already a member
    const workspace_members = db.collection("workspace_members");
    const existingMember = await workspace_members.findOne({
      workspace_id: workspaceId,
      user_id: userId,
    });

    if (existingMember) {
      return res.status(400).json({ error: "User is already a member" });
    }

    // Add user to workspace
    await workspace_members.insertOne({
      workspace_id: workspaceId,
      user_id: userId,
      role: "member",
      joined_at: new Date(),
    });

    // Create notification
    const notifications = db.collection("notifications");
    await notifications.insertOne({
      user_id: userId,
      type: "invite",
      message: "You were added to a new workspace",
      is_read: false,
      created_at: new Date(),
    });

    res.json({ success: true, message: "Member added successfully" });
  } catch (error) {
    handleError(res, error, "Failed to invite member");
  }
});

// --- PROJECT ROUTES ---

app.get("/api/projects/workspace/:workspaceId", async (req, res) => {
  try {
    const workspaceId = validateObjectId(
      req.params.workspaceId,
      "Workspace ID",
    );

    const projects = db.collection("projects");
    const tasks = db.collection("tasks");

    const projectList = await projects
      .find({ workspace_id: workspaceId })
      .sort({ created_at: -1 })
      .toArray();

    if (projectList.length === 0) {
      return res.json([]);
    }

    // Get task counts for each project
    const projectIds = projectList.map((p) => p._id);
    const taskCounts = await tasks
      .aggregate([
        { $match: { project_id: { $in: projectIds } } },
        {
          $group: {
            _id: "$project_id",
            task_count: { $sum: 1 },
            completed_count: {
              $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] },
            },
          },
        },
      ])
      .toArray();

    const result = projectList.map((project) => {
      const counts = taskCounts.find((tc) => tc._id.equals(project._id));
      return {
        id: project._id.toString(),
        name: project.name,
        description: project.description,
        color: project.color,
        workspace_id: project.workspace_id.toString(),
        task_count: counts?.task_count || 0,
        completed_count: counts?.completed_count || 0,
        created_at: project.created_at,
        updated_at: project.updated_at,
      };
    });

    res.json(result);
  } catch (error) {
    handleError(res, error, "Failed to fetch projects");
  }
});

app.get("/api/projects/:id", async (req, res) => {
  try {
    const projectId = validateObjectId(req.params.id, "Project ID");
    const projects = db.collection("projects");

    const project = await projects.findOne({ _id: projectId });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({
      id: project._id.toString(),
      name: project.name,
      description: project.description,
      color: project.color,
      workspace_id: project.workspace_id.toString(),
      created_at: project.created_at,
      updated_at: project.updated_at,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch project");
  }
});

app.post("/api/projects", async (req, res) => {
  try {
    const { name, description, color, workspaceId } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Project name is required" });
    }

    if (!workspaceId) {
      return res.status(400).json({ error: "Workspace ID is required" });
    }

    const workspaceObjId = validateObjectId(workspaceId, "Workspace ID");

    const projects = db.collection("projects");
    const result = await projects.insertOne({
      name,
      description: description || "",
      color: color || "#3B82F6",
      workspace_id: workspaceObjId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.json({
      id: result.insertedId.toString(),
      name,
      description: description || "",
      color: color || "#3B82F6",
      workspace_id: workspaceId,
      task_count: 0,
      completed_count: 0,
    });
  } catch (error) {
    handleError(res, error, "Failed to create project");
  }
});

app.delete("/api/projects/:id", async (req, res) => {
  try {
    const projectId = validateObjectId(req.params.id, "Project ID");

    const projects = db.collection("projects");
    const result = await projects.deleteOne({ _id: projectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Delete all tasks in this project
    await db.collection("tasks").deleteMany({ project_id: projectId });

    res.json({ message: "Project purged" });
  } catch (error) {
    handleError(res, error, "Failed to delete project");
  }
});

// --- TASK ROUTES ---

app.get("/api/tasks", async (req, res) => {
  try {
    const { projectId } = req.query;

    const tasks = db.collection("tasks");
    const users = db.collection("users");

    let query = {};
    if (projectId) {
      query.project_id = validateObjectId(projectId, "Project ID");
    }

    const taskList = await tasks.find(query).sort({ created_at: -1 }).toArray();

    // Get assignee names
    const assigneeIds = taskList
      .filter((t) => t.assignee_id)
      .map((t) => t.assignee_id);

    let assignees = [];
    if (assigneeIds.length > 0) {
      assignees = await users
        .find({ _id: { $in: assigneeIds } }, { projection: { username: 1 } })
        .toArray();
    }

    const result = taskList.map((task) => {
      const assignee = assignees.find(
        (a) => task.assignee_id && a._id.equals(task.assignee_id),
      );
      return {
        id: task._id.toString(),
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
        project_id: task.project_id.toString(),
        assignee_id: task.assignee_id?.toString() || null,
        assignee_name: assignee?.username || null,
        created_by: task.created_by.toString(),
        completed: task.completed,
        created_at: task.created_at,
        updated_at: task.updated_at,
      };
    });

    res.json(result);
  } catch (error) {
    handleError(res, error, "Failed to fetch tasks");
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description, status, priority, due_date, project_id } =
      req.body;
    const userId = extractUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: "Task title is required" });
    }

    if (!project_id) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const projectObjId = validateObjectId(project_id, "Project ID");

    const tasks = db.collection("tasks");
    const result = await tasks.insertOne({
      title,
      description: description || "",
      status: status || "todo",
      priority: priority || "medium",
      due_date: due_date ? new Date(due_date) : null,
      project_id: projectObjId,
      assignee_id: null,
      created_by: new ObjectId(userId),
      completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.json({
      id: result.insertedId.toString(),
      title,
      description: description || "",
      status: status || "todo",
      priority: priority || "medium",
      due_date,
      project_id,
      created_by: userId,
      completed: false,
    });
  } catch (error) {
    handleError(res, error, "Failed to create task");
  }
});

app.put("/api/tasks/:id", async (req, res) => {
  try {
    const taskId = validateObjectId(req.params.id, "Task ID");
    const { title, description, status, priority, due_date, completed } =
      req.body;

    const updateFields = { updated_at: new Date() };

    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (status !== undefined) updateFields.status = status;
    if (priority !== undefined) updateFields.priority = priority;
    if (due_date !== undefined)
      updateFields.due_date = due_date ? new Date(due_date) : null;
    if (completed !== undefined) {
      updateFields.completed = completed;
      if (completed) {
        updateFields.status = "done";
      }
    }

    const tasks = db.collection("tasks");
    const result = await tasks.updateOne(
      { _id: taskId },
      { $set: updateFields },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error, "Failed to update task");
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const taskId = validateObjectId(req.params.id, "Task ID");

    const tasks = db.collection("tasks");
    const result = await tasks.deleteOne({ _id: taskId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task purged from nexus" });
  } catch (error) {
    handleError(res, error, "Failed to delete task");
  }
});

// --- NOTIFICATION ROUTES ---

app.get("/api/notifications", async (req, res) => {
  try {
    const userId = extractUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const notifications = db.collection("notifications");
    const notificationList = await notifications
      .find({ user_id: new ObjectId(userId) })
      .sort({ created_at: -1 })
      .limit(20)
      .toArray();

    const result = notificationList.map((notif) => ({
      id: notif._id.toString(),
      user_id: notif.user_id.toString(),
      type: notif.type,
      message: notif.message,
      is_read: notif.is_read,
      created_at: notif.created_at,
    }));

    res.json(result);
  } catch (error) {
    handleError(res, error, "Failed to fetch notifications");
  }
});

app.put("/api/notifications/:id/read", async (req, res) => {
  try {
    const notificationId = validateObjectId(req.params.id, "Notification ID");

    const notifications = db.collection("notifications");
    const result = await notifications.updateOne(
      { _id: notificationId },
      { $set: { is_read: true } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error, "Failed to mark notification as read");
  }
});

app.put("/api/notifications/read-all", async (req, res) => {
  try {
    const userId = extractUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const notifications = db.collection("notifications");
    await notifications.updateMany(
      { user_id: new ObjectId(userId) },
      { $set: { is_read: true } },
    );

    res.json({ success: true });
  } catch (error) {
    handleError(res, error, "Failed to mark all notifications as read");
  }
});

// --- ANALYTICS ROUTES ---

app.get("/api/analytics/dashboard", async (req, res) => {
  try {
    const userId = extractUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const workspace_members = db.collection("workspace_members");
    const workspaces = db.collection("workspaces");
    const projects = db.collection("projects");
    const tasks = db.collection("tasks");

    // Get user's workspaces
    const memberships = await workspace_members
      .find({ user_id: new ObjectId(userId) })
      .toArray();

    const workspaceIds = memberships.map((m) => m.workspace_id);

    if (workspaceIds.length === 0) {
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
        weeklyProgress: [],
      });
    }

    // Get projects in these workspaces
    const projectList = await projects
      .find({ workspace_id: { $in: workspaceIds } })
      .toArray();

    const projectIds = projectList.map((p) => p._id);

    if (projectIds.length === 0) {
      return res.json({
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        totalProjects: 0,
        totalWorkspaces: workspaceIds.length,
        recentActivity: [],
        tasksByStatus: [],
        tasksByPriority: [],
        weeklyProgress: [],
      });
    }

    // General stats
    const now = new Date();
    const allTasks = await tasks
      .find({ project_id: { $in: projectIds } })
      .toArray();

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === "done").length;
    const inProgressTasks = allTasks.filter(
      (t) => t.status === "in_progress",
    ).length;
    const overdueTasks = allTasks.filter(
      (t) => t.due_date && new Date(t.due_date) < now && t.status !== "done",
    ).length;

    // Tasks by status
    const statusCounts = {};
    allTasks.forEach((task) => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });
    const tasksByStatus = Object.entries(statusCounts).map(
      ([status, count]) => ({
        status,
        count,
      }),
    );

    // Tasks by priority
    const priorityCounts = {};
    allTasks.forEach((task) => {
      priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
    });
    const tasksByPriority = Object.entries(priorityCounts).map(
      ([priority, count]) => ({
        priority,
        count,
      }),
    );

    // Weekly progress (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const completedTasksLastWeek = allTasks.filter(
      (t) => t.status === "done" && new Date(t.updated_at) >= sevenDaysAgo,
    );

    const weeklyProgressMap = {};
    completedTasksLastWeek.forEach((task) => {
      const dateKey = task.updated_at.toISOString().split("T")[0];
      weeklyProgressMap[dateKey] = (weeklyProgressMap[dateKey] || 0) + 1;
    });

    const weeklyProgress = Object.entries(weeklyProgressMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      totalProjects: projectList.length,
      totalWorkspaces: workspaceIds.length,
      recentActivity: [],
      tasksByStatus,
      tasksByPriority,
      weeklyProgress,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch analytics");
  }
});

// --- SERVER STARTUP ---

connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`✓ Nexus stability layer active on port ${PORT}`);
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n✗ Shutting down gracefully...");
  if (client) {
    await client.close();
    console.log("✓ MongoDB connection closed");
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n✗ Shutting down gracefully...");
  if (client) {
    await client.close();
    console.log("✓ MongoDB connection closed");
  }
  process.exit(0);
});
