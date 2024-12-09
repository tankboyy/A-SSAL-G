import {atom} from "recoil";

export const stockListState = atom({
	key: "stockListState",
	default: [],
});

export const selectedStockState = atom<TCoin | null>({
	key: "selectedStockState",
	default: null,
});
