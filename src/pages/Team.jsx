const team = [
  { name: "Anand Kumar", role: "Full Stack Developer" },
  { name: "Team Member 2", role: "Backend Developer" },
  { name: "Team Member 3", role: "Data Scientist" },
  { name: "Team Member 4", role: "Medical Advisor" },
];

export default function Team() {
  return (
    <div className="page">
      <h1>Our Team</h1>
      <div className="card-grid">
        {team.map((m) => (
          <div className="card member" key={m.name}>
            <div className="avatar">{m.name.charAt(0)}</div>
            <h3>{m.name}</h3>
            <p>{m.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
