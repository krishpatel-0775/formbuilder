"use client";

import { useEffect, useState } from "react";
import apiClient from "../utils/apiClient";
import { ENDPOINTS } from "../config/apiConfig";

export default function FormsPage() {

  const [forms, setForms] = useState([]);

  useEffect(() => {
    apiClient.get(ENDPOINTS.FORMS)
      .then(res => setForms(res.data.data || []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        All Forms
      </h1>

      <div className="grid gap-4">
        {forms.map(form => (
          <div
            key={form.id}
            className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
          >
            <h2 className="text-lg font-semibold">
              {form.formName}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
}