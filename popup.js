document.addEventListener('DOMContentLoaded', () => {
    const tokenInput = document.getElementById('tokenInput');
    const loginButton = document.getElementById('loginButton');
    const errorMessageDiv = document.getElementById('errorMessage');
    const closeButton = document.getElementById('closeButton');

    // Close popup
    closeButton.addEventListener('click', () => {
        window.close();
    });

    // Clear error on input
    tokenInput.addEventListener('input', () => {
        errorMessageDiv.textContent = '';
        tokenInput.classList.remove('error');
    });

    // Login button click
    loginButton.addEventListener('click', async () => {
        const token = tokenInput.value.trim();

        // Clear previous errors
        errorMessageDiv.textContent = '';
        tokenInput.classList.remove('error');

        if (!token) {
            errorMessageDiv.textContent = 'Token cannot be empty.';
            tokenInput.classList.add('error');
            return;
        }

        // Disable button while processing
        loginButton.disabled = true;
        loginButton.textContent = 'Logging in...';

        try {
            // Send token to background script for validation and login
            const response = await chrome.runtime.sendMessage({ 
                action: 'loginWithToken', 
                token: token 
            });

            if (response.success) {
                errorMessageDiv.textContent = 'Login successful! Closing...';
                errorMessageDiv.style.color = '#43b581'; // Discord green for success
                // Close popup after a short delay
                setTimeout(() => {
                    window.close();
                }, 1500);
            } else {
                errorMessageDiv.textContent = response.message || 'Login failed. Invalid token?';
                tokenInput.classList.add('error');
                loginButton.disabled = false;
                loginButton.textContent = 'Login';
            }
        } catch (error) {
            console.error('Error communicating with background script:', error);
            errorMessageDiv.textContent = 'An error occurred. Check console.';
            tokenInput.classList.add('error');
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        }
    });
});

