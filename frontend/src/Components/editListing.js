import { useState, useRef, useEffect } from 'react';
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

function EditListing({ listing, isOpen, onClose, onListingUpdated }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Electronics',
    price: '',
    description: ''
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);

  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title || '',
        category: listing.category || 'Electronics',
        price: listing.price || '',
        description: listing.description || ''
      });
      setExistingImages(listing.images || []);
      setNewFiles([]);
      setNewPreviews([]);
    }
  }, [listing]);

  if (!isOpen || !listing) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (existingImages.length + newFiles.length + files.length > 10) {
      return handleError("Maximum 10 images allowed!");
    }

    setNewFiles(prev => [...prev, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setNewPreviews(prev => [...prev, ...previews]);
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index) => {
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { title, category, price, description } = formData;
    if (!title.trim() || !category || !price) {
      return handleError("Title, Category, and Price are required!");
    }

    try {
      setIsSubmitting(true);
      const data = new FormData();
      data.append('title', title.trim());
      data.append('category', category);
      data.append('price', price);
      data.append('description', description.trim());

      existingImages.forEach(img => {
        data.append('existingImages', img);
      });

      newFiles.forEach(file => {
        data.append('images', file);
      });

      const result = await listingService.updateListing(listing._id, data);

      if (result.success) {
        handleSuccess("Listing updated successfully!");
        if (onListingUpdated) {
          onListingUpdated(result.listing);
        }
        onClose();
      } else {
        handleError(result.message || "Failed to update listing");
      }
    } catch (err) {
      console.error(err);
      handleError("Network error while updating listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2>Edit Listing</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.formBody}>
          <div className={styles.fieldGroup}>
            <label>Title *</label>
            <input
              className={styles.input}
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
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
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Photos Management */}
          <div className={styles.fieldGroup}>
            <label>Photos (Max 10)</label>
            <div
              className={styles.dropzone}
              onClick={() => fileInputRef.current?.click()}
            >
              <p>📸 Click to add more photos</p>
              <input
                ref={fileInputRef}
                className={styles.fileInput}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
              />
            </div>

            {/* Existing Images */}
            {(existingImages.length > 0 || newPreviews.length > 0) && (
              <div className={styles.previewGrid}>
                {existingImages.map((path, index) => (
                  <div key={`existing-${index}`} className={styles.previewCard}>
                    <img src={`http://localhost:9000${path}`} alt="existing" />
                    <button
                      type="button"
                      className={styles.removeImgBtn}
                      onClick={() => handleRemoveExistingImage(index)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                {newPreviews.map((src, index) => (
                  <div key={`new-${index}`} className={styles.previewCard}>
                    <img src={src} alt="new preview" />
                    <button
                      type="button"
                      className={styles.removeImgBtn}
                      onClick={() => handleRemoveNewImage(index)}
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
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditListing;
