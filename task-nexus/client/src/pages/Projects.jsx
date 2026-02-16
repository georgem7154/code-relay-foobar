import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FolderKanban, Plus, Trash2, ArrowLeft, Users } from "lucide-react";
import InviteModal from "../modules/WorkspaceComponents/InviteModal";

const API_BASE = "http://localhost:5000/api";

export default function Projects() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("nexus_token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      axios.get(`${API_BASE}/workspaces/${workspaceId}`, { headers }),
      axios.get(`${API_BASE}/projects/workspace/${workspaceId}`, { headers }),
    ])
      .then(([wsRes, projRes]) => {
        setWorkspace(wsRes.data);
        setProjects(projRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("nexus_token");

    try {
      const response = await axios.post(
        `${API_BASE}/projects`,
        { name, description, color, workspaceId: parseInt(workspaceId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProjects([...projects, response.data]);
      setName("");
      setDescription("");
      setShowForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("nexus_token");
    try {
      await axios.delete(`${API_BASE}/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="page-loading" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div className="spinner"></div>
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    /* --- CENTERED CONTAINER --- */
    <div 
      className="page fade-in" 
      style={{ 
        maxWidth: "1100px", 
        margin: "0 auto", 
        padding: "2rem",
        minHeight: "100vh" 
      }}
    >
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <button
            className="btn-ghost back-btn"
            onClick={() => navigate("/workspaces")}
          >
            <ArrowLeft size={18} /> Back to Workspaces
          </button>
          <h2 style={{ marginTop: "0.5rem" }}>{workspace?.name || "Workspace"}</h2>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn-ghost" onClick={() => setShowInviteModal(true)}>
            <Users size={18} /> Members
          </button>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={18} /> New Project
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="create-form glass fade-in" style={{ marginBottom: "2rem" }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            required
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />
          <div className="form-actions">
            <button type="submit" className="btn-primary">Create</button>
            <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="project-grid">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="project-card glass"
            onClick={() => navigate(`/projects/${proj.id}`)}
            style={{ borderLeft: `4px solid ${proj.color}` }}
          >
            <div className="project-card-header">
              <FolderKanban size={20} style={{ color: proj.color }} />
              <button
                className="btn-icon-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(proj.id);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <h3>{proj.name}</h3>
            <p className="text-muted">{proj.description || "No description"}</p>
            <div className="project-card-footer">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${proj.task_count ? (proj.completed_count / proj.task_count) * 100 : 0}%`,
                    backgroundColor: proj.color,
                  }}
                ></div>
              </div>
              <span className="text-muted text-sm">
                {proj.completed_count}/{proj.task_count} tasks
              </span>
            </div>
          </div>
        ))}
      </div>

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        workspaceId={workspaceId}
      />
    </div>
  );
}