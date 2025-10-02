// patient-management-app/backend/utils/emailService.js
const sgMail = require("@sendgrid/mail");
const { format } = require("date-fns"); // Tetap gunakan format dasar date-fns
const { formatInTimeZone, utcToZonedTime } = require("date-fns-tz"); // <--- TAMBAHKAN INI
const { id } = require("date-fns/locale"); // Untuk lokal Indonesia

// Zona Waktu Jakarta (WIB)
const TIME_ZONE_JAKARTA = "Asia/Jakarta";

// Mengambil kredensial email dari environment variables
const senderEmail = process.env.SENDER_EMAIL; // Alamat email pengirim (harus diverifikasi di SendGrid)
const sendGridApiKey = process.env.SENDGRID_API_KEY; // API Key SendGrid
const receiverEmail = process.env.RECEIVER_EMAIL;

// Pastikan semua variabel lingkungan penting sudah disetel
if (!senderEmail || !sendGridApiKey || !receiverEmail) {
  console.error(
    "ERROR: Email environment variables (SENDER_EMAIL, SENDGRID_API_KEY, RECEIVER_EMAIL) are not fully configured. Skipping email notifications."
  );
}

// Konfigurasi SendGrid API Key
sgMail.setApiKey(sendGridApiKey);

// Fungsi untuk menghitung umur (kita akan pakai ini untuk konsistensi)
const calculateAge = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Fungsi untuk mengirim email notifikasi pasien baru
const sendNewPatientNotification = async (patientData) => {
  if (!senderEmail || !sendGridApiKey || !receiverEmail) {
    console.error(
      "SendGrid email service is not configured. Skipping email notification for new patient."
    );
    return;
  }

  try {
    // --- Konversi dan Format Tanggal ke Zona Waktu Jakarta ---
    const tglLahir = patientData.tanggalLahir
      ? new Date(patientData.tanggalLahir)
      : null;
    const tglDaftar = patientData.tanggalDaftar
      ? new Date(patientData.tanggalDaftar)
      : null;

    const formattedTanggalLahir =
      tglLahir && !isNaN(tglLahir)
        ? formatInTimeZone(tglLahir, TIME_ZONE_JAKARTA, "dd MMMM yyyy", {
            locale: id,
          })
        : "-";

    const formattedTanggalDaftar =
      tglDaftar && !isNaN(tglDaftar)
        ? formatInTimeZone(
            tglDaftar,
            TIME_ZONE_JAKARTA,
            "dd MMMM yyyy, HH:mm:ss",
            { locale: id }
          ) + " WIB"
        : "-";
    // -----------------------------------------------------

    const msg = {
      to: receiverEmail,
      from: {
        name: "Klinik AZ",
        email: senderEmail,
      },
      subject: `NOTIFIKASI: Pasien Terdaftar di Klinik AZ - ${patientData.nama}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #0056b3;">Pemberitahuan Pasien Baru</h2>
          <p>Seorang pasien telah berhasil terdaftar di sistem manajemen pasien Klinik AZ.</p>
          <p>Berikut adalah detail singkat pasien:</p>
          <ul style="list-style-type: none; padding: 0;">
            <li><strong>No. Kartu:</strong> ${patientData.noKartu}</li>
            <li><strong>Nama:</strong> ${patientData.nama}</li>
            <li><strong>Tanggal Lahir:</strong> ${formattedTanggalLahir}</li>
            <li><strong>Umur:</strong> ${
              patientData.tanggalLahir
                ? calculateAge(patientData.tanggalLahir)
                : "-"
            } tahun</li>
            <li><strong>Jenis Kelamin:</strong> ${patientData.jenisKelamin}</li>
            <li><strong>No. HP:</strong> ${patientData.noHP}</li>
            <li><strong>Tanggal Daftar:</strong> ${formattedTanggalDaftar}</li>
            <li><strong>Petugas Pendaftaran:</strong> ${
              patientData.petugasPendaftaran
            }</li>
          </ul>
          <p>Silakan login ke sistem untuk melihat detail lengkapnya.</p>
          <p>Terima kasih,</p>
          <p>© 2025 Klinik AZ. All rights reserved.</p>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log("Email notifikasi pasien baru berhasil dikirim via SendGrid.");
  } catch (error) {
    console.error(
      "Gagal mengirim email notifikasi pasien baru via SendGrid:",
      error.response ? error.response.body : error
    );
  }
};

module.exports = {
  sendNewPatientNotification,
};
