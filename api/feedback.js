/**
 * ご意見・ご要望および不具合・バグ報告を Discord Webhook へ転送する Vercel Serverless Function。
 * 環境変数 DISCORD_FEEDBACK_WEBHOOK_URL または DISCORD_WEBHOOK_URL を使用します。
 */

const MAX_MESSAGE_LENGTH = 2000;
const MIN_MESSAGE_LENGTH = 5;
const MAX_CATEGORY_LENGTH = 50;
const MAX_ENV_LENGTH = 500;

/**
 * リクエストボディを安全にオブジェクトへパースします。
 * @param {unknown} body リクエストボディ
 * @returns {Record<string, unknown>} パース済みオブジェクト
 */
function parseRequestBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof body === 'object' ? body : {};
}

/**
 * テキストをトリムし、指定文字数で切り詰めます。
 * @param {unknown} value 入力値
 * @param {number} maxLength 最大文字数
 * @returns {string} サニタイズ済み文字列
 */
function sanitizeText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

/**
 * API エンドポイントハンドラ
 * @param {import('http').IncomingMessage & { method?: string, body?: unknown }} req
 * @param {import('http').ServerResponse & { status?: (code: number) => any, json?: (data: unknown) => void }} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: '許可されていないメソッドです。' });
  }

  const webhookUrl =
    process.env.DISCORD_FEEDBACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('Discord Webhook URL が環境変数に設定されていません。');
    return res.status(500).json({
      error: 'サーバー側の通知設定が完了していません。しばらくしてからお試しください。',
    });
  }

  const body = parseRequestBody(req.body);

  // スパム対策用ハニーポット：入力がある場合はボットとみなして送信せず成功レスポンスを返す
  if (typeof body.website === 'string' && body.website.trim().length > 0) {
    return res.status(200).json({ ok: true });
  }

  const type = body.type === 'bug' ? 'bug' : body.type === 'feedback' ? 'feedback' : null;
  if (!type) {
    return res.status(400).json({ error: '送信種別が不正です。' });
  }

  const message = sanitizeText(body.message, MAX_MESSAGE_LENGTH);
  if (message.length < MIN_MESSAGE_LENGTH) {
    return res.status(400).json({
      error: `内容は${MIN_MESSAGE_LENGTH}文字以上で入力してください。`,
    });
  }

  const category = sanitizeText(body.category, MAX_CATEGORY_LENGTH) || '未選択';
  const environment =
    type === 'bug' ? sanitizeText(body.environment, MAX_ENV_LENGTH) : '';

  const isBug = type === 'bug';
  const fields = [
    {
      name: 'カテゴリ',
      value: category,
      inline: true,
    },
    {
      name: '送信日時 (JST)',
      value: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
      inline: true,
    },
  ];

  if (environment) {
    fields.push({
      name: '環境情報',
      value: `\`\`\`\n${environment}\n\`\`\``,
      inline: false,
    });
  }

  const payload = {
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: isBug
          ? '🐛 不具合・バグ報告が届きました'
          : '💬 ご意見・ご要望が届きました',
        color: isBug ? 0xf43f5e : 0x10b981,
        description: message,
        fields,
        footer: {
          text: 'プロセカ レコードチェッカー',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!discordRes.ok) {
      const errorText = await discordRes.text().catch(() => '');
      console.error('Discord Webhook 送信エラー:', discordRes.status, errorText);
      return res.status(502).json({
        error: '送信処理に失敗しました。時間をおいて再度お試しください。',
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Discord Webhook 通信例外:', err);
    return res.status(502).json({
      error: '通信エラーが発生しました。時間をおいて再度お試しください。',
    });
  }
}

