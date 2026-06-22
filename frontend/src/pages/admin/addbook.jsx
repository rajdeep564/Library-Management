import React, { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import { ButtonSpinner } from "../../components/ui";


const AddBookForm = () => {
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const formData = new FormData();
      
      // Append all text fields
      Object.keys(data).forEach((key) => {
        if (key !== "coverImage") {
          formData.append(key, data[key]);
        }
      });
  
      // Append the file manually
      if (data.coverImage && data.coverImage[0]) {
        formData.append("coverImage", data.coverImage[0]); // Ensure it's the file object
      }
  
      const authToken = localStorage.getItem("authToken");
      const url = Server_URL + "books/add";
  
      const response = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log(response.data);
      const { error, message } = response.data;

      if (error) {
        showErrorToast(message);
      } else {
        showSuccessToast(message);
        reset();
      }
      
    } catch (error) {
      console.error("Error:", error.response?.data?.message || error.message);
      showErrorToast("Failed to add book!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: "var(--gov-text-primary)", margin: 0 }}>
          <i className="bi bi-plus-circle" style={{ marginRight: 8, color: "var(--gov-primary)" }}></i>
          Add a New Book
        </h4>
        <p style={{ color: "var(--gov-text-light)", fontSize: 13, margin: "4px 0 0" }}>
          Register a new title in the library catalog
        </p>
      </div>
      <div className="gov-card">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3">
          <label className="gov-label">Book Title</label>
          <input
            type="text"
            className="gov-input"
            {...register("title", { required: "Title is required" })}
          />
          {errors.title && <small className="text-danger">{errors.title.message}</small>}
        </div>

        <div className="mb-3">
          <label className="gov-label">Author</label>
          <input
            type="text"
            className="gov-input"
            {...register("author", { required: "Author is required" })}
          />
          {errors.author && <small className="text-danger">{errors.author.message}</small>}
        </div>

        <div className="mb-3">
          <label className="gov-label">Category</label>
          <select className="gov-input" {...register("category", { required: "Category is required" })}>
            <option value="">Select Category</option>
            <option value="Fiction">Fiction</option>
            <option value="Non-fiction">Non-fiction</option>
            <option value="Science">Science</option>
            <option value="History">History</option>
          </select>
          {errors.category && <small className="text-danger">{errors.category.message}</small>}
        </div>

        <div className="mb-3">
          <label className="gov-label">ISBN</label>
          <input
            type="text"
            className="gov-input"
            {...register("isbn", { required: "ISBN is required" })}
          />
          {errors.isbn && <small className="text-danger">{errors.isbn.message}</small>}
        </div>

        <div className="mb-3">
          <label className="gov-label">Book Cover Image</label>
          <input
            type="file"
            className="gov-input"
            {...register("coverImage")}
          />
        </div>

        <div className="mb-3">
          <label className="gov-label">Total Copies</label>
          <input 
            type="number" 
            className="gov-input" 
            {...register("totalCopies", { required: true, min: 1 })} 
          />
        </div>
        
        <div className="mb-3">
          <label className="gov-label">Price</label>
          <input 
            type="number" 
            step="0.01" 
            className="gov-input" 
            {...register("price", { required: true })} 
          />
        </div>
        <div className="mb-3">
          <label className="gov-label">Description</label>
          <textarea
            className="gov-input"
            rows="3"
            {...register("description", { required: "Description is required" })}
          ></textarea>
          {errors.description && <small className="text-danger">{errors.description.message}</small>}
        </div>

        <ButtonSpinner type="submit" loading={saving} className="w-100">Add Book</ButtonSpinner>
      </form>
      </div>
    </div>
  );
};

export default AddBookForm;
