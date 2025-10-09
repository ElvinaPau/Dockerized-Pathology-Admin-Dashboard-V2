import React, { useEffect, useState } from "react";
import "../css/ProfileCard.css";
import { useAuth } from "../context/AuthContext";
import { FaUser } from "react-icons/fa";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:5001";

function ProfileCard() {
  const { admin, token, updateAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    department: "",
    email: "",
  });

  // preload when admin info available
  useEffect(() => {
    if (admin) setFormData(admin);
  }, [admin]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await axios.put(
        `http://localhost:5001/api/admins/${admin.id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateAdmin(formData);
      setShowModal(false);
    } catch (err) {
      console.error("Error updating admin:", err);
    }
  };

  if (!admin) return <p>Loading...</p>;

  return (
    <>
      {/* Small card (clickable) */}
      <div className="profile-card" onClick={() => setShowModal(true)}>
        <h3 className="profile-title">Profile</h3>
        <div className="profile-content">
          <div className="profile-avatar">
            <FaUser />
          </div>
          <div className="profile-details">
            <div className="profile-item">
              <span className="profile-label">Name:</span>
              <span className="profile-value">{admin.full_name}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Department:</span>
              <span className="profile-value">{admin.department}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Email:</span>
              <span className="profile-value">{admin.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal (center screen) */}
      {showModal && (
        <div
          className="profile-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Profile</h3>

            {/* Wrap inputs in a form */}
            <form
              onSubmit={(e) => {
                e.preventDefault(); // prevent page reload
                handleSave();
              }}
            >
              <div className="profile-item">
                <span className="profile-label">Name:</span>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="profile-item">
                <span className="profile-label">Department:</span>
                <select
                  id="department"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  required
                >
                  <option value="">Select</option>
                  <option value="Microbiology">Microbiology</option>
                  <option value="Histopathology">Histopathology</option>
                  <option value="Cytology">Cytology</option>
                  <option value="Integrated">Integrated</option>
                  <option value="Chemical Pathology">Chemical Pathology</option>
                  <option value="Haematology">Haematology</option>
                </select>
              </div>

              <div className="profile-item">
                <span className="profile-label">Email:</span>
                <span className="profile-value">{formData.email}</span>
              </div>

              <div className="profile-actions">
                <button type="submit">Save</button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(admin);
                    setShowModal(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default ProfileCard;
