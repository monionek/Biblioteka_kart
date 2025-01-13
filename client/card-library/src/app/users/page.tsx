'use client'
import { useState } from "react";
import { searchUser, deleteUser, modifyUser } from "../utils/UserOperations";

export default function Users() {
    const [selector, setSelector] = useState<string>('');
    const [userDetails, setUserDetails] = useState<{ name: string, email: string, role: string } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [modifyField, setModifyField] = useState<string>('name');
    const [modifyData, setModifyData] = useState<string>('');


    const handleModify = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!userDetails?.name) {
            console.error("User name is required for modifying.");
            return;
        }

        const data = { [modifyField]: modifyData };

        try {
            const success = await modifyUser(userDetails.name, data);
            if (success) {
                console.log("User modified successfully.");
            } else {
                console.log("Failed to modify user.");
            }
        } catch (error) {
            console.error("Error in handleModify:", error);
        }
    };
    const handleDelete = async () => {
        if (!userDetails?.name) {
            console.error("User name is required for deletion.");
            return
        }
        try {
            const deleted = await deleteUser(userDetails?.name)
            if (deleted) {
                setUserDetails(null)
                console.log("user deleted");
            } else {
                console.log("failed to delete user");
            }
        } catch (error) {
            console.error("Error in handleDelete:", error);
        }
    }
    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage(null);

        const user = await searchUser(selector);
        if (user === null) {
            setErrorMessage("User not found.");
        } else if (user === "error") {
            setErrorMessage("An error occurred while fetching user data.");
        } else {
            setUserDetails(user);
        }
    }
    return (
        <div>
            <h1>Strona użytkowników</h1>
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    value={selector}
                    onChange={(e) => setSelector(e.target.value)}
                    placeholder="Enter username or email"
                />
                <button type="submit">Search</button>
            </form>
            <div id="user-details">
                {userDetails ? (
                    <div>
                        <h2>User Details:</h2>
                        <p><strong>Name:</strong> {userDetails.name}</p>
                        <p><strong>Email:</strong> {userDetails.email}</p>
                        <p><strong>Role:</strong> {userDetails.role}</p>
                        <span id="user-options">
                            Only admin can delete your account
                            <button id="delete-user" onClick={() => handleDelete()}>Delete User</button>
                            <form id="modify-user-form" onSubmit={handleModify}>
                                <label htmlFor="modify-field">Field to modify:</label>
                                <select id="modify-field" value={modifyField} onChange={(e) => setModifyField(e.target.value)}>
                                    <option value="name">Name</option>
                                    <option value="email">Email</option>
                                    <option value="role">Role</option>
                                </select>

                                <label htmlFor="modify-data">New value:</label>
                                <input type="text" id="modify-data" value={modifyData} onChange={(e) => setModifyData(e.target.value)} placeholder="New value" />

                                <button id="modify-user" type="submit">Modify User</button>
                            </form>

                        </span>
                    </div>
                ) : (
                    errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>
                )}
            </div>
            <div id="user-options">
            </div>
        </div>
    );
}