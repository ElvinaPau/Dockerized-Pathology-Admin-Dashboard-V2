import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import HomePageHeader from "../assets/HomePageHeader";
import { useNavigation } from "../context/NavigationContext";
import axios from "axios";
import "../css/PrevTestInfoPage.css";

// Helper function to strip HTML tags
function stripHtml(html) {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

// Recursive helper to strip HTML from all string values in an object
function sanitizeData(data) {
  if (typeof data === "string") return stripHtml(data);
  if (Array.isArray(data)) return data.map(sanitizeData);
  if (typeof data === "object" && data !== null) {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, sanitizeData(value)])
    );
  }
  return data; // numbers, booleans, null stay as-is
}

function PrevTestInfoPage() {
  const { id } = useParams();
  const { isNavExpanded } = useNavigation();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5001/api/tests/${id}?includeinfos=true`
        );
        setTest(res.data);
      } catch (err) {
        console.error("Error fetching test:", err.message);
        setTest(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!test) return <p>Test not found</p>;

  return (
    <div className={`home-page-content ${isNavExpanded ? "Nav-Expanded" : ""}`}>
      <HomePageHeader />

      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="prev-page-title">{test.name || "Untitled Test"}</div>

      <div className="test-info-details">
        {test.infos && test.infos.length > 0 ? (
          test.infos.map((info) => (
            <div key={info.id}>
              {info.extraData && (
                <div className="extra-data">
                  {info.extraData.title && (
                    <h1>{sanitizeData(info.extraData.title)}</h1>
                  )}
                  {info.extraData.description && (
  <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: info.extraData.description }} />
)}

                  {info.extraData.image && (
                    <img
                      src={info.extraData.image}
                      alt={sanitizeData(info.extraData.title || "")}
                    />
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No test infos available</p>
        )}
      </div>
    </div>
  );
}

export default PrevTestInfoPage;
