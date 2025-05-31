// background.js

// Function to attempt login by injecting token into localStorage
async function attemptLogin(token, tabId) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (authToken) => {
                // This function runs in the context of the Discord page
                localStorage.setItem("token", `"${authToken}"`);
                // Optional: Reload the page to apply the token
                // window.location.reload(); 
                // Or navigate if not already on Discord
                // if (!window.location.href.startsWith("https://discord.com")) {
                //     window.location.href = "https://discord.com/app";
                // }
            },
            args: [token]
        });
        console.log("Token injection script executed for tab:", tabId);
        return true;
    } catch (error) {
        console.error(`Failed to execute script on tab ${tabId}:`, error);
        // Common error: Cannot access contents of url "chrome://..." or other restricted pages.
        // Extension manifest must have host permissions for "https://discord.com/*"
        return false;
    }
}

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "loginWithToken") {
        const token = message.token;

        // 1. Validate the token by fetching user info from Discord API
        fetch("https://discord.com/api/v9/users/@me", {
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            }
        })
        .then(response => {
            if (response.ok) {
                // Token is valid
                console.log("Token validation successful.");
                // 2. Find Discord tabs and attempt to inject the token
                chrome.tabs.query({ url: "https://discord.com/*" }, (tabs) => {
                    if (tabs.length > 0) {
                        // Attempt login on the first found Discord tab
                        attemptLogin(token, tabs[0].id).then(success => {
                            if (success) {
                                // Optional: Reload the tab after successful injection
                                chrome.tabs.reload(tabs[0].id);
                                sendResponse({ success: true });
                            } else {
                                sendResponse({ success: false, message: "Failed to inject token. Is Discord open?" });
                            }
                        });
                    } else {
                        // No Discord tab found, maybe open one?
                        // For simplicity, we'll just report success but mention no tab was found.
                        // A better approach might be to open discord.com/app
                        console.log("Token valid, but no active Discord tab found to inject into.");
                        // We can still *try* to set it globally via background, though less reliable
                        // localStorage.setItem("token", `"${token}"`); // This won't work in service workers
                        // Instead, we could store it in chrome.storage and have a content script apply it?
                        // For now, just indicate success as token is valid.
                        sendResponse({ success: true, message: "Token valid, but no Discord tab found." });
                        // Alternative: Open a new Discord tab
                        // chrome.tabs.create({ url: "https://discord.com/app" }).then(newTab => {
                        //     // Wait a bit for the tab to load, then try injecting
                        //     setTimeout(() => {
                        //         attemptLogin(token, newTab.id).then(success => {
                        //              sendResponse({ success: success, message: success ? "Opened Discord and logged in." : "Opened Discord but failed to inject." });
                        //         });
                        //     }, 2000); // Adjust delay as needed
                        // });
                    }
                });
            } else {
                // Token is invalid
                console.log("Token validation failed. Status:", response.status);
                sendResponse({ success: false, message: "Invalid token." });
            }
        })
        .catch(error => {
            console.error("Error during token validation fetch:", error);
            sendResponse({ success: false, message: "Network error during validation." });
        });

        // Return true to indicate you wish to send a response asynchronously
        return true; 
    }
});

console.log("Discord Token Login background script loaded.");

