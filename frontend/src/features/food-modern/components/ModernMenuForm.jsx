

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useFormik } from "formik";
import * as Yup from "yup";
import { getCategories } from "../api";

const ModernMenuForm = ({ initialValues, onSubmit, onCancel, saving }) => {
  const [preview, setPreview] = useState(initialValues.imageUrl || initialValues.image || null);
  const [file, setFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState(null);

  // Dynamic validation: require image only if not editing with existing image
  const validationSchema = Yup.object({
    name_eng: Yup.string().required("English name required"),
    name_tamil: Yup.string().required("Tamil name required"),
    price: Yup.number().min(1).required("Price required"),
    category: Yup.string().required("Category required"),
    image: initialValues.imageUrl || initialValues.image ? Yup.mixed() : Yup.mixed().required("Image required"),
    description: Yup.string().min(10).max(500),
    ingredients: Yup.array().of(Yup.string()),
    tags: Yup.array().of(Yup.string()),
  });

  const formik = useFormik({
    initialValues: { ...initialValues, category: initialValues.category?._id || initialValues.category || "" },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append("name_eng", values.name_eng);
      formData.append("name_tamil", values.name_tamil);
      formData.append("price", values.price);
      formData.append("category", values.category);
      formData.append("description", values.description || "");
      formData.append("ingredients", (values.ingredients || []).join(","));
      formData.append("tags", (values.tags || []).join(","));
      if (file) {
        formData.append("file", file);
      }
      onSubmit(formData);
    },
  });

  useEffect(() => {
    setCatLoading(true);
    getCategories()
      .then(data => {
        setCategories(data);
        setCatError(null);
      })
      .catch(() => setCatError("Failed to load categories"))
      .finally(() => setCatLoading(false));
  }, []);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else if (initialValues.imageUrl) {
      setPreview(initialValues.imageUrl);
    } else if (initialValues.image) {
      setPreview(initialValues.image);
    } else {
      setPreview(null);
    }
  }, [file, initialValues.imageUrl, initialValues.image]);

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4" encType="multipart/form-data">
      <div>
        <label className="block font-bold">Name (English)</label>
        <input
          name="name_eng"
          className="border rounded px-3 py-2 w-full"
          value={formik.values.name_eng}
          onChange={formik.handleChange}
        />
        {formik.touched.name_eng && formik.errors.name_eng && (
          <div className="text-red-500 text-xs">{formik.errors.name_eng}</div>
        )}
      </div>
      <div>
        <label className="block font-bold">Name (Tamil)</label>
        <input
          name="name_tamil"
          className="border rounded px-3 py-2 w-full font-tamil"
          value={formik.values.name_tamil}
          onChange={formik.handleChange}
        />
        {formik.touched.name_tamil && formik.errors.name_tamil && (
          <div className="text-red-500 text-xs">{formik.errors.name_tamil}</div>
        )}
      </div>
      <div>
        <label className="block font-bold">Price (LKR)</label>
        <input
          name="price"
          type="number"
          className="border rounded px-3 py-2 w-full"
          value={formik.values.price}
          onChange={formik.handleChange}
        />
        {formik.touched.price && formik.errors.price && (
          <div className="text-red-500 text-xs">{formik.errors.price}</div>
        )}
      </div>
      <div>
        <label className="block font-bold">Category</label>
        {catLoading ? (
          <div className="text-xs text-gray-500">Loading categories...</div>
        ) : catError ? (
          <div className="text-xs text-red-500">{catError}</div>
        ) : (
          <select
            name="category"
            className="border rounded px-3 py-2 w-full"
            value={formik.values.category}
            onChange={formik.handleChange}
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        )}
        {formik.touched.category && formik.errors.category && (
          <div className="text-red-500 text-xs">{formik.errors.category}</div>
        )}
      </div>
      <div>
        <label className="block font-bold">Image</label>
        <input
          name="image"
          type="file"
          accept="image/*"
          className="border rounded px-3 py-2 w-full"
          onChange={e => {
            setFile(e.currentTarget.files[0]);
            formik.setFieldValue("image", e.currentTarget.files[0]);
          }}
        />
        {preview && (
          <img src={preview} alt="Preview" className="mt-2 w-32 h-24 object-cover rounded border" />
        )}
        {formik.touched.image && formik.errors.image && (
          <div className="text-red-500 text-xs">{formik.errors.image}</div>
        )}
      </div>
      <div>
        <label className="block font-bold">Description</label>
        <textarea
          name="description"
          className="border rounded px-3 py-2 w-full"
          value={formik.values.description}
          onChange={formik.handleChange}
        />
        {formik.touched.description && formik.errors.description && (
          <div className="text-red-500 text-xs">{formik.errors.description}</div>
        )}
      </div>
      <div>
        <label className="block font-bold">Ingredients (comma separated)</label>
        <input
          name="ingredients"
          className="border rounded px-3 py-2 w-full"
          value={Array.isArray(formik.values.ingredients) ? formik.values.ingredients.join(", ") : formik.values.ingredients}
          onChange={e => formik.setFieldValue("ingredients", e.target.value.split(",").map(s => s.trim()))}
        />
      </div>
      <div>
        <label className="block font-bold">Tags (comma separated)</label>
        <input
          name="tags"
          className="border rounded px-3 py-2 w-full"
          value={Array.isArray(formik.values.tags) ? formik.values.tags.join(", ") : formik.values.tags || ""}
          onChange={e => formik.setFieldValue("tags", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
        />
      </div>
      <div className="flex gap-2 mt-4">
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        <button type="button" className="bg-gray-200 px-4 py-2 rounded" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
};

ModernMenuForm.propTypes = {
  initialValues: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

export default ModernMenuForm;
