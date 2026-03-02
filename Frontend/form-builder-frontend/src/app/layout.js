export const metadata = {
  title: "Dynamic Form Builder",
  description: "Drag & Drop Form Builder",
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={bodyStyle}>
        {/* NAV SPANS FULL WIDTH */}
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
              <a href="/forms/all" style={ctaLinkStyle}>My Forms</a>
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT AREA SPANS FULL WIDTH */}
        <main style={mainWrapperStyle}>
          {children}
        </main>
      </body>
    </html>
  );
}

// --- High-Density Fluid Styles ---

const bodyStyle = {
  backgroundColor: "#ffffff", // Pure white for a cleaner look
  minHeight: "100vh",
  margin: 0,
  padding: 0,
  fontFamily: "'Inter', system-ui, sans-serif",
  overflowX: "hidden", // Prevent horizontal scroll
};

const navStyle = {
  backgroundColor: "#ffffff",
  borderBottom: "1px solid #f1f5f9",
  position: "sticky",
  top: 0,
  zIndex: 1000,
  padding: "0 20px", // Minimal side padding for the nav items
};

const navContentStyle = {
  width: "100%", // Fluid width
  height: "64px", // Slimmer nav
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const logoSectionStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const logoIconStyle = {
  width: "32px",
  height: "32px",
  backgroundColor: "#000000", // High contrast black
  color: "white",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const logoTextStyle = {
  fontSize: "1.1rem",
  fontWeight: "900",
  color: "#000000",
  margin: 0,
  letterSpacing: "-0.03em",
  textTransform: "uppercase",
};

const proBadgeStyle = {
  fontSize: "0.55rem",
  backgroundColor: "#eff6ff",
  color: "#3b82f6",
  padding: "1px 5px",
  borderRadius: "3px",
  marginLeft: "4px",
  border: "1px solid #dbeafe",
};

const linkGroupStyle = {
  display: "flex",
  alignItems: "center",
  gap: "24px",
};

const navLinkStyle = {
  color: "#475569",
  textDecoration: "none",
  fontSize: "0.85rem",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  transition: "color 0.2s",
};

const ctaLinkStyle = {
  backgroundColor: "#000000",
  color: "#ffffff",
  padding: "8px 14px",
  borderRadius: "6px",
  fontSize: "0.8rem",
  fontWeight: "800",
  textDecoration: "none",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const mainWrapperStyle = {
  width: "100%", // Full width
  margin: 0,
  padding: 0, // Removed all margins and padding from the wrapper
  display: "flex",
  flexDirection: "column",
};