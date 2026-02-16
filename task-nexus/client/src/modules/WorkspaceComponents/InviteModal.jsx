import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, UserPlus, Mail, Shield, User } from "lucide-react";
import { useNotification } from "../context/NotificationContext";

const API_BASE = "https://code-relay-foobar.onrender.com/api";

export default function InviteModal({ isOpen, onClose, workspaceId }) {
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useNotification();

  useEffect(() => {
    if (isOpen && workspaceId) {
      const token = localStorage.getItem("nexus_token");
      axios
        .get(`${API_BASE}/workspaces/${workspaceId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setMembers(res.data))
        .catch(console.error);
    }
  }, [isOpen, workspaceId]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("nexus_token");

    try {
      await axios.post(
        `${API_BASE}/workspaces/${workspaceId}/invite`,
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("User added successfully!", "success");
      setEmail("");
      const res = await axios.get(
        `${API_BASE}/workspaces/${workspaceId}/members`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMembers(res.data);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to invite user", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        {/* --- CHANGED HERE ---
            Backdrop: Changed background from rgba(0,0,0,0.6) to transparent.
            I also commented out backdropFilter. Uncomment it if you still want the blur without the darkness.
        */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "transparent", 
            // backdropFilter: "blur(4px)", 
            pointerEvents: "auto",
          }}
          onClick={onClose}
        />

        {/* Modal Card */}
        <div
          className="invite-modal glass"
          style={{
            position: "relative",
            width: "90%",
            maxWidth: "500px",
            background: "hsl(var(--card))",
            borderRadius: "var(--radius-xl)",
            // Kept the shadow on the modal itself for depth. 
            // If you meant remove this too, change to boxShadow: 'none'
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            pointerEvents: "auto",
            animation: "modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div
            className="notification-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "1.5rem",
              borderBottom: "1px solid hsl(var(--border))",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Manage Team</h3>
            <button
              className="btn-icon-sm close-btn"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "hsl(var(--text))",
              }}
            >
              <X size={24} />
            </button>
          </div>

          <div className="modal-content" style={{ padding: "1.5rem" }}>
            {/* Invite Form Section */}
            <div
              className="invite-section"
              style={{
                background: "hsla(var(--primary), 0.05)",
                padding: "1.25rem",
                borderRadius: "var(--radius)",
                marginBottom: "1.5rem",
              }}
            >
              <label
                className="invite-label"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "600",
                }}
              >
                Add New Member
              </label>
              <form
                onSubmit={handleInvite}
                className="invite-row"
                style={{ display: "flex", gap: "0.5rem" }}
              >
                <div
                  className="input-with-icon"
                  style={{ flex: 1, position: "relative" }}
                >
                  <Mail
                    size={16}
                    className="input-icon"
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      opacity: 0.5,
                    }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem 0.75rem 2.5rem",
                      borderRadius: "var(--radius)",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "var(--radius)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <UserPlus size={18} />
                  {loading ? "..." : "Add"}
                </button>
              </form>
            </div>

            {/* Member List Section */}
            <div
              className="member-list-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1rem",
                fontSize: "0.85rem",
                opacity: 0.7,
              }}
            >
              <span>TEAM MEMBERS</span>
              <span>{members.length} ACTIVE</span>
            </div>

            <div
              className="member-list-container"
              style={{
                maxHeight: "250px",
                overflowY: "auto",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            >
              {members.map((member) => (
                <div
                  key={member.id}
                  className="member-item"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid hsl(var(--border))",
                    alignItems: "center",
                  }}
                >
                  <div
                    className="member-info"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <div
                      className="member-avatar"
                      style={{
                        width: "32px",
                        height: "32px",
                        background:
                          "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--purple)))",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                      }}
                    >
                      {member.username[0].toUpperCase()}
                    </div>
                    <div
                      className="member-text"
                      style={{ display: "flex", flexDirection: "column" }}
                    >
                      <span
                        className="member-name"
                        style={{ fontWeight: "600", fontSize: "0.9rem" }}
                      >
                        {member.username}
                      </span>
                      <span
                        className="member-email"
                        style={{ fontSize: "0.75rem", opacity: 0.6 }}
                      >
                        {member.email}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`role-badge ${
                      member.role === "owner" ? "owner" : ""
                    }`}
                    style={{
                      fontSize: "0.7rem",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "10px",
                      background:
                        member.role === "owner"
                          ? "hsla(var(--primary), 0.1)"
                          : "hsla(var(--text), 0.05)",
                      color:
                        member.role === "owner"
                          ? "hsl(var(--primary))"
                          : "inherit",
                    }}
                  >
                    {member.role === "owner" ? (
                      <Shield size={10} style={{ marginRight: "4px" }} />
                    ) : (
                      <User size={10} style={{ marginRight: "4px" }} />
                    )}
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `,
        }}
      />
    </>
  );
}