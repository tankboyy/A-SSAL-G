import type {Metadata} from "next";
import "./globals.css";
import Roots from "@/app/components/roots";


export const metadata: Metadata = {
	title: "살껄",
	description: "사지 그랬어",
};

export default function RootLayout({
																		 children,
																	 }: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ko">
		<body>
		<Roots>
			{children}
		</Roots>
		</body>
		</html>
	);
}
