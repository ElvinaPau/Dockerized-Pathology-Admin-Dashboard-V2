import React, { useState, useEffect } from "react";
import "../css/ContainerForm.css";
import RichTextEditor from "./RichTextEditor";
import { IoIosRemoveCircleOutline, IoIosRemoveCircle } from "react-icons/io";
import { ImageUploader } from "./ImageUploader";

function ContainerForm({ fields = {}, setFields, onRemove, isFirst }) {
  const [formData, setFormData] = useState({
    title: fields.title || "",
    description: fields.description || "",
    image: fields.image || null,
  });

  const [isHover, setIsHover] = useState(false);

  useEffect(() => {
    // Sync when parent changes (e.g., when editing existing data)
    setFormData({
      title: fields.title || "",
      description: fields.description || "",
      image: fields.image || null,
    });
  }, [fields]);

  const handleChange = (key, value) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    setFields(updated); // Send data to parent
  };

  return (
    <div className="add-form-container">
      <div className="form-header">
        <h2>Container</h2>

        {!isFirst && (
          <button
            onClick={onRemove}
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
          >
            {isHover ? (
              <IoIosRemoveCircle size={22} />
            ) : (
              <IoIosRemoveCircleOutline size={22} />
            )}
          </button>
        )}
      </div>

      <div className="add-form-group">
        <label>Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
        />
      </div>

      <div className="add-form-group">
        <label>Image</label>
        <ImageUploader
          value={formData.image}
          onChange={(val) => handleChange("image", val)}
        />
      </div>

      <div>
        <label>Description</label>
        <RichTextEditor
          value={formData.description}
          onChange={(val) => handleChange("description", val)}
        />
      </div>
    </div>
  );
}

export default ContainerForm;