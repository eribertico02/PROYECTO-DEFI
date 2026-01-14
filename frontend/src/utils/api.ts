const HOST = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const AUTH_URL = `http://${HOST}:4001`;
const P2P_URL = `http://${HOST}:4002`;
const BTC_ANCHOR_URL = `http://${HOST}:4003`;

// Helper for authenticated requests
const getAuthHeaders = () => {
    const token = localStorage.getItem('solaris_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

// --- Auth Functions ---

export const login = async (credentials: any) => {
    try {
        const res = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('solaris_token', data.token);
            localStorage.setItem('solaris_user', JSON.stringify(data.user));
        }
        return data;
    } catch (err) {
        console.error("Login error", err);
        return { error: "Connection failed" };
    }
};

export const register = async (userData: any) => {
    try {
        const res = await fetch(`${AUTH_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return await res.json();
    } catch (err) {
        console.error("Registration error", err);
        return { error: "Connection failed" };
    }
};

export const getUserProfile = async () => {
    try {
        const res = await fetch(`${AUTH_URL}/me`, {
            headers: getAuthHeaders()
        });
        return await res.json();
    } catch (err) {
        console.error("Profile error", err);
        return null;
    }
};

// --- P2P Functions ---

export const fetchOrders = async () => {
    try {
        const res = await fetch(`${P2P_URL}/orders`);
        return await res.json();
    } catch (err) {
        console.error("Error fetching orders", err);
        return [];
    }
};

export const createOrder = async (orderData: any) => {
    try {
        const res = await fetch(`${P2P_URL}/orders`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(orderData)
        });
        return await res.json();
    } catch (err) {
        console.error("Error creating order", err);
    }
};

// --- Bitcoin Timechain Anchoring Functions ---

export const anchorToBitcoin = async (assetHash: string, metadata: any) => {
    try {
        const res = await fetch(`${BTC_ANCHOR_URL}/anchor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assetHash, metadata })
        });
        return await res.json();
    } catch (err) {
        console.error('BTC anchor error:', err);
        return { error: 'Failed to anchor to Bitcoin Timechain' };
    }
};

export const getAnchorStatus = async (txid: string) => {
    try {
        const res = await fetch(`${BTC_ANCHOR_URL}/anchor/${txid}`);
        return await res.json();
    } catch (err) {
        console.error('Anchor status error:', err);
        return { error: 'Failed to fetch anchor status' };
    }
};

export const verifyHash = async (assetHash: string) => {
    try {
        const res = await fetch(`${BTC_ANCHOR_URL}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assetHash })
        });
        return await res.json();
    } catch (err) {
        console.error('Hash verification error:', err);
        return { error: 'Failed to verify hash' };
    }
};

export const getBitcoinHealth = async () => {
    try {
        const res = await fetch(`${BTC_ANCHOR_URL}/health`);
        return await res.json();
    } catch (err) {
        console.error('BTC health check error:', err);
        return { status: 'offline', error: err };
    }
};
