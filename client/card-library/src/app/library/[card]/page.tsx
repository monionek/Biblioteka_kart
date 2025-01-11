export default function Card() {
    return (
        <div>
            <h1>Biblioteka</h1>
            <div id="search-bar">
                <span id="card-search">
                    <input type="field" placeholder="card..."></input>
                    <button className="search-button" id="button-search-card">
                        search
                    </button>
                </span>
            </div>
        </div>
    );
}