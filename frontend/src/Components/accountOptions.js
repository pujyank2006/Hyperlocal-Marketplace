import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "../ComponentStyles/accountOptions.module.css";
import { handleError, handleSuccess } from "../utils";

function AccountDetails({ open, onClose }) {
    const navigate = useNavigate();
    const { logout } = useAuth();

    if (!open) return null;

    const handleLogout = async () => {
        try {
            await logout();
            handleSuccess("Successfully logged out!");
            onClose();
            navigate("/login");
        } catch (error) {
            console.error("Logout error:", error);
            handleError("Error logging out!");
        }
    };

    return (
        <div className={styles.overlay} onClick={(e) => e.stopPropagation()}>
            <div className={styles.button} onClick={() => { onClose(); navigate('/profile'); }}>
                👤 Profile Details
            </div>
            <div className={styles.button} onClick={() => { onClose(); navigate('/profile?tab=wishlist'); }}>
                ❤️ My Wishlist
            </div>
            <div className={styles.button} onClick={() => { onClose(); navigate('/profile?tab=alerts'); }}>
                🔔 Saved Search Alerts
            </div>
            <div className={styles.divider}></div>
            <div className={`${styles.button} ${styles.logoutBtn}`} onClick={handleLogout}>
                🚪 Logout
            </div>
        </div>
    );
}

export default AccountDetails;