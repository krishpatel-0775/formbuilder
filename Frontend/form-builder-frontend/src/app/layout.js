export const metadata = {
  title: "Dynamic Form Builder",
  description: "Drag & Drop Form Builder",
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={bodyStyle}>
        {/* MODERN NAVIGATION */}
        <nav style={navStyle}>
          <div style={navContentStyle}>
            <div style={logoSectionStyle}>
              <div style={logoIconStyle}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h1 style={logoTextStyle}>FormCraft <span style={proBadgeStyle}>PRO</span></h1>
            </div>

            <div style={linkGroupStyle}>
              <a href="/" style={navLinkStyle}>Builder</a>
              {/* <a href="/forms/all" style={navLinkStyle}>My Forms</a> */}
              <a href="/forms/all" style={ctaLinkStyle}>My Forms</a>
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT AREA */}
        <main style={mainWrapperStyle}>
          {children}
        </main>
      </body>
    </html>
  );
}

// --- Professional Layout Styles ---

const bodyStyle = {
  backgroundColor: "#f8fafc", // Soft Slate background
  minHeight: "100vh",
  margin: 0,
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};

const navStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
  position: "sticky",
  top: 0,
  zIndex: 1000,
  padding: "0 24px",
};

const navContentStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  height: "72px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const logoSectionStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const logoIconStyle = {
  width: "36px",
  height: "36px",
  backgroundColor: "#6366f1",
  color: "white",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
};

const logoTextStyle = {
  fontSize: "1.25rem",
  fontWeight: "800",
  color: "#0f172a",
  margin: 0,
  letterSpacing: "-0.02em",
};

const proBadgeStyle = {
  fontSize: "0.65rem",
  verticalAlign: "middle",
  backgroundColor: "#f1f5f9",
  color: "#64748b",
  padding: "2px 6px",
  borderRadius: "4px",
  marginLeft: "4px",
};

const linkGroupStyle = {
  display: "flex",
  alignItems: "center",
  gap: "32px",
};

const navLinkStyle = {
  color: "#64748b",
  textDecoration: "none",
  fontSize: "0.95rem",
  fontWeight: "500",
  transition: "color 0.2s",
  cursor: "pointer",
};

const ctaLinkStyle = {
  backgroundColor: "#0f172a",
  color: "#ffffff",
  padding: "8px 16px",
  borderRadius: "8px",
  fontSize: "0.9rem",
  fontWeight: "600",
  textDecoration: "none",
  transition: "opacity 0.2s",
};

const mainWrapperStyle = {
  padding: "40px 24px",
  maxWidth: "1200px",
  margin: "0 auto",
};