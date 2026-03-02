"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function FormsListPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Logic remains untouched
  useEffect(() => {
    fetch("http://localhost:9090/api/forms")
      .then((res) => res.json())
      .then((data) => {
        setForms(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching forms:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <p style={{ color: "#64748b", marginTop: "16px", fontWeight: "500" }}>
          Fetching your forms...
        </p>
      </div>
    );
  }

  return (
    <div style={pageWrapperStyle}>
      <div style={headerSectionStyle}>
        <div>
          <h2 style={mainTitleStyle}>Available Forms</h2>
          <p style={subtitleStyle}>Select a form below to view and submit responses.</p>
        </div>
        <Link href="/builder">
          <button style={createButtonStyle}>+ Create New</button>
        </Link>
      </div>

      <hr style={dividerStyle} />

      {forms.length === 0 ? (
        <div style={emptyStateStyle}>
          <p style={{ fontSize: "1.1rem", fontWeight: "600", color: "#475569" }}>No forms found</p>
          <p style={{ color: "#94a3b8" }}>Get started by creating your first dynamic form.</p>
        </div>
      ) : (
        <div style={gridStyle}>
          {forms
            .filter((form) => form.formName) 
            .map((form) => (
              <div key={form.id} style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={iconBoxStyle}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  {/* <span style={badgeStyle}>
                    {form.fields?.length || 0} Fields
                  </span> */}
                </div>

                <h4 style={formTitleStyle}>{form.formName}</h4>
                <p style={cardIdStyle}>Form ID: {form.id.toString().slice(-6)}</p>

                <Link href={`/forms/${form.id}`} style={{ textDecoration: "none" }}>
                  <button style={actionButtonStyle}>
                    Fill Form
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginLeft: "8px" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </button>
                </Link>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// --- Professional Styles ---

const pageWrapperStyle = {
  maxWidth: "1000px",
  margin: "60px auto",
  padding: "0 24px",
  fontFamily: "'Inter', system-ui, sans-serif",
  color: "#1e293b",
};

const headerSectionStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  marginBottom: "32px",
};

const mainTitleStyle = {
  fontSize: "2rem",
  fontWeight: "800",
  margin: 0,
  color: "#0f172a",
  letterSpacing: "-0.025em",
};

const subtitleStyle = {
  margin: "8px 0 0 0",
  color: "#64748b",
  fontSize: "1rem",
};

const createButtonStyle = {
  padding: "10px 20px",
  backgroundColor: "#6366f1",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontWeight: "600",
  cursor: "pointer",
  boxShadow: "0 4px 6px -1px rgba(99, 102, 241, 0.2)",
};

const dividerStyle = {
  border: "none",
  borderTop: "1px solid #e2e8f0",
  marginBottom: "40px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "24px",
};

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "24px",
  transition: "all 0.2s ease",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  ":hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
    borderColor: "#6366f1",
  }
};

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const iconBoxStyle = {
  width: "40px",
  height: "40px",
  backgroundColor: "#f1f5f9",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#6366f1",
};

const badgeStyle = {
  fontSize: "0.75rem",
  fontWeight: "700",
  backgroundColor: "#f0fdf4",
  color: "#16a34a",
  padding: "4px 10px",
  borderRadius: "99px",
  border: "1px solid #dcfce7",
};

const formTitleStyle = {
  fontSize: "1.25rem",
  fontWeight: "700",
  margin: "0 0 4px 0",
  color: "#1e293b",
};

const cardIdStyle = {
  fontSize: "0.85rem",
  color: "#94a3b8",
  marginBottom: "24px",
};

const actionButtonStyle = {
  width: "100%",
  padding: "12px",
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  color: "#475569",
  fontWeight: "600",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s",
};

const emptyStateStyle = {
  textAlign: "center",
  padding: "80px 0",
  backgroundColor: "#f8fafc",
  borderRadius: "20px",
  border: "2px dashed #e2e8f0",
};

const loadingContainerStyle = {
  height: "60vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

const spinnerStyle = {
  width: "32px",
  height: "32px",
  border: "3px solid #e2e8f0",
  borderTop: "3px solid #6366f1",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};