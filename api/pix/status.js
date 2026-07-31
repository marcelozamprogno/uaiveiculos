const INVICTUS_API_TOKEN = process.env.INVICTUS_API_TOKEN || "UZ2ivfjG3UiAtzSTmr40uU0WrTTjxwhwYJ6pUMurg7Y84F9lCZSCtaCmBz36";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const body = req.body || {};
    const data = body.data || body;
    const transactionId = data.transaction_id || req.query.transaction_id;

    if (!transactionId) {
      return res.status(400).json({ success: false, error: "ID da transação não fornecido." });
    }

    const invictusResponse = await fetch(
      `https://api.invictuspay.app.br/api/public/v1/transactions/${transactionId}?api_token=${INVICTUS_API_TOKEN}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      }
    );

    const responseText = await invictusResponse.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      return res.status(200).json({
        success: true,
        status: "pending",
        message: "Aguardando pagamento"
      });
    }

    const status = responseData.status || responseData.data?.status || "pending";
    const isPaid = status === "paid" || status === "approved" || status === "completed";

    return res.status(200).json({
      success: true,
      transaction_id: transactionId,
      status: isPaid ? "paid" : status,
      raw: responseData
    });
  } catch (err) {
    return res.status(200).json({
      success: true,
      status: "pending"
    });
  }
}
