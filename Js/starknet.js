// js/starknet.js

const starknetService = {
    starknet: null,
    account: null,
    address: null,
    walletId: null,
    isDappLoggedIn: false, // Tracks if user has completed the dApp-specific login (signing)

    async starknetConnect() {
        console.log("[StarkTask] starknetConnect: CALLED");
        try {
            const { connect } = await import('get-starknet');
            const wallet = await connect({ modalMode: 'alwaysAsk', modalTheme: 'dark' });

            if (!wallet) {
                console.warn("[StarkTask] starknetConnect: Wallet selection cancelled.");
                return;
            }
            await wallet.enable({ starknetVersion: "v5" }); // Or "v6"

            this.starknet = wallet;
            this.account = wallet.account;
            this.address = wallet.selectedAddress || wallet.account.address;
            this.walletId = wallet.id;
            this.isDappLoggedIn = false; // CRITICAL: Reset dApp login status on new wallet connection

            console.log("[StarkTask] starknetConnect: Wallet connected. Address:", this.address);
            this.updateAccountMenuUI(); // Central UI update function
            this.dispatchWalletEvent('walletConnected', { address: this.address, walletId: this.walletId });

        } catch (error) {
            console.error("[StarkTask] starknetConnect: Error:", error);
            this.resetWalletState(); // Resets isDappLoggedIn too
            this.updateAccountMenuUI();
        }
    },

    async disconnectWallet() {
        console.log("[StarkTask] disconnectWallet: CALLED");
        try {
            const { disconnect } = await import('get-starknet');
            await disconnect({ clearLastWallet: true });
            console.log("[StarkTask] disconnectWallet: Wallet disconnected via get-starknet.");
        } catch (error) {
            console.error("[StarkTask] disconnectWallet: Error during get-starknet disconnect:", error);
        } finally {
            this.resetWalletState(); // Resets isDappLoggedIn to false
            this.updateAccountMenuUI();
            this.dispatchWalletEvent('walletDisconnected');
            this.dispatchWalletEvent('dappLoggedOut'); // Explicit event for dApp logout
            console.log("[StarkTask] disconnectWallet: Local state and UI reset.");
        }
    },

    async checkConnectionOnLoad() {
        console.log("[StarkTask] checkConnectionOnLoad: Checking...");
        try {
            const { connect } = await import('get-starknet');
            const wallet = await connect({ showList: false });

            if (wallet && wallet.isConnected && (wallet.selectedAddress || wallet.account.address)) {
                await wallet.enable({ starknetVersion: "v5" });
                this.starknet = wallet;
                this.account = wallet.account;
                this.address = wallet.selectedAddress || wallet.account.address;
                this.walletId = wallet.id;
                // this.isDappLoggedIn = false; // Default: Require dApp login signature on every page load/refresh
                                            // For a better UX with persistent dApp login, you'd check a session token here.
                                            // For now, this ensures "Login (Sign)" is presented.

                console.log("[StarkTask] checkConnectionOnLoad: Wallet reconnected:", this.walletId);
                this.updateAccountMenuUI();
                this.dispatchWalletEvent('walletConnected', { address: this.address, walletId: this.walletId });
            } else {
                console.log("[StarkTask] checkConnectionOnLoad: No persistent wallet connection.");
                this.resetWalletState(); // Resets isDappLoggedIn to false
                this.updateAccountMenuUI();
            }
        } catch (error) {
            console.warn("[StarkTask] checkConnectionOnLoad: Could not silently reconnect:", error.message);
            this.resetWalletState(); // Resets isDappLoggedIn to false
            this.updateAccountMenuUI();
        }
    },

    resetWalletState() {
        console.log("[StarkTask] resetWalletState: Clearing wallet state.");
        this.starknet = null;
        this.account = null;
        this.address = null;
        this.walletId = null;
        this.isDappLoggedIn = false; // CRITICAL: Reset dApp login status
    },

    // Central UI update function for the account menu
    updateAccountMenuUI() {
        console.log("[StarkTask] updateAccountMenuUI: Wallet Connected:", !!this.address, "DApp Logged In:", this.isDappLoggedIn);
        const connectButton = document.getElementById('starknet-connect');
        const walletInfoDiv = document.getElementById('starknet-wallet'); // This is the main container for address, login, disconnect
        const addressDiv = walletInfoDiv?.querySelector('.address');
        const walletIconImg = walletInfoDiv?.querySelector('.icon');
        const loginButtonContainer = document.getElementById('login-button-container');
        const loginButton = loginButtonContainer?.querySelector('.login');
        const disconnectButtonContainer = document.getElementById('disconnect-button-container');

        if (this.address) { // Wallet is connected
            if (connectButton) connectButton.style.display = 'none';
            if (walletInfoDiv) walletInfoDiv.style.display = 'flex'; // Show the whole wallet info section

            // Display address and icon
            if (addressDiv) {
                addressDiv.textContent = `${this.address.substring(0, 6)}...${this.address.substring(this.address.length - 4)}`;
                addressDiv.setAttribute('title', this.address);
            }
            if (walletIconImg) {
                const iconBasePath = './assets/icons/';
                const walletIconFile = this.walletId === 'argentX' ? 'argentX.png'
                                    : this.walletId === 'braavos' ? 'braavos.png'
                                    : 'default_wallet.png';
                walletIconImg.src = `${iconBasePath}${walletIconFile}`;
                walletIconImg.alt = this.walletId || 'Wallet';
                walletIconImg.style.display = 'inline-block';
            }

            // Handle Login Button state
            if (loginButtonContainer && loginButton) {
                if (this.isDappLoggedIn) {
                    // User has completed dApp sign-in
                    loginButton.textContent = 'Signed In';
                    loginButton.disabled = true; // Prevent re-clicking
                    loginButtonContainer.style.display = 'inline-block'; // Or hide if preferred: 'none'
                    console.log("[StarkTask] UI: User is DApp Logged In. Login button shows 'Signed In'.");
                } else {
                    // User has connected wallet, but not yet dApp signed-in
                    loginButton.textContent = 'Login (Sign)';
                    loginButton.disabled = false;
                    loginButtonContainer.style.display = 'inline-block'; // Make sure it's visible
                    console.log("[StarkTask] UI: Wallet connected, awaiting DApp Login. 'Login (Sign)' button active.");
                }
            }
            if(disconnectButtonContainer) disconnectButtonContainer.style.display = 'inline-block'; // Always show disconnect when wallet is connected

        } else { // Wallet is NOT connected
            if (connectButton) connectButton.style.display = 'inline-block'; // Show "Connect Wallet"
            if (walletInfoDiv) walletInfoDiv.style.display = 'none'; // Hide the wallet info section (address, login, disconnect)
            console.log("[StarkTask] UI: Wallet is disconnected. 'Connect Wallet' button visible.");
        }
    },

    async login() {
        console.log("[StarkTask] login: CALLED. Current wallet address:", this.address, "Is DApp Logged In:", this.isDappLoggedIn);
        if (!this.account || !this.address) {
            alert("Wallet not connected. Please connect your StarkNet wallet first.");
            this.updateAccountMenuUI(); // Ensure UI reflects disconnected state
            return;
        }
        if (this.isDappLoggedIn) {
            console.log("[StarkTask] login: User is already DApp logged in. No action taken.");
            // alert("You are already signed in."); // Optional: give feedback
            return; // No need to sign again if already dApp logged in
        }

        try {
            if (!this.starknet || !this.starknet.provider) {
                console.error("[StarkTask] login: Starknet provider not available.");
                alert("Login failed: Starknet provider is not available. Please reconnect wallet.");
                return;
            }
            const chainId = await this.starknet.provider.getChainId();
            const typedDataToSign = {
                domain: { name: "StarkTask", version: "1", chainId: chainId },
                types: {
                    StarkNetDomain: [ { name: "name", type: "felt" }, { name: "version", type: "felt" }, { name: "chainId", type: "felt" } ],
                    Login: [ { name: "action", type: "felt" }, { name: "timestamp", type: "felt" } ]
                },
                primaryType: "Login",
                message: { action: "User Login Auth StarkTask", timestamp: Math.floor(Date.now() / 1000).toString() }
            };

            console.log("[StarkTask] login: Attempting to sign typed data:", JSON.stringify(typedDataToSign, null, 2));
            const signature = await this.account.signTypedData(typedDataToSign);
            console.log("[StarkTask] login: Signature obtained successfully:", signature);
            alert("Login Signature Successful! You are now signed in to StarkTask.");

            this.isDappLoggedIn = true; // Set dApp login status
            this.updateAccountMenuUI(); // CRITICAL: Update UI to reflect new dApp login state
            this.dispatchWalletEvent('dappLoggedIn', { address: this.address });

            // HERE you would "unlock" main app features
            // e.g., document.getElementById('taskCreationSection').style.display = 'block';

        } catch (error) {
            console.error("[StarkTask] login: Error during signing process:", error);
            alert(`Login signing failed: ${error.message || 'An unknown error occurred.'}`);
            this.isDappLoggedIn = false; // Ensure it's false on error
            this.updateAccountMenuUI(); // Update UI to show "Login (Sign)" still needed
        }
    },

    dispatchWalletEvent(eventName, detail = {}) {
        document.dispatchEvent(new CustomEvent(`starknetWallet:${eventName}`, { detail }));
    }
};

window.starknetService = starknetService;

document.addEventListener('DOMContentLoaded', () => {
    console.log("[StarkTask] DOMContentLoaded: Initializing.");
    if (window.starknetService) {
        // Call the central UI update function initially to set the correct state
        // before checkConnectionOnLoad potentially changes it.
        window.starknetService.updateAccountMenuUI();
        window.starknetService.checkConnectionOnLoad();
    } else {
        console.error("[StarkTask] DOMContentLoaded: starknetService not found!");
    }
});