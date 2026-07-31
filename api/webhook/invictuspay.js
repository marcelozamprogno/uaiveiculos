const processedEvents = new Set();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const payload = req.body || {};
    const eventId = payload.id || payload.transaction_id || payload.data?.id;

    if (eventId && processedEvents.has(eventId + "_" + (payload.status || payload.event))) {
      return res.status(200).json({ status: "already_processed" });
    }

    const status = payload.status || payload.event || payload.data?.status;
    const isPaid = status === "paid" || status === "approved" || status === "completed" || status === "payment.approved";

    if (eventId) {
      processedEvents.add(eventId + "_" + status);
    }

    console.log(`[Webhook InvictusPay] Transaction ${eventId}: status ${status} (IsPaid: ${isPaid})`);

    return res.status(200).json({
      received: true,
      transaction_id: eventId,
      status: isPaid ? "paid" : status
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return res.status(500).json({ error: "Internal webhook error" });
  }
}
