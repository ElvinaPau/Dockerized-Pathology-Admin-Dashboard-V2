import React, { useEffect, useState } from "react";
import HomePageHeader from "../assets/HomePageHeader";
import { useNavigation } from "../context/NavigationContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/AdminPreviewPage.css";

function AdminPreviewPage() {
  const { isNavExpanded } = useNavigation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [forms, setForms] = useState([]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/categories");
        const sorted = res.data.sort(
          (a, b) => (a.position ?? a.id) - (b.position ?? b.id)
        );
        setCategories(sorted);
      } catch (err) {
        console.error("Error fetching categories:", err.message);
      }
    };
    fetchCategories();
  }, []);

  // Fetch forms
  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/forms");
        setForms(res.data);
      } catch (err) {
        console.error("Error fetching forms:", err.message);
      }
    };
    fetchForms();
  }, []);

  // Combine normal categories + fixed FORM category
  const allCategories = [
    ...categories,
    {
      id: "fixed-form",
      name: "FORM",
      testCount: forms.length,
      fixed: true,
    },
  ];

  return (
    <div className={`home-page-content ${isNavExpanded ? "Nav-Expanded" : ""}`}>
      <HomePageHeader />

      <div className="prev-page-title">Preview</div>

      <div className="prev-header">
        {/* Categories vertical list */}
        <div className="prev-categories-list">
          {allCategories.map((cat) => (
            <div
              key={cat.id}
              className="prev-category-card"
              onClick={() => navigate(`/prevtests/${cat.id}`)}
            >
              <h4 className="prev-category-title">{cat.name}</h4>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminPreviewPage;
