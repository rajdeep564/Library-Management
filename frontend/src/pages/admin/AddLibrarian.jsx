import React, { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import { ButtonSpinner } from "../../components/ui";


export default function AddLibrarian() {
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
      const formData = { ...data, role: "librarian" };
      const url = Server_URL + "admin/addlibrarian";
      const authToken = localStorage.getItem("authToken");
      console.log(authToken);

      const response = await axios.post(
        url,
        formData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      console.log("Response:", response.data);
      showSuccessToast("Registration Successful!");
      reset();
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      showErrorToast("Registration Failed!");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: "var(--gov-text-primary)", margin: 0 }}>
          <i className="bi bi-person-plus" style={{ marginRight: 8, color: "var(--gov-primary)" }}></i>
          Add Librarian
        </h4>
        <p style={{ color: "var(--gov-text-light)", fontSize: 13, margin: "4px 0 0" }}>
          Create a new librarian account for the municipal library network
        </p>
      </div>
      <div className="gov-card">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3">
          <label className="gov-label">Name</label>
          <input
            type="text"
            className="gov-input"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && <p className="text-danger">{errors.name.message}</p>}
        </div>

        <div className="mb-3">
          <label className="gov-label">Email</label>
          <input
            type="email"
            className="gov-input"
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && (
            <p className="text-danger">{errors.email.message}</p>
          )}
        </div>

        <div className="mb-3">
          <label className="gov-label">Password</label>
          <input
            type="password"
            className="gov-input"
            {...register("password", { required: "Password is required" })}
          />
          {errors.password && (
            <p className="text-danger">{errors.password.message}</p>
          )}
        </div>

        <ButtonSpinner type="submit" loading={saving} className="w-100">
          Add Librarian
        </ButtonSpinner>
      </form>
      </div>
    </div>
  );
}
