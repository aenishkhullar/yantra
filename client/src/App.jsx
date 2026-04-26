import { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setData(data.message))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h1>Yantra Backend Test</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default App;