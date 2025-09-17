import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { jednostka, funkcja, email, name, recipients } = req.body;

  // Dane SMTP z ENV
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;

  // Odbiorcy przekazani w argumencie (może być string lub tablica)
  let to = recipients;
  if (Array.isArray(to)) to = to.join(",");
  if (!to) {
    return res.status(400).json({ error: "Brak odbiorców maila" });
  }

  if (!user || !pass) {
    return res.status(500).json({ error: "Brak konfiguracji maila" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  const subject = "Nowe konto na stronie HLM";
  const html = `
    <h2>Nowe konto na stronie HLM</h2>
    <p>Pojawiło się nowe konto na stronie HLM. Szczegóły wniosku:</p>
    <ul>
      <li><b>Wnioskowana drużyna:</b> ${jednostka}</li>
      <li><b>Imię i nazwisko:</b> ${name}</li>
      <li><b>Funkcja:</b> ${funkcja}</li>
      <li><b>Email:</b> ${email}</li>
    </ul>
  `;
  const text = `Nowe konto na stronie HLM\n\nWnioskowana drużyna: ${jednostka}\nImię i nazwisko: ${name}\nFunkcja: ${funkcja}\nEmail: ${email}`;

  try {
    await transporter.sendMail({
      from: `"Panel HLM" <${user}>`,
      to,
      subject,
      html,
      text,
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}