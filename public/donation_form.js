

document.getElementById("paymentMethod").addEventListener("change", function () {
    const value = this.value;
    document.getElementById("qrCodeSection").style.display = "none";
    document.getElementById("bankTransferSection").style.display = "none";
    document.getElementById("cashSection").style.display = "none";

    if (value === "qr_code") {
        document.getElementById("qrCodeSection").style.display = "block";
    } else if (value === "bank_transfer") {
        document.getElementById("bankTransferSection").style.display = "block";
    } else if (value === "cash") {
        document.getElementById("cashSection").style.display = "block";
    }
});

window.onload = () => {

    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0]

}
