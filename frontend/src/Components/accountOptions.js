import { useNavigate } from "react-router-dom";
import styles from "../ComponentStyles/accountOptions.module.css";
import { handleError, handleSuccess } from "../utils";

function AccountDetails({ open, onClose }) {
    const navigate = useNavigate();

    if (!open) return null;

    const handleLogout = async () => {
        try {
            const url = "http://localhost:9000/api/v1/auth/logout";
            const res = await fetch(url, {
                method: "POST",
                credentials: "include"
            });

            if (res.ok) {
                localStorage.removeItem("isLoggedIn");
                window.dispatchEvent(new Event("storage"));
                handleSuccess("Successfully logged out!!");
                onClose();
                setTimeout(() => {
                    navigate("/");
                }, 500);
            } else {
                handleError("Error logging out!!");
            }
        } catch(error) {
            handleError(error);
        }
    };

    return (
        <div className={styles.overlay} onClick={(e) => e.stopPropagation()}>
            <div className={styles.button} onClick={() => { onClose(); navigate('/profile'); }}>
                👤 Profile
            </div>
            <div className={styles.divider}></div>
            <div className={`${styles.button} ${styles.logoutBtn}`} onClick={handleLogout}>
                🚪 Logout
            </div>
        </div>
    );
}

export default AccountDetails;