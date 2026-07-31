const INVICTUS_API_TOKEN = process.env.INVICTUS_API_TOKEN || "UZ2ivfjG3UiAtzSTmr40uU0WrTTjxwhwYJ6pUMurg7Y84F9lCZSCtaCmBz36";
const OFFER_HASH = "qwkgxofjwk";
const PRODUCT_HASH = "q4u7vhdt8i";
const PRODUCT_TITLE = "Repasses UAI Veículos - Vaga VIP";
const DEFAULT_PRICE_CENTS = 4990;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método não permitido" });
  }

  try {
    const body = req.body || {};
    const data = body.data || body;
    const { name, cpf, phone, email, zip_code, street_name, number, neighborhood, city, state, tracking } = data;

    // Clean formatting
    const cleanCpf = (cpf || "").toString().replace(/\D/g, "");
    const cleanPhone = (phone || "").toString().replace(/\D/g, "");
    const cleanName = (name || "").trim();
    const cleanEmail = (email || "").trim() || `${cleanPhone || "cliente"}@cliente.com`;
    const cleanState = (state || "SP").trim().toUpperCase().slice(0, 2);
    const cleanZip = (zip_code || "01001000").toString().replace(/\D/g, "");

    // Validation
    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ success: false, error: "Nome completo é obrigatório." });
    }
    if (!cleanCpf || cleanCpf.length !== 11) {
      return res.status(400).json({ success: false, error: "CPF inválido. Informe 11 dígitos." });
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({ success: false, error: "Telefone com DDD é obrigatório." });
    }

    const host = req.headers.host || "uaiveiculos-ztbn.vercel.app";
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const siteUrl = process.env.SITE_URL || `${protocol}://${host}`;

    const invictusPayload = {
      amount: DEFAULT_PRICE_CENTS,
      offer_hash: OFFER_HASH,
      payment_method: "pix",
      customer: {
        name: cleanName,
        email: cleanEmail,
        phone_number: cleanPhone,
        document: cleanCpf,
        street_name: street_name || "Rua Principal",
        number: number || "100",
        complement: "",
        neighborhood: neighborhood || "Centro",
        city: city || "São Paulo",
        state: cleanState,
        zip_code: cleanZip
      },
      cart: [
        {
          product_hash: PRODUCT_HASH,
          title: PRODUCT_TITLE,
          cover: null,
          price: DEFAULT_PRICE_CENTS,
          quantity: 1,
          operation_type: 1,
          tangible: false
        }
      ],
      expire_in_days: 1,
      transaction_origin: "api",
      tracking: {
        src: tracking?.src || "",
        utm_source: tracking?.utm_source || "",
        utm_medium: tracking?.utm_medium || "",
        utm_campaign: tracking?.utm_campaign || "",
        utm_term: tracking?.utm_term || "",
        utm_content: tracking?.utm_content || ""
      },
      postback_url: `${siteUrl}/api/webhook/invictuspay`
    };

    const invictusResponse = await fetch(
      `https://api.invictuspay.app.br/api/public/v1/transactions?api_token=${INVICTUS_API_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(invictusPayload)
      }
    );

    const responseText = await invictusResponse.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error("Invictus non-json response:", responseText);
      return res.status(502).json({
        success: false,
        error: "Resposta inválida da plataforma de pagamento."
      });
    }

    if (!invictusResponse.ok || (responseData.status === "error" || responseData.success === false)) {
      const msg = responseData.message || responseData.error || responseData.errors?.[0] || "Falha ao gerar o PIX na Invictus Pay.";
      return res.status(invictusResponse.status || 400).json({
        success: false,
        error: msg
      });
    }

    // Extract Pix data from Invictus Pay JSON structure
    const pixData = responseData.data || responseData.pix || responseData;
    const transactionId = responseData.id || responseData.transaction_id || pixData.id || pixData.transaction_id || responseData.hash;
    const pixCode = pixData.pix_code || pixData.qrcode || pixData.qr_code || pixData.emv || pixData.copy_paste || responseData.pix_code;
    const qrCodeUrl = pixData.pix_url || pixData.qr_code_url || pixData.qrcode_url || responseData.pix_url;
    const expirationDate = pixData.expiration_date || responseData.expiration_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return res.status(200).json({
      success: true,
      transaction_id: transactionId,
      provider: "invictuspay",
      pix_code: pixCode,
      pix_url: qrCodeUrl,
      expiration_date: expirationDate,
      status: "pending",
      raw: responseData
    });
  } catch (err) {
    console.error("Internal Error creating Pix:", err);
    return res.status(500).json({
      success: false,
      error: "Erro interno no servidor ao processar pagamento PIX."
    });
  }
}
