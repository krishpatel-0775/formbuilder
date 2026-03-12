export const metadata = {
  title: "FormCraft PRO",
  description: "Premium Drag & Drop Form Builder",
};

import "./globals.css";
import Providers from "./providers";
import NavLinks from "./NavLinks";
import Sidebar from "./Sidebar";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <body style={bodyStyle}>
        <Providers>
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

              <NavLinks />
            </div>
          </nav>

          <div style={appContentStyle}>
            {/* SIDEBAR */}
            <Sidebar />

            {/* MAIN CONTENT AREA */}
            <main style={mainWrapperStyle}>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

// --- High-Density Fluid Styles ---

const bodyStyle = {
  backgroundColor: "#f8fafc",
  color: "#0f172a",
  minHeight: "100vh",
  margin: 0,
  padding: 0,
  fontFamily: "'Inter', system-ui, sans-serif",
  overflowX: "hidden",
};

const navStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  backdropFilter: "blur(12px)",
  borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
  position: "sticky",
  top: 0,
  zIndex: 1000,
  padding: "0 32px",
};

const navContentStyle = {
  width: "100%",
  height: "64px",
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
  width: "32px",
  height: "32px",
  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
  color: "white",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 10px rgba(59, 130, 246, 0.2)",
};

const logoTextStyle = {
  fontSize: "1.1rem",
  fontWeight: "900",
  color: "#0f172a",
  margin: 0,
  letterSpacing: "-0.03em",
  textTransform: "uppercase",
};

const proBadgeStyle = {
  fontSize: "0.55rem",
  backgroundColor: "rgba(59, 130, 246, 0.1)",
  color: "#2563eb",
  padding: "2px 6px",
  borderRadius: "4px",
  marginLeft: "6px",
  border: "1px solid rgba(59, 130, 246, 0.2)",
};

const appContentStyle = {
  display: "flex",
  width: "100%",
  minHeight: "calc(100vh - 64px)",
};

const mainWrapperStyle = {
  flex: 1,
  paddingLeft: "280px",
  margin: 0,
  display: "flex",
  flexDirection: "column",
};