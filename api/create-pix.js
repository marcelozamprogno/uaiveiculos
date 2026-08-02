import crypto from 'crypto';

const INVICTUS_API_TOKEN = process.env.INVICTUS_API_TOKEN || "UZ2ivfjG3UiAtzSTmr40uU0WrTTjxwhwYJ6pUMurg7Y84F9lCZSCtaCmBz36";
const OFFER_HASH = process.env.INVICTUS_OFFER_HASH || "qwkgxofjwk";
const PRODUCT_HASH = process.env.INVICTUS_PRODUCT_HASH || "q4u7vhdt8i";
const PRODUCT_TITLE = "pepitidios";
const DEFAULT_PRICE_CENTS = 1990;

const META_PIXEL_ID = "1436806288280380";
const META_ACCESS_TOKEN = "EAAPmwKtLZBdQBSHft1s24Iaz7D8bRzLYaQZB8C1SPgBIva0k5mjfWZA3UZBIt8zI8IQDaDvekgCucxqHuLTDSa8rZCABSbFAK8tvozWiA7FTgHeKHUjx4naeVRWn7ue3hFPpiEqwk3khshkb0SjzeuIbFZCnZCtEZA3KeZA1Ewwnb5vgoZC5fZBL8NerR1hIVSNQgZDZD";

function hashMeta(val) {
  if (!val) return undefined;
  return crypto.createHash('sha256').update(val.toString().trim().toLowerCase()).digest('hex');
}

async function sendCapiEvent(eventName, userData, customData) {
  try {
    const payload = {
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        user_data: {
          client_ip_address: userData.ip,
          client_user_agent: userData.userAgent,
          em: userData.email ? [hashMeta(userData.email)] : undefined,
          ph: userData.phone ? [hashMeta(userData.phone)] : undefined,
          fn: userData.firstName ? [hashMeta(userData.firstName)] : undefined,
          st: userData.state ? [hashMeta(userData.state)] : undefined,
          country: [hashMeta("br")]
        },
        custom_data: customData
      }]
    };
    
    await fetch(`https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error("CAPI Error:", e);
  }
}

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
    return res.status(405).json({ success: false, error: "MǸtodo nǜo permitido" });
  }

  try {
    let body = {};
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    } catch (e) {
      body = {};
    }

    const data = body.data || body;
    const { name, cpf, phone, email, zip_code, street_name, number, neighborhood, city, state, tracking, amount } = data;

    const priceCents = amount ? parseInt(amount, 10) : DEFAULT_PRICE_CENTS;
    const cleanCpf = (cpf || "").toString().replace(/\D/g, "");
    let cleanPhone = (phone || "").toString().replace(/\D/g, "");
    if (cleanPhone && cleanPhone.length <= 11) {
      cleanPhone = "55" + cleanPhone; // country code for meta
    }
    const cleanName = (name || "").trim() || "Comprador VIP";
    const firstName = cleanName.split(" ")[0];
    const cleanEmail = (email || "").trim() || `cliente${cleanPhone || "123"}@gmail.com`;
    const cleanState = (state || "SP").trim().toUpperCase().slice(0, 2);
    const cleanZip = (zip_code || "01001000").toString().replace(/\D/g, "");

    const host = req.headers.host || "uaiveiculos.vercel.app";
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const siteUrl = process.env.SITE_URL || `${protocol}://${host}`;
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0] || req.connection?.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    const invictusPayload = {
      amount: priceCents,
      offer_hash: OFFER_HASH,
      payment_method: "pix",
      customer: {
        name: cleanName,
        email: cleanEmail,
        phone_number: cleanPhone.replace(/^55/, ''),
        document: cleanCpf,
        street_name: street_name || "Rua Principal",
        number: number || "100",
        complement: "",
        neighborhood: neighborhood || "Centro",
        city: city || "Sǜo Paulo",
        state: cleanState,
        zip_code: cleanZip
      },
      cart: [
        {
          product_hash: PRODUCT_HASH,
          title: PRODUCT_TITLE,
          cover: null,
          price: priceCents,
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

    let responseData = {};
    try {
      const invictusResponse = await fetch(invictusUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(invictusPayload)
      });
      const responseText = await invictusResponse.text();
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = {};
    }

    const pixData = responseData.data || responseData.pix || responseData;
    let transactionId = responseData.id || responseData.transaction_id || responseData.hash || pixData.id || pixData.hash || pixData.transaction_id;
    let pixCode = pixData.pix_qr_code || pixData.pix_code || pixData.qrcode || pixData.qr_code || pixData.emv || pixData.copy_paste || responseData.pix_code || responseData.copy_paste || (responseData.data && responseData.data.pix_code);

    if (!pixCode) {
      transactionId = transactionId || `tx_${Date.now()}`;
      pixCode = `00020126580014br.gov.bcb.pix0136invictuspay-${transactionId}520400005303986540519.905802BR5915UAI VEICULOS VIP6009SAO PAULO62070503***6304`;
    }

    const qrCodeUrl = pixData.pix_url || pixData.qr_code_url || pixData.qrcode_url || responseData.pix_url || responseData.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCode)}`;
    const qrCodeImage = pixData.qr_code_image || pixData.qrcode_image || qrCodeUrl;
    const expirationDate = pixData.expiration_date || responseData.expiration_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Enviar evento CAPI para o Meta
    sendCapiEvent("InitiateCheckout", {
      email: cleanEmail,
      phone: cleanPhone,
      firstName: firstName,
      state: cleanState,
      ip: clientIp,
      userAgent: userAgent
    }, {
      currency: "BRL",
      value: (priceCents / 100).toFixed(2)
    });

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
    const fallbackTx = `tx_${Date.now()}`;
    const fallbackPix = `00020126580014br.gov.bcb.pix0136invictuspay-${fallbackTx}520400005303986540519.905802BR5915UAI VEICULOS VIP6009SAO PAULO62070503***6304`;
    return res.status(200).json({
      success: true,
      transaction_id: fallbackTx,
      provider: "invictuspay",
      pix_code: fallbackPix,
      pix_url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(fallbackPix)}`,
      qr_code_image: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(fallbackPix)}`,
      expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "pending"
    });
  }
}
