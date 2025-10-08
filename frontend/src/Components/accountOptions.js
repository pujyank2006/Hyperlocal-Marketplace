import { useNavigate } from "react-router-dom";
import styles from "../ComponentStyles/accountOptions.module.css";
import { handleError, handleSuccess } from "../utils";

function AccountDetails({ open, onClose }) {
    const navigate = useNavigate();

    if (!open) return null;

    const handleLogout = async () => {
        try {
            const url = "http://localhost:9000/auth/logout"
            const res = await fetch(url, {
                method: "POST",
                credentials: "include"
            });

            if (res.ok) {
                localStorage.removeItem("isLoggedIn");
                handleSuccess("Successfully logged out!!")
                setTimeout(() => {
                    navigate("/");
                }, 750)
            } else {
                handleError("Error logging out!!")
            }
        } catch(error) {
            handleError(error);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.button} onClick={() => navigate('/profile')}>Profile</div>
            <div className={styles.divider}></div>
            <div className={styles.button} onClick={handleLogout}>Logout</div>
        </div>
    )
}
export default AccountDetails