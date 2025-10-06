import { useNavigate } from "react-router-dom";
import styles from "../ComponentStyles/accountDetails.module.css";

function AccountDetails({ open, onClose }) {
    const navigate = useNavigate();

    if (!open) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.button} onClick={() => navigate('/profile')}>Profile</div>
            <div className={styles.divider}></div>
            <div className={styles.button} onClick={() => alert("Logout")}>Logout</div>
        </div>
    )
}
export default AccountDetails