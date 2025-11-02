export default async function handler(req, res) {
  const n8nWebhookUrl =
    "https://n8n.carmax-n8n.uk/webhook/1ea3a427-ea77-465f-bd20-eab8d59ec967";

  try {
    if (req.body.id != "incognito") {
      const response = await fetch(n8nWebhookUrl, {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      res.status(404).json({ error: "You need to login" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to forward request to n8n" });
  }
}
