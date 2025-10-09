import React, { useState, useEffect, useRef } from "react";
import "../css/AddTabForm.css";
import "../css/AdminHomePage.css";
import BasicForm from "./BasicForm";
import LabTestForm from "./LabTestForm";
import ContainerForm from "./ContainerForm";
import HomePageHeader from "../assets/HomePageHeader";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useParams, useNavigate } from "react-router-dom";
import { useNavigation } from "../context/NavigationContext";
import axios from "axios";

const uid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID()) ||
  Math.random().toString(36).slice(2, 9);

function reorder(list, startIndex, endIndex) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

function getFormComponent(type) {
  switch (type) {
    case "Basic":
      return BasicForm;
    case "Lab Test":
      return LabTestForm;
    case "Container":
      return ContainerForm;
    default:
      return BasicForm;
  }
}

function AddTabForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isNavExpanded } = useNavigation();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    infoType: "",
    basics: [{ id: uid(), type: "", fields: [] }],
  });

  // Ref for the most recently added form
  const lastFormRef = useRef(null);

  // Fetch category name
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5001/api/categories/${id}`
        );
        setFormData((prev) => ({ ...prev, category: res.data.name }));
      } catch (err) {
        console.error("Error fetching category:", err);
      }
    };
    fetchCategory();
  }, [id]);

  // Add new Basic form (with scroll + highlight)
  const addBasicForm = () => {
    if (!formData.infoType) {
      alert("Please select an Info Type first.");
      return;
    }

    const newForm = { id: uid(), type: "Basic", fields: [] };

    setFormData((prev) => ({
      ...prev,
      basics: [...prev.basics, newForm],
    }));

    // Wait for new form to render
    setTimeout(() => {
      // Scroll into view
      lastFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // Add highlight animation
      if (lastFormRef.current) {
        lastFormRef.current.classList.add("newly-added");
        setTimeout(
          () => lastFormRef.current?.classList.remove("newly-added"),
          1200
        );
      }
    }, 100);
  };

  // Handle drag reorder
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    // Prevent first block from being dragged or swapped
    if (result.source.index === 0 || result.destination.index === 0) return;

    setFormData((prev) => {
      const reordered = reorder(
        prev.basics,
        result.source.index,
        result.destination.index
      );
      return { ...prev, basics: reordered };
    });
  };

  return (
    <div className={`home-page-content ${isNavExpanded ? "Nav-Expanded" : ""}`}>
      <div className="form-page-wrapper">
        <HomePageHeader />

        <button
          className="back-btn"
          onClick={() => navigate(`/categories/${id}`)}
        >
          ← Back
        </button>

        <div className="table-title">
          <div className="title-display">
            <div>Add New Test / Tab</div>
          </div>
        </div>

        <div className="add-form-container">
          <h2>Test / Tab Information</h2>

          <div className="add-form-group">
            <label className="required">Test / Tab Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="side-by-side">
            {/* Category */}
            <div className="add-form-group">
              <label>Category</label>
              <input
                type="text"
                value={formData.category}
                readOnly
                className="readonly-input"
              />
            </div>

            {/* Info Type */}
            <div className="add-form-group">
              <label className="required">Info Type</label>
              <select
                value={formData.infoType}
                onChange={(e) => {
                  const newType = e.target.value;
                  setFormData((prev) => {
                    const updatedBasics = prev.basics.map((g, idx) =>
                      idx === 0 ? { ...g, type: newType } : g
                    );
                    return {
                      ...prev,
                      infoType: newType,
                      basics: updatedBasics,
                    };
                  });
                }}
                required
              >
                <option value="">Select</option>
                <option value="Basic">Basic</option>
                <option value="Lab Test">Lab Test</option>
                <option value="Container">Container</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Forms Section */}
        {(formData.infoType === "Basic" ||
          formData.infoType === "Lab Test" ||
          formData.infoType === "Container") && (
          <div className="basic-form-section">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="basics">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {formData.basics.map((group, index) => {
                      const FormComponent =
                        index === 0
                          ? getFormComponent(group.type)
                          : getFormComponent("Basic");

                      // First block (Info Type) is NOT draggable
                      if (index === 0) {
                        return (
                          <div
                            key={group.id}
                            className="draggable-form fixed-first"
                          >
                            <FormComponent
                              basics={group.fields}
                              setBasics={(updated) => {
                                setFormData((prev) => {
                                  const newBasics = prev.basics.map((b, i) =>
                                    i === index ? { ...b, fields: updated } : b
                                  );
                                  return { ...prev, basics: newBasics };
                                });
                              }}
                              isFirst
                            />
                          </div>
                        );
                      }

                      // All other blocks are draggable
                      return (
                        <Draggable
                          key={group.id}
                          draggableId={String(group.id)}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={
                                index === formData.basics.length - 1
                                  ? (el) => {
                                      lastFormRef.current = el;
                                      provided.innerRef(el);
                                    }
                                  : provided.innerRef
                              }
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="draggable-form"
                            >
                              <FormComponent
                                basics={group.fields}
                                setBasics={(updated) => {
                                  setFormData((prev) => {
                                    const newBasics = prev.basics.map((b, i) =>
                                      i === index
                                        ? { ...b, fields: updated }
                                        : b
                                    );
                                    return { ...prev, basics: newBasics };
                                  });
                                }}
                                onRemove={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    basics: prev.basics.filter(
                                      (_, i) => i !== index
                                    ),
                                  }));
                                }}
                              />
                            </div>
                          )}
                        </Draggable>
                      );
                    })}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <button
              type="button"
              className="add-form-btn"
              onClick={addBasicForm}
            >
              + Add Another Basic Form
            </button>
            <button
              type="button"
              className="save-all-btn"
            >
              💾 Save All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddTabForm;
