import { useState, useRef } from 'react';
import styles from '../ComponentStyles/createListing.module.css';
import { listingService } from '../services/api';
import { handleError, handleSuccess } from '../utils';

const CATEGORIES = [
  'Electronics',
  'Furniture',
  'Vehicles',
  'Services',
  'Clothing & Fashion',
  'Books & Stationery',
  'Home & Garden',
  'Other'
];

function CreateListing({ onListingCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Electronics',
    price: '',
    description: ''
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 10) {
      return handleError("Maximum 10 images allowed!");
    }

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'Electronics',
      price: '',
      description: ''
    });
    previews.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviews([]);
  };

  const handleClose = () => {
    resetForm();
    setIsOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { title, category, price, description } = formData;
    if (!title.trim() || !category || !price) {
      return handleError("Title, Category, and Price are required!");
    }

    if (isNaN(price) || Number(price) <= 0) {
      return handleError("Please enter a valid price amount");
    }

    try {
      setIsSubmitting(true);
      const data = new FormData();
      data.append('title', title.trim());
      data.append('category', category);
      data.append('price', price);
      data.append('description', description.trim());

      selectedFiles.forEach(file => {
        data.append('images', file);
      });

      const result = await listingService.createListing(data);

      if (result.success) {
        handleSuccess("Listing posted successfully!");
        handleClose();
        if (onListingCreated) {
          onListingCreated(result.listing);
        }
      } else {
        handleError(result.message || "Failed to create listing");
      }
    } catch (err) {
      console.error(err);
      handleError("Network error while creating listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button className={styles.addBtn} onClick={() => setIsOpen(true)}>
        <span>+</span> Post New Listing
      </button>

      {isOpen && (
        <div className={styles.modalOverlay} onClick={handleClose}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <h2>Post a New Listing</h2>
              <button className={styles.closeBtn} onClick={handleClose}>&times;</button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.formBody}>
              <div className={styles.fieldGroup}>
                <label>Title *</label>
                <input
                  className={styles.input}
                  type="text"
                  name="title"
                  placeholder="e.g. Wooden Dining Table, iPhone 12..."
                  value={formData.title}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>

              <div className={styles.fieldGroup}>
                <label>Category *</label>
                <select
                  className={styles.select}
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label>Price (₹) *</label>
                <input
                  className={styles.input}
                  type="number"
                  name="price"
                  placeholder="Price in INR"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label>Description</label>
                <textarea
                  className={styles.textarea}
                  name="description"
                  placeholder="Describe the condition, age, features..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              {/* Image Dropzone */}
              <div className={styles.fieldGroup}>
                <label>Photos (Max 10)</label>
                <div
                  className={styles.dropzone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <p>📸 Click to select photos from your device</p>
                  <input
                    ref={fileInputRef}
                    className={styles.fileInput}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                  />
                </div>

                {previews.length > 0 && (
                  <div className={styles.previewGrid}>
                    {previews.map((src, index) => (
                      <div key={index} className={styles.previewCard}>
                        <img src={src} alt={`preview ${index}`} />
                        <button
                          type="button"
                          className={styles.removeImgBtn}
                          onClick={() => handleRemoveImage(index)}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Publishing..." : "Post Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default CreateListing;
