import axiosInstance from "./fetchWithAgent";

export async function getCards(selector: number | string) {
    try {
        const normalizedSelector = encodeURIComponent(selector.toString());
        const response = await axiosInstance.get(`/library/${normalizedSelector}`);

        if (response.data.length !== 0) {
            return response.data;
        }
        return [];
    } catch (error: any) {
        console.error(error);
        throw new Error("An error occurred while fetching cards.");
    }
}