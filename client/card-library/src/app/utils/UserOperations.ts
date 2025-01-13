import axiosInstance from "./fetchWithAgent";

export async function searchUser(selector: string) {
    try {
        const response = await axiosInstance.get(`/users/${selector}`);

        if (response.status !== 200) {
            console.log(response.data);
            return null;
        }

        const user = response.data;
        return {
            name: user.name,
            email: user.email,
            role: user.role
        };
    } catch (error: any) {
        console.error("Error while fetching user: ", error);

        if (error.response && error.response.status === 404) {
            console.log("User not found");
            return null;
        }
        return "error";
    }
};

export async function deleteUser(selector: string): Promise<boolean> {
    try {
        const token = localStorage.getItem("jwt");

        if (!token) {
            console.error("No token found.");
            return false;
        }
        const response = await axiosInstance.delete(`/users/${selector}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.status === 200) {
            return true;
        }
        console.error("Unexpected response:", response.data);
        return false;
    } catch (error: any) {
        console.error("Error while deleting user: ", error);
        if (error.response?.status === 404) {
            console.log("User not found.");
        }
        return false;
    }
}

export async function modifyUser(selector: string, data: { [key: string]: any }): Promise<boolean> {
    try {
        const token = localStorage.getItem("jwt");

        if (!token) {
            console.error("No token found.");
            return false;
        }

        const response = await axiosInstance.patch(`/users/${selector}`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.status === 200;
    } catch (error: any) {
        console.error("Error in modifyUser:", error);
        return false;
    }
}