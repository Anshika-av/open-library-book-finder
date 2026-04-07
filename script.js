document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial State & Elements setup
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const filterSelect = document.getElementById('filter-select');
    const resultsGrid = document.getElementById('results-grid');
    const themeToggle = document.getElementById('theme-toggle');
    const loadingSpinner = document.getElementById('loading-spinner');

    // 5. Dark Mode / Light Mode implementation with localStorage persistence
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.textContent = '☀️ Light Mode';
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'light') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
            themeToggle.textContent = '🌙 Dark Mode';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeToggle.textContent = '☀️ Light Mode';
        }
    });

    let dataset = [];
    let likedBooks = []; // Array keeping track of toggled favorites

    // Fetch initial batch of books from Open Library API (since it shouldn't be empty)
    async function loadBooksFromAPI() {
        if (!loadingSpinner) return;
        loadingSpinner.classList.remove('hidden');
        resultsGrid.innerHTML = '';
        
        try {
            // Let's fetch popular classics or a broad subject to populate our application
            const response = await fetch('https://openlibrary.org/search.json?q=subject:fiction&limit=50');
            if (!response.ok) throw new Error("API Network error");
            const data = await response.json();
            
            // Transform the fetched API data into our state dataset using .map() higher-order function
            // Only using Array High-Order functions!
            dataset = (data.docs || []).map(doc => ({
                key: doc.key,
                title: doc.title,
                author_name: doc.author_name || ['Unknown Author'],
                first_publish_year: doc.first_publish_year || 0,
                cover_i: doc.cover_i,
                description: 'Full description is not available in the search API endpoint.' 
            }));

            // Initial render
            renderBooks();
        } catch (error) {
            console.error(error);
            resultsGrid.innerHTML = `
                <div class="error-message">
                    <span id="error-text">Failed to fetch books from the Open Library API.</span>
                </div>
            `;
        } finally {
            loadingSpinner.classList.add('hidden');
        }
    }

    // Functional UI Handlers: Re-rendering based on combined states
    
    // 1. Searching (real-time filtering as the user types)
    searchInput.addEventListener('input', () => {
        renderBooks();
    });

    // 3. Sorting Options
    sortSelect.addEventListener('change', () => {
        renderBooks();
    });

    // 2. Filtering Options
    filterSelect.addEventListener('change', () => {
        renderBooks();
    });

    // 4. Button Interactions via Event Delegation
    resultsGrid.addEventListener('click', (e) => {
        // Toggle Like/Favorite
        if (e.target.closest('.like-btn')) {
            const btn = e.target.closest('.like-btn');
            const key = btn.dataset.key;

            if (likedBooks.includes(key)) {
                // Higher-order function: filter out the disliked book (pure functional)
                likedBooks = likedBooks.filter(id => id !== key);
            } else {
                // Add the new liked book using array spread
                likedBooks = [...likedBooks, key];
            }
            
            // Re-render UI selectively or totally. For simplicity and functional purity, full re-render.
            renderBooks();
        }

        // Toggle View More (expand/collapse)
        if (e.target.closest('.view-more-btn')) {
            const btn = e.target.closest('.view-more-btn');
            const detailsDiv = btn.nextElementSibling;
            
            // Toggle using element classList (view state)
            const isHidden = detailsDiv.classList.contains('hidden');
            if (isHidden) {
                detailsDiv.classList.remove('hidden');
                btn.textContent = 'View Less';
            } else {
                detailsDiv.classList.add('hidden');
                btn.textContent = 'View More';
            }
        }
    });

    // Core Data Processing Pipeline using ONLY higher-order array methods (.filter, .sort, .map) Function
    function getProcessedData() {
        const query = searchInput.value.toLowerCase().trim();
        const sortMode = sortSelect.value;
        const filterMode = filterSelect.value;

        // Step 1: Real-time search filter using Array.prototype.filter()
        // We ensure to return elements that match the title OR author name
        let processed = dataset.filter(book => {
            if (!query) return true;
            const titleMatch = book.title && book.title.toLowerCase().includes(query);
            const authorMatch = book.author_name && book.author_name.join(', ').toLowerCase().includes(query);
            return titleMatch || authorMatch;
        });

        // Step 2: Category/type filtering using Array.prototype.filter()
        // We evaluate against the book's publish year
        processed = processed.filter(book => {
            const year = book.first_publish_year || 0;
            if (filterMode === 'classic') return year > 0 && year < 2000;
            if (filterMode === 'modern') return year >= 2000;
            return true; // "all" category
        });

        // Step 3: Sorting without mutating the original dataset (using spread operator and .sort)
        processed = [...processed].sort((a, b) => {
            const yearA = a.first_publish_year || 0;
            const yearB = b.first_publish_year || 0;
            
            if (sortMode === 'az') {
                return a.title.localeCompare(b.title);
            } else if (sortMode === 'za') {
                return b.title.localeCompare(a.title);
            } else if (sortMode === 'year-asc') {
                return yearA - yearB;
            } else if (sortMode === 'year-desc') {
                return yearB - yearA;
            }
            return 0; // 'default'
        });

        return processed; // Note: We do not use array reduce() directly here unless aggregating data, which wasn't fully necessary. Our pipeline is pure.
    }

    // Function to construct and render HTML elements functionally
    function renderBooks() {
        const booksToRender = getProcessedData();
        
        if (booksToRender.length === 0 && dataset.length > 0) {
            resultsGrid.innerHTML = `
                <div class="error-message">
                    <span id="error-text">No books match your search or filter configuration.</span>
                </div>
            `;
            return;
        }

        // Use map() instead of for-loops or forEach() to transform items into HTML structures!
        // join('') creates the final single template string securely
        resultsGrid.innerHTML = booksToRender.map((book, index) => {
            const title = book.title || 'Unknown Title';
            const author = book.author_name ? book.author_name.join(', ') : 'Unknown Author';
            const year = book.first_publish_year || 'Unknown Year';
            const key = book.key || index.toString();
            const description = book.description || 'No description available for this book.';
            
            // Check higher-order data for liked state
            const isLiked = likedBooks.includes(key);

            const coverUrl = book.cover_i 
                ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                : '';

            const coverHTML = coverUrl 
                ? `<img src="${coverUrl}" alt="Cover of ${title}" class="book-cover" loading="lazy">`
                : `
                    <div class="no-cover">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>No Cover</span>
                    </div>
                `;

            return `
                <div class="book-card" style="animation-delay: ${(index % 20) * 0.05}s">
                    <div class="book-cover-wrapper">
                        ${coverHTML}
                    </div>
                    <div class="book-info">
                        <h3 class="book-title" title="${title}">${title}</h3>
                        <p class="book-author">${author}</p>
                        <div class="book-meta">
                            <span class="book-year">${year}</span>
                            <button class="like-btn ${isLiked ? 'liked' : ''}" data-key="${key}">
                                ${isLiked ? '❤️ Liked' : '🤍 Like'}
                            </button>
                        </div>
                        <div class="expand-section">
                            <button class="view-more-btn">View More</button>
                            <div class="book-details hidden">
                                <p>${description}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Call the API initialization
    loadBooksFromAPI();
});
