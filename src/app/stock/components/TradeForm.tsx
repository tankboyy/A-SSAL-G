'use client';

import {useEffect, useState} from "react";
import {useChartInfinityQuery} from "@/hooks/query/useChartData";

export default function TradeForm({type = '매수'}) {
	const [price, setPrice] = useState('');
	const [amount, setAmount] = useState('');
	const [total, setTotal] = useState(0);

	const {data, isFetched} = useChartInfinityQuery();

	useEffect(() => {
		setPrice(data?.pages?.[0][199].trade_price);
	}, [isFetched]);

	const handlePriceChange = (e) => {
		const value = e.target.value;
		setPrice(value);
		updateTotal(value, amount);
	};

	const handleAmountChange = (e) => {
		const value = e.target.value;
		setAmount(value);
		updateTotal(price, value);
	};

	const updateTotal = (price, amount) => {
		const totalValue = parseFloat(price) * parseFloat(amount) || 0;
		setTotal(totalValue);
	};

	const handleReset = () => {
		setPrice('');
		setAmount('');
		setTotal(0);
	};

	return (
		<div className="p-6 border border-gray-300 rounded-lg w-80">
			<h2 className="text-xl font-semibold mb-4">{type} 주문</h2>

			<div className="mb-4">
				<label className="block mb-1 text-sm text-gray-700">매수가격 (KRW)</label>
				<input
					type="number"
					value={price}
					onChange={handlePriceChange}
					placeholder="가격 입력"
					className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
				/>
			</div>

			<div className="mb-4">
				<label className="block mb-1 text-sm text-gray-700">주문수량 (MEW)</label>
				<input
					type="number"
					value={amount}
					onChange={handleAmountChange}
					placeholder="수량 입력"
					className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
				/>
			</div>

			<div className="mb-4">
				<label className="block mb-1 text-sm text-gray-700">주문총액 (KRW)</label>
				<input
					type="number"
					value={total}
					readOnly
					className="w-full p-2 border bg-gray-100 rounded-lg focus:outline-none"
				/>
			</div>

			<div className="flex justify-between">
				<button
					onClick={handleReset}
					className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
				>
					초기화
				</button>
				<button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
					{type}
				</button>
			</div>
		</div>
	);
}
