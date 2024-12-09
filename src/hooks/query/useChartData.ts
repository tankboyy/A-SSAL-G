import {useInfiniteQuery} from "@tanstack/react-query";
import {useRecoilValue} from "recoil";
import {selectedStockState} from "@/recoil/stock";
import {useEffect} from "react";

const fetchData = async (pageParam: string, selectedStockCode: string) => {
	console.log('::::::::::', pageParam);
	const options = {method: 'GET', headers: {accept: 'application/json'}};

	// 페이지네이션을 위한 기준 시간 또는 데이터 설정
	const to = new Date(pageParam).toISOString();

	const response = await fetch(
		`https://api.upbit.com/v1/candles/minutes/1?market=${selectedStockCode}&count=200&to=${to}`,
		options
	);

	if (!response.ok) {
		throw new Error('Network response was not ok');
	}

	const data = await response.json();

	return data.reverse();
};
export const useChartInfinityQuery = () => {
	const selectedStock = useRecoilValue(selectedStockState);

	return useInfiniteQuery({
		queryKey: ["chartData", selectedStock?.code],
		queryFn: ({pageParam}) => fetchData(pageParam, selectedStock.code),
		initialPageParam: new Date().toISOString(),
		getNextPageParam: (lastPage, allPages) => {
			if (lastPage && lastPage.length > 0) {
				const oldestData = lastPage[0];
				const oldestTimestamp = oldestData.timestamp;

				const nextPageParam = new Date(oldestTimestamp - 1).toISOString();
				return nextPageParam;
			} else {
				return undefined; // 더 이상 가져올 데이터가 없음
			}
		},
		enabled: !!selectedStock?.code,
	});
};
