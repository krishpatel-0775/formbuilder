import "./globals.css";
import Providers from "./providers";
import ClientLayout from "./ClientLayout";

export const metadata = {
  title: "FormCraft PRO",
  description: "Premium Drag & Drop Form Builder",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <body>
        <Providers>
          <ClientLayout>
            {children}
          </ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
