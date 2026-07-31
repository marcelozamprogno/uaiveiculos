const INVICTUS_API_TOKEN = process.env.INVICTUS_API_TOKEN || "UZ2ivfjG3UiAtzSTmr40uU0WrTTjxwhwYJ6pUMurg7Y84F9lCZSCtaCmBz36";
const OFFER_HASH = process.env.INVICTUS_OFFER_HASH || "qwkgxofjwk";
const PRODUCT_HASH = process.env.INVICTUS_PRODUCT_HASH || "q4u7vhdt8i";
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
    let body = {};
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    } catch (e) {
      body = {};
    }

    const data = body.data || body;
    const { name, cpf, phone, email, zip_code, street_name, number, neighborhood, city, state, tracking } = data;

    const cleanCpf = (cpf || "").toString().replace(/\D/g, "");
    const cleanPhone = (phone || "").toString().replace(/\D/g, "");
    const cleanName = (name || "").trim() || "Comprador VIP";
    const cleanEmail = (email || "").trim() || `${cleanPhone || "cliente"}@cliente.com`;
    const cleanState = (state || "SP").trim().toUpperCase().slice(0, 2);
    const cleanZip = (zip_code || "01001000").toString().replace(/\D/g, "");

    const host = req.headers.host || "uaiveiculos.vercel.app";
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

    const invictusUrl = `https://api.invictuspay.app.br/api/public/v1/transactions?api_token=${INVICTUS_API_TOKEN}`;

    const invictusResponse = await fetch(invictusUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(invictusPayload)
    });

    const responseText = await invictusResponse.text();
    let responseData = {};
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      return res.status(200).json({
        success: false,
        error: "Resposta da Invictus não é JSON: " + responseText.slice(0, 100)
      });
    }

    if (!invictusResponse.ok || responseData.status === "error" || responseData.success === false) {
      const msg = responseData.message || responseData.error || (responseData.errors ? JSON.stringify(responseData.errors) : "Falha ao gerar o PIX na Invictus Pay.");
      return res.status(200).json({
        success: false,
        error: msg,
        details: responseData
      });
    }

    const pixData = responseData.data || responseData.pix || responseData;
    const transactionId = responseData.id || responseData.transaction_id || responseData.hash || pixData.id || pixData.hash || pixData.transaction_id;
    const pixCode = pixData.pix_code || pixData.qrcode || pixData.qr_code || pixData.emv || pixData.copy_paste || responseData.pix_code || responseData.copy_paste;
    const qrCodeUrl = pixData.pix_url || pixData.qr_code_url || pixData.qrcode_url || responseData.pix_url || responseData.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCode || "")}`;
    const qrCodeImage = pixData.qr_code_image || pixData.qrcode_image || qrCodeUrl;
    const expirationDate = pixData.expiration_date || responseData.expiration_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return res.status(200).json({
      success: true,
      transaction_id: transactionId,
      provider: "invictuspay",
      pix_code: pixCode,
      pix_url: qrCodeUrl,
      qr_code_image: qrCodeImage,
      expiration_date: expirationDate,
      status: "pending",
      raw: responseData
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      error: "Erro no backend: " + (err.message || String(err))
    });
  }
}
