import type {Metadata} from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Bulk Image Resizer",
    description: "Resize multiple images quickly and efficiently",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className="antialiased">{children}</body>
        </html>
    );
}

