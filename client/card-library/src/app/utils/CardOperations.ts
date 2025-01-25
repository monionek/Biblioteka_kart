import axiosInstance from "./fetchWithAgent";
type Card = {
    name: string;
    rarity: string;
    color: string[];
    type: string;
    cost: Record<string, number>;
    attack: number | null;
    toughness: number | null;
    description: string;
};

export async function getCards(selector: string, value: string) {
    try {
        const response = await axiosInstance.get(`/library/${selector}?value=${value}`);

        if (response.data.length !== 0) {
            return response.data;
        }
        return [];
    } catch (error: any) {
        console.error(error);
        throw new Error("An error occurred while fetching cards.");
    }
}

export async function deleteCard(name: string) {
    try {
        const response = await axiosInstance.delete(`/library/${name}`, {
            withCredentials: true
        });

        if (response.status === 200) {
            return true;
        }
        console.error("Unexpected response:", response.data);
        return false;
    } catch (error: any) {
        console.error("Error while deleting Card: ", error);
        if (error.response?.status === 404) {
            console.log("Card not found.");
        }
        return false;
    }
}