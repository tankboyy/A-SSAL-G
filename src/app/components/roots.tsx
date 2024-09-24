'use client';

import {RecoilRoot} from "recoil";


export default function Roots({children}: Readonly<{ children: React.ReactNode; }>) {
	return (
		<>
			<RecoilRoot>
				{children}
			</RecoilRoot>
		</>
	);
}
