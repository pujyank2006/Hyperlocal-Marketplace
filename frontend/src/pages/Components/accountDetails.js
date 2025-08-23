function AccountDetails({ open, onClose }) {
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

    const BODY = {
        padding: "8px 12px",
        cursor: "pointer",
    };

    if (!open) return null;
    return (
        <div style={OVERLAY}>
            <div style={BODY}>
                <div style={BUTTON}>profile</div>
                <div style={BUTTON}>logout</div>
            </div>
        </div>
    )
}
export default AccountDetails
