const MAX_BODY_SIZE = 32 * 1024;
const CONTACT_EMAIL_TO = process.env.CONTACT_EMAIL_TO || 'info@sigaanimal.com';
const CONTACT_EMAIL_FROM = process.env.CONTACT_EMAIL_FROM || 'SIGA <info@sigaanimal.com>';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitize(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function readRequestBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body);
  }

  return new Promise((resolve, reject) => {
    let rawBody = '';

    req.on('data', (chunk) => {
      rawBody += chunk;

      if (rawBody.length > MAX_BODY_SIZE) {
        reject(new Error('BODY_TOO_LARGE'));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        resolve(rawBody ? JSON.parse(rawBody) : {});
      } catch {
        reject(new Error('INVALID_JSON'));
      }
    });

    req.on('error', reject);
  });
}

function buildEmail({ name, email, subject, message }) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

  return {
    text: [
      `Nome: ${name}`,
      `Email: ${email}`,
      `Assunto: ${subject}`,
      '',
      'Mensagem:',
      message,
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; color: #252627; line-height: 1.6;">
        <h2 style="margin: 0 0 16px;">Nova mensagem recebida no SIGA</h2>
        <p><strong>Nome:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Assunto:</strong> ${safeSubject}</p>
        <hr style="border: 0; border-top: 1px solid #d9e4e8; margin: 20px 0;">
        <p>${safeMessage}</p>
      </div>
    `,
  };
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return sendJson(res, 405, { ok: false, message: 'Método não permitido.' });
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return sendJson(res, 500, {
      ok: false,
      message: 'O envio de emails ainda não está configurado.',
    });
  }

  try {
    const body = await readRequestBody(req);

    if (body.website) {
      return sendJson(res, 200, { ok: true });
    }

    const name = sanitize(body.name, 120);
    const email = sanitize(body.email, 160);
    const subject = sanitize(body.subject, 160);
    const message = sanitize(body.message, 4000);

    if (!name || !email || !subject || !message || !isValidEmail(email)) {
      return sendJson(res, 400, {
        ok: false,
        message: 'Preencha todos os campos com dados válidos.',
      });
    }

    const emailBody = buildEmail({ name, email, subject, message });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: CONTACT_EMAIL_FROM,
        to: [CONTACT_EMAIL_TO],
        reply_to: email,
        subject: `SIGA - ${subject}`,
        text: emailBody.text,
        html: emailBody.html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('Resend email error:', response.status, errorText);

      return sendJson(res, 502, {
        ok: false,
        message: 'Não foi possível enviar a mensagem. Tente novamente mais tarde.',
      });
    }

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'BODY_TOO_LARGE') {
      return sendJson(res, 413, {
        ok: false,
        message: 'A mensagem é demasiado grande.',
      });
    }

    if (error instanceof Error && error.message === 'INVALID_JSON') {
      return sendJson(res, 400, {
        ok: false,
        message: 'Pedido inválido.',
      });
    }

    console.error('Contact form error:', error);

    return sendJson(res, 500, {
      ok: false,
      message: 'Não foi possível enviar a mensagem. Tente novamente mais tarde.',
    });
  }
};
