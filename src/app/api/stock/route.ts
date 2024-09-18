import {NextResponse} from "next/server";

export async function GET() {
	const data = await fetch("https://api.upbit.com/v1/market/all?isDetails=true", {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		}
	).then((response) => response.json())
		.then((data) => {
			return data;
		});
	return NextResponse.json(data);
}
