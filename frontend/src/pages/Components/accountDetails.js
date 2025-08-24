import { useNavigate } from "react-router-dom";

function AccountDetails({ open, onClose }) {
    const navigate = useNavigate();
    const OVERLAY = {
        position: "absolute",
        top: "65px",     // adjust based on your navbar height
        right: "25px",   // align with profile icon
        backgroundColor: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "10px",
        width: "150px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        zIndex: 1000,
    };

    const BUTTON = {
        padding: '10px',
        textAlign: 'center',
        cursor: 'pointer',
        fontSize: '20px',
    };

    const DIVIDER = {
        borderTop: '1px solid #000',
    };

    if (!open) return null;

    return (
        <div style={OVERLAY}>
            <div style={BUTTON} onClick={() => navigate('/profile')}>Profile</div>
            <div style={DIVIDER}></div>
            <div style={BUTTON} onClick={() => alert("Logout")}>Logout</div>
        </div>
    )
}
export default AccountDetails
