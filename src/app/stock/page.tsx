'use client';
import {useEffect, useState} from "react";

export default function Page() {
	const [titleNames, setTitleNames] = useState();
	useEffect(() => {
		const getAll = async () => {
			await fetch("/api/stock", {
					method: 'GET',
				}
			).then((response) => response.json())
				.then((data) => {
					const resolveData = data.filter((item) => item.market.includes("KRW"));
					setTitleNames(resolveData);
				});
		};
		getAll();
	}, []);
	return (
		<div>
			<h1>Stock</h1>
			{titleNames?.map((titleName, index) => (
				<div key={index}>
					{titleName.korean_name}
				</div>
			))}
		</div>
	);
}
