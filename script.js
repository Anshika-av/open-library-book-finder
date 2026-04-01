document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultsGrid = document.getElementById('results-grid');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (!query) return;

        await fetchBooks(query);
    });

    async function fetchBooks(query) {
        // UI Reset
        resultsGrid.innerHTML = '';
        errorMessage.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');

        try {
            // Using the Open Library search valid endpoint
            const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`);
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            
            if (data.numFound === 0 || !data.docs || data.docs.length === 0) {
                showError(`No books found for "${query}". Try another search.`);
                return;
            }

            renderBooks(data.docs);

        } catch (error) {
            console.error('Error fetching data:', error);
            showError('An error occurred while fetching data. Please try again later.');
        } finally {
            loadingSpinner.classList.add('hidden');
        }
    }

    function renderBooks(books) {
        const fragment = document.createDocumentFragment();

        books.forEach((book, index) => {
            const card = document.createElement('div');
            card.className = 'book-card';
            // Stagger animation delay
            card.style.animationDelay = `${index * 0.05}s`;

            const title = book.title || 'Unknown Title';
            const author = book.author_name ? book.author_name.join(', ') : 'Unknown Author';
            const year = book.first_publish_year || 'Unknown Year';
            
            // Cover logic
            let coverHTML = '';
            if (book.cover_i) {
                const coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;
                coverHTML = `<img src="${coverUrl}" alt="Cover of ${title}" class="book-cover" loading="lazy">`;
            } else {
                coverHTML = `
                    <div class="no-cover">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>No Cover</span>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="book-cover-wrapper">
                    ${coverHTML}
                </div>
                <div class="book-info">
                    <h3 class="book-title" title="${title}">${title}</h3>
                    <p class="book-author">${author}</p>
                    <div class="book-meta">
                        <span class="book-year">${year}</span>
                    </div>
                </div>
            `;

            fragment.appendChild(card);
        });

        resultsGrid.appendChild(fragment);
    }

    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
    }
});
