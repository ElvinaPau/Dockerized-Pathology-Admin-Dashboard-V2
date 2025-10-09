import React, { useState, useEffect } from "react";
import HomePageHeader from "../assets/HomePageHeader";
import CatCard from "../assets/CatCard";
import ProfileCard from "../assets/ProfileCard";
import { GrDocumentTest } from "react-icons/gr";
import { FaUsers } from "react-icons/fa";
import { GrTest } from "react-icons/gr";
import "../css/AdminHomePage.css";
import StatCard from "../assets/StatCard";
import NewCatInput from "../assets/NewCatInput";
import { useNavigation } from "../context/NavigationContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function AdminHomePage() {
  const { isNavExpanded } = useNavigation();
  const navigate = useNavigate();
  const [showInput, setShowInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [adminCount, setAdminCount] = useState(0);
  const [categories, setCategories] = useState([]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/categories");
        setCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err.message);
      }
    };
    fetchCategories();
  }, []);

  // Fetch admin count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/admins/count");
        setAdminCount(res.data.total);
      } catch (err) {
        console.error("Error fetching admin count:", err.message);
      }
    };
    fetchCount();
  }, []);

  // Add category
  const handleSubmit = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const res = await axios.post("http://localhost:5001/api/categories", {
        name: newCategoryName,
      });
      setCategories([...categories, res.data]);
      setNewCategoryName("");
      setShowInput(false);
    } catch (err) {
      console.error("Error adding category:", err.message);
    }
  };

  // Delete category
  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;

    try {
      await axios.delete(`http://localhost:5001/api/categories/${id}`);
      setCategories(categories.filter((cat) => cat.id !== id));
    } catch (err) {
      console.error("Error deleting category:", err.message);
    }
  };

  return (
    <div className={`home-page-content ${isNavExpanded ? "Nav-Expanded" : ""}`}>
      <HomePageHeader />

      {/* Overview */}
      <div className="home-title">Overview</div>
      <div className="overview-section">
        <StatCard
          title="Total Tests"
          count={128}
          icon={<GrDocumentTest />}
          lastUpdated="1 Jan 2025"
        />
        <StatCard
          title="Total Admin"
          count={adminCount}
          icon={<FaUsers />}
          lastUpdated={new Date().toLocaleDateString()}
          onClick={() => navigate("/admin-requests")}
        />
        <ProfileCard />
      </div>

      {/* Categories */}
      <div className="categories-section">
        {categories.map((cat) => (
          <CatCard
            key={cat.id}
            title={cat.name}
            count={128}
            icon={<GrTest />}
            lastUpdated="1 Jan 2025"
            onClick={() => navigate(`/categories/${cat.id}`)} // 👈 navigate by ID
            onDelete={() => handleDeleteCategory(cat.id)}
          />
        ))}

        {/* Add New Category */}
        {showInput && (
          <NewCatInput
            title="Add New Category"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onSubmit={handleSubmit}
            onCancel={() => setShowInput(false)}
            placeholder="Enter category name"
          />
        )}

        <div className="cat-card add-category">
          <h4>Add New Category</h4>
          <button className="create-btn" onClick={() => setShowInput(true)}>
            + Create New
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminHomePage;