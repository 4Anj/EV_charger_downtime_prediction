export async function predictFailure(sensorData) {
  const res = await fetch("http://127.0.0.1:8000/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sensorData),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Prediction failed");
  }

  return res.json();
}
