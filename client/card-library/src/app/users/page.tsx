export default function Users() {
    return (
        <div>
            <h1>Strona użytkowników</h1>
            <div id="search-bar">
                <span id="user-search">
                    <input type="field" placeholder="username or email"></input>
                    <button className="search-button" id="button-search-user">
                        search
                    </button>
                </span>
            </div>
        </div>
    );
}