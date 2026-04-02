import React, { useState } from "react";

const SECTIONS = [
  {
    title: "1. Penerimaan Syarat",
    content: `Dengan mendaftar, mengakses, atau menggunakan layanan WealthPulse ("Layanan"), Anda menyatakan telah membaca, memahami, dan menyetujui Syarat & Ketentuan ini. Jika Anda tidak menyetujui bagian mana pun dari syarat ini, harap hentikan penggunaan Layanan.`,
  },
  {
    title: "2. Deskripsi Layanan",
    content: `WealthPulse adalah aplikasi manajemen kekayaan pribadi yang menyediakan fitur pelacakan portofolio, analisis investasi, perencanaan keuangan, dan konsultasi berbasis kecerdasan buatan (AI). Layanan tersedia dalam paket gratis (Free), berbayar (Pro dan Pro+), serta pembelian Pulse Credit untuk fitur premium.`,
  },
  {
    title: "3. Akun Pengguna",
    content: `Anda bertanggung jawab menjaga kerahasiaan akun dan kata sandi Anda. Anda setuju untuk segera memberitahu kami jika terjadi penggunaan akun yang tidak sah. WealthPulse tidak bertanggung jawab atas kerugian yang timbul akibat kelalaian dalam menjaga keamanan akun.`,
  },
  {
    title: "4. Harga & Pembayaran",
    content: `• Harga berlangganan ditampilkan dalam USD dan ditagih dalam IDR menggunakan kurs yang berlaku pada saat transaksi.\n• Pembayaran diproses melalui Midtrans sebagai payment gateway terpercaya dan terdaftar di Bank Indonesia.\n• Semua transaksi bersifat final setelah konfirmasi pembayaran berhasil.\n• WealthPulse berhak mengubah harga dengan pemberitahuan 30 hari sebelumnya.`,
  },
  {
    title: "5. Kebijakan Pengembalian Dana (Refund Policy)",
    content: `5.1 Berlangganan Pro & Pro+\n• Pengguna dapat mengajukan pengembalian dana dalam 3 × 24 jam setelah pembayaran pertama, selama fitur premium belum digunakan secara signifikan (kurang dari 3 sesi aktif).\n• Setelah 3 × 24 jam atau setelah fitur digunakan, pengembalian dana tidak dapat dilakukan.\n• Perpanjangan berlangganan dan pembelian upgrade tidak dapat di-refund.\n\n5.2 Pulse Credit\n• Pulse Credit yang telah dibeli bersifat tidak dapat dikembalikan (non-refundable) karena merupakan barang digital yang dikonsumsi secara instan.\n• Bonus Pulse dari program referral tidak memiliki nilai uang dan tidak dapat ditukar dengan uang tunai.\n\n5.3 Gangguan Teknis\n• Jika Pulse terpotong akibat gangguan teknis dari pihak WealthPulse (bukan karena koneksi internet pengguna), Pulse akan dikembalikan setelah investigasi dalam 7 hari kerja.\n• Pengajuan keluhan wajib dilakukan melalui email support dalam 7 hari kalender sejak kejadian.\n\n5.4 Cara Mengajukan Refund\n• Kirim email ke support@wealthpulse.app dengan subjek "Refund Request — [ID Pesanan]".\n• Sertakan: nama akun, email terdaftar, ID transaksi, dan alasan permohonan.\n• Proses refund diselesaikan dalam 7–14 hari kerja setelah persetujuan.\n• Dana dikembalikan ke metode pembayaran asal pengguna.`,
  },
  {
    title: "6. Penggunaan yang Dilarang",
    content: `Anda dilarang untuk:\n• Menggunakan Layanan untuk tujuan ilegal atau menyesatkan.\n• Menyalin, mendistribusikan, atau memodifikasi konten dan kode aplikasi tanpa izin tertulis.\n• Mencoba meretas, merusak, atau mengganggu sistem WealthPulse.\n• Membuat akun palsu atau menyalahgunakan program referral.`,
  },
  {
    title: "7. Pembatasan Tanggung Jawab",
    content: `WealthPulse menyediakan informasi dan analisis keuangan untuk tujuan edukasi dan perencanaan pribadi semata. Konten yang tersedia bukan merupakan saran investasi profesional. WealthPulse tidak bertanggung jawab atas keputusan keuangan yang diambil berdasarkan informasi dalam aplikasi. Kerugian investasi yang timbul sepenuhnya menjadi tanggung jawab pengguna.`,
  },
  {
    title: "8. Privasi Data",
    content: `Kami mengumpulkan dan memproses data pribadi sesuai dengan Kebijakan Privasi kami. Data keuangan Anda disimpan secara terenkripsi dan tidak akan dijual kepada pihak ketiga. Kami menggunakan Firebase (Google) sebagai infrastruktur penyimpanan data yang telah memenuhi standar keamanan internasional.`,
  },
  {
    title: "9. Perubahan Layanan & Syarat",
    content: `WealthPulse berhak mengubah, menangguhkan, atau menghentikan fitur Layanan kapan saja dengan pemberitahuan yang wajar. Perubahan Syarat & Ketentuan akan diberitahukan melalui aplikasi atau email setidaknya 14 hari sebelum berlaku. Penggunaan Layanan setelah perubahan berlaku dianggap sebagai persetujuan.`,
  },
  {
    title: "10. Hukum yang Berlaku",
    content: `Syarat & Ketentuan ini diatur dan ditafsirkan berdasarkan hukum Republik Indonesia. Setiap sengketa yang timbul akan diselesaikan melalui musyawarah mufakat. Apabila tidak tercapai kesepakatan, sengketa diselesaikan melalui Pengadilan Negeri Jakarta Selatan.`,
  },
  {
    title: "11. Kontak",
    content: `Untuk pertanyaan, keluhan, atau pengajuan refund, silakan hubungi kami:\n• Email: support@wealthpulse.app\n• Website: wealthpulse.app\n\nKami berkomitmen merespons setiap pertanyaan dalam 2 × 24 jam pada hari kerja.`,
  },
];

export default function TnCModal({ show, onClose, T, initialSection = null }) {
  const [openIdx, setOpenIdx] = useState(initialSection !== null ? initialSection : 4); // default open Refund Policy

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1200 }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: "min(520px, 95vw)", maxHeight: "88vh",
        background: T.surface, borderRadius: 16,
        border: `1px solid ${T.border}`,
        boxShadow: `0 24px 64px rgba(0,0,0,0.4)`,
        zIndex: 1201, display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px", borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: "bold", color: T.text }}>
              📋 Syarat, Ketentuan & Kebijakan Refund
            </div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
              WealthPulse · Terakhir diperbarui: April 2026
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: T.muted,
            fontSize: 22, cursor: "pointer", lineHeight: 1,
          }}>×</button>
        </div>

        {/* Content */}
        <div style={{ overflowY: "auto", padding: "12px 20px 20px", flex: 1 }}>
          {SECTIONS.map((sec, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                style={{
                  width: "100%", textAlign: "left", padding: "10px 14px",
                  borderRadius: 10, border: `1px solid ${openIdx === i ? T.accentSoft : T.border}`,
                  background: openIdx === i ? T.accentDim : T.card,
                  color: openIdx === i ? T.accent : T.text,
                  fontSize: 12, fontWeight: "bold", cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
              >
                {sec.title}
                <span style={{ fontSize: 10, color: T.muted }}>{openIdx === i ? "▲" : "▼"}</span>
              </button>
              {openIdx === i && (
                <div style={{
                  padding: "10px 14px", fontSize: 11, color: T.textSoft,
                  lineHeight: 1.8, whiteSpace: "pre-wrap",
                  background: T.bg, borderRadius: "0 0 10px 10px",
                  border: `1px solid ${T.border}`, borderTop: "none",
                }}>
                  {/* Highlight the Refund Policy section */}
                  {i === 4 ? (
                    <div>
                      {sec.content.split("\n").map((line, j) => (
                        <div key={j} style={{
                          marginBottom: line === "" ? 6 : 2,
                          color: line.startsWith("5.") ? T.text : T.textSoft,
                          fontWeight: line.startsWith("5.") ? "bold" : "normal",
                        }}>
                          {line}
                        </div>
                      ))}
                    </div>
                  ) : (
                    sec.content
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 20px", borderTop: `1px solid ${T.border}`,
          flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontSize: 10, color: T.muted }}>
            Pertanyaan: <span style={{ color: T.accent }}>support@wealthpulse.app</span>
          </div>
          <button onClick={onClose} style={{
            padding: "8px 18px", borderRadius: 9, border: "none",
            background: T.accent, color: T.bg, fontSize: 12, fontWeight: "bold",
            cursor: "pointer",
          }}>
            Saya Mengerti
          </button>
        </div>
      </div>
    </>
  );
}
