import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/TestTable.css";

const FormTable = () => {
  const [forms, setForms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

  // ✅ Fetch all forms under "FORM" category
  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/forms`);
        setForms(res.data);
      } catch (err) {
        console.error("Error fetching forms:", err.message);
      }
    };
    fetchForms();
  }, []);

  // ✅ Filter by search
  const filteredForms = forms.filter((f) =>
    f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.field.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="table-container">
      {/* Header Row */}
      <div className="tabs-row">
        <h3 style={{ margin: 0 }}>Forms</h3>
        <button
          className="add-btn"
          onClick={() => (window.location.href = "/form/create")}
        >
          + Add Form
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search forms..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Scrollable Table */}
      <div className="table-scroll">
        <table>
          <colgroup>
            <col style={{ width: "5%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "40%" }} />
            <col style={{ width: "30%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>No</th>
              <th>Field</th>
              <th>Form Title</th>
              <th>Form (Link)</th>
            </tr>
          </thead>
          <tbody>
            {filteredForms.length > 0 ? (
              filteredForms.map((form, index) => (
                <tr key={form.id}>
                  <td>{index + 1}</td>
                  <td>{form.field}</td>
                  <td>{form.title}</td>
                  <td>
                    {form.form_url ? (
                      <a
                        href={form.form_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "blue", textDecoration: "underline" }}
                      >
                        {form.link_text || "Open Form"}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>No forms found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FormTable;
