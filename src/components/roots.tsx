'use client';

import {RecoilRoot} from "recoil";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";


export default function Roots({children}: Readonly<{ children: React.ReactNode; }>) {

	const queryClient = new QueryClient({});

	return (
		<>
			<QueryClientProvider client={queryClient}>
				<RecoilRoot>
					{children}
				</RecoilRoot>
			</QueryClientProvider>
		</>
	);
}
