import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: send `form` to your backend (e.g. POST /api/contact)
    console.log("Contact form:", form);
    setSent(true);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="page">
      <h1>Contact Us</h1>
      {sent && <p className="success">Thanks! Your message has been received.</p>}
      <form className="contact-form" onSubmit={onSubmit}>
        <label>
          Name
          <input name="name" value={form.name} onChange={onChange} required />
        </label>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={onChange} required />
        </label>
        <label>
          Message
          <textarea name="message" rows="5" value={form.message} onChange={onChange} required />
        </label>
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
