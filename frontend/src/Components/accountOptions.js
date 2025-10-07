import { useNavigate } from "react-router-dom";
import styles from "../ComponentStyles/accountOptions.module.css";
import { handleSuccess } from "../utils";

function AccountDetails({ open, onClose }) {
    const navigate = useNavigate();

    if (!open) return null;

    const handleLogout = () =>{
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("token");
        handleSuccess("Successfully logged out");

        setTimeout(() => {
            navigate("/");
        }, 750)
    };
    
    return (
        <div className={styles.overlay}>
            <div className={styles.button} onClick={() => navigate('/profile')}>Profile</div>
            <div className={styles.divider}></div>
            <div className={styles.button} onClick={ handleLogout }>Logout</div>
        </div>
    )
}
export default AccountDetails