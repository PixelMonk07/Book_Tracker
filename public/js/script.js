// Main JavaScript for Book Tracker

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initializeSorting();
    initializeFormValidation();
    initializeISBNLookup();
    initializeDeleteConfirmation();
    loadBookCovers();
});

// Sorting functionality
function initializeSorting() {
    const sortSelect = document.getElementById('sortBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortBy = this.value;
            const currentUrl = new URL(window.location);
            currentUrl.searchParams.set('sort', sortBy);
            window.location.href = currentUrl.toString();
        });

        // Set current sort value from URL
        const urlParams = new URLSearchParams(window.location.search);
        const currentSort = urlParams.get('sort');
        if (currentSort) {
            sortSelect.value = currentSort;
        }
    }
}

// Form validation
function initializeFormValidation() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
                return false;
            }
        });
    });
}

function validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    // Clear previous error states
    clearFormErrors(form);
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, 'This field is required');
            isValid = false;
        }
    });

    // Validate rating if present
    const ratingField = form.querySelector('#rating');
    if (ratingField && ratingField.value) {
        const rating = parseInt(ratingField.value);
        if (rating < 1 || rating > 5) {
            showFieldError(ratingField, 'Rating must be between 1 and 5');
            isValid = false;
        }
    }

    // Validate ISBN format if present
    const isbnField = form.querySelector('#isbn');
    if (isbnField && isbnField.value) {
        if (!isValidISBN(isbnField.value)) {
            showFieldError(isbnField, 'Please enter a valid ISBN (10 or 13 digits)');
            isValid = false;
        }
    }

    return isValid;
}

function showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '0.85rem';
    errorDiv.style.marginTop = '0.25rem';
    
    field.parentNode.appendChild(errorDiv);
}

function clearFormErrors(form) {
    const errorFields = form.querySelectorAll('.error');
    const errorMessages = form.querySelectorAll('.field-error');
    
    errorFields.forEach(field => field.classList.remove('error'));
    errorMessages.forEach(message => message.remove());
}

function isValidISBN(isbn) {
    // Remove any non-digit characters
    const cleanISBN = isbn.replace(/[^\d]/g, '');
    
    // Check if it's 10 or 13 digits
    return cleanISBN.length === 10 || cleanISBN.length === 13;
}

// ISBN Lookup functionality
function initializeISBNLookup() {
    const isbnLookupBtn = document.querySelector('.isbn-lookup-btn');
    if (isbnLookupBtn) {
        isbnLookupBtn.addEventListener('click', handleISBNLookup);
    }
}

async function handleISBNLookup() {
    const isbnField = document.getElementById('isbn');
    const isbn = isbnField.value.trim();
    
    if (!isbn) {
        showMessage('Please enter an ISBN first', 'error');
        return;
    }

    if (!isValidISBN(isbn)) {
        showMessage('Please enter a valid ISBN', 'error');
        return;
    }

    const lookupBtn = document.querySelector('.isbn-lookup-btn');
    const originalText = lookupBtn.textContent;
    
    try {
        lookupBtn.textContent = '...';
        lookupBtn.disabled = true;
        
        const response = await fetch(`/api/book-info/${isbn}`);
        const data = await response.json();
        
        if (data.success && data.book) {
            // Populate form fields with fetched data
            const titleField = document.getElementById('title');
            const authorField = document.getElementById('author');
            
            if (titleField && data.book.title) {
                titleField.value = data.book.title;
            }
            
            if (authorField && data.book.authors && data.book.authors.length > 0) {
                authorField.value = data.book.authors.join(', ');
            }
            
            showMessage('Book information found and populated!', 'success');
        } else {
            showMessage('Book not found. Please enter details manually.', 'warning');
        }
    } catch (error) {
        console.error('ISBN lookup error:', error);
        showMessage('Error looking up book. Please try again.', 'error');
    } finally {
        lookupBtn.textContent = originalText;
        lookupBtn.disabled = false;
    }
}

// Delete confirmation
function initializeDeleteConfirmation() {
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const bookTitle = this.closest('.book-card')?.querySelector('.book-title')?.textContent || 'this book';
            
            if (confirm(`Are you sure you want to delete "${bookTitle}"? This action cannot be undone.`)) {
                // Create and submit a form for DELETE request
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = this.href;
                
                const methodInput = document.createElement('input');
                methodInput.type = 'hidden';
                methodInput.name = '_method';
                methodInput.value = 'DELETE';
                
                form.appendChild(methodInput);
                document.body.appendChild(form);
                form.submit();
            }
        });
    });
}

// Load book covers
function loadBookCovers() {
    const bookCards = document.querySelectorAll('.book-card');
    
    bookCards.forEach(card => {
        const coverImg = card.querySelector('.book-cover');
        const isbn = card.dataset.isbn;
        
        if (coverImg && isbn && !coverImg.classList.contains('placeholder')) {
            // Try to load the cover image
            const img = new Image();
            img.onload = function() {
                coverImg.src = this.src;
                coverImg.style.opacity = '1';
            };
            img.onerror = function() {
                // If image fails to load, show placeholder
                showPlaceholderCover(coverImg);
            };
            
            // Start loading the image
            coverImg.style.opacity = '0.5';
            img.src = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
        } else if (coverImg) {
            showPlaceholderCover(coverImg);
        }
    });
}

function showPlaceholderCover(coverImg) {
    coverImg.classList.add('placeholder');
    coverImg.textContent = 'No Cover Available';
    coverImg.style.opacity = '1';
}

// Utility functions
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = message;
    
    // Style the message
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.padding = '1rem 1.5rem';
    messageDiv.style.borderRadius = '8px';
    messageDiv.style.zIndex = '1000';
    messageDiv.style.maxWidth = '400px';
    messageDiv.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    
    // Set colors based on type
    switch (type) {
        case 'success':
            messageDiv.style.background = '#d4edda';
            messageDiv.style.color = '#155724';
            messageDiv.style.border = '1px solid #c3e6cb';
            break;
        case 'error':
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.style.border = '1px solid #f5c6cb';
            break;
        case 'warning':
            messageDiv.style.background = '#fff3cd';
            messageDiv.style.color = '#856404';
            messageDiv.style.border = '1px solid #ffeaa7';
            break;
        default:
            messageDiv.style.background = '#d1ecf1';
            messageDiv.style.color = '#0c5460';
            messageDiv.style.border = '1px solid #bee5eb';
    }
    
    // Add to page
    document.body.appendChild(messageDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
    
    // Allow manual dismissal
    messageDiv.addEventListener('click', () => {
        messageDiv.remove();
    });
}

// Star rating helper
function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<span class="star">★</span>';
        } else {
            stars += '<span class="star empty">☆</span>';
        }
    }
    return stars;
}

// Format date helper
function formatDate(dateString) {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    return date.toLocaleDateString('en-US', options);
}

// Smooth scroll to top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Add scroll-to-top button functionality
document.addEventListener('scroll', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (scrollButton) {
        if (window.pageYOffset > 300) {
            scrollButton.style.display = 'block';
        } else {
            scrollButton.style.display = 'none';
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K for quick add
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const addButton = document.querySelector('.add-book-btn');
        if (addButton) {
            window.location.href = addButton.href;
        }
    }
    
    // Escape key to close modals or go back
    if (e.key === 'Escape') {
        const backButton = document.querySelector('.btn-secondary');
        if (backButton && backButton.textContent.includes('Back')) {
            window.history.back();
        }
    }
});

// Progressive enhancement for book cards
function enhanceBookCards() {
    const bookCards = document.querySelectorAll('.book-card');
    
    bookCards.forEach(card => {
        // Add click to view functionality (could expand to show more details)
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking on action buttons
            if (e.target.closest('.book-actions')) {
                return;
            }
            
            // Could add modal or expanded view here
            // For now, just add a subtle animation
            this.style.transform = 'scale(1.02)';
            setTimeout(() => {
                this.style.transform = '';
            }, 200);
        });
        
        // Add hover effect for better UX
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
        });
    });
}

// Initialize enhanced features after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    enhanceBookCards();
});

// Export functions for potential use in EJS templates
window.BookTracker = {
    generateStarRating,
    formatDate,
    showMessage,
    scrollToTop
};