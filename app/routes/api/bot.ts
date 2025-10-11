import type {
  ClientConfig,
  messagingApi,
  WebhookEvent,
  WebhookRequestBody,
} from '@line/bot-sdk';
import { env } from 'hono/adapter';
import { createRoute } from 'honox/factory';
import { getDeltaOfTime } from '@/lib/utils';
import type { SearchTransitRoutesResult } from '@/types/location';

// Event handler function
const handleEvent = async (
  event: WebhookEvent,
  client: messagingApi.MessagingApiClient,
  recipientId: string,
  webUiUrl: string,
) => {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  let route: SearchTransitRoutesResult;
  const quickReplyObject: messagingApi.QuickReply = {
    items: [
      {
        type: 'action',
        action: {
          type: 'uri',
          uri: webUiUrl,
          label: '検索画面を開く',
        },
      },
    ],
  };

  try {
    route = JSON.parse(event.message.text);
  } catch (e) {
    // Not a valid JSON or other error, treat as a normal message or ignore
    console.log('Not a route data JSON, treating as normal text.');
    console.warn(e);
    // Echo back for non-JSON messages
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: 'text',
          text: '経路情報を送信してください。',
          quickReply: quickReplyObject,
        },
      ],
    });
  }

  try {
    // 1. Format and send the push message
    let pushMessageText = `りか様

以下、りゅーと様からご伝言です

${route.to + route.arrivalTime}見込み

* ${route.from + route.departureTime}発
  乗換${route.transferCount}回${route.platformData.length ? `\n  ${route.platformData[0].lineName}` : ''}`;
    if (route.hasDelay) {
      pushMessageText += '\n▲▽遅延情報あり▽▲';
    }
    const pushMessage = {
      type: 'text' as const,
      text: pushMessageText,
    };
    await client.pushMessage({ to: recipientId, messages: [pushMessage] });
  } catch (e) {
    console.warn('pushing error');
    console.error(e);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: 'text',
          text: '送信に失敗しました。',
          quickReply: quickReplyObject,
        },
      ],
    });
  }

  try {
    // 2. Format and send the reply message to the sender
    let replyMessageText = `以下の内容で送信しました。
-----
${route.from + route.departureTime}発${route.platformData.length ? ` (${route.platformData[0].lineName})` : ''}
${route.to + route.arrivalTime}着 見込み`;
    if (route.hasDelay) {
      replyMessageText += '\n▲▽遅延情報あり▽▲';
    }
    replyMessageText += '\n*********';
    if (route.transferCount > 0) {
      route.platformData.forEach(({ lineName }, i) => {
        if (i === route.platformData.length - 1) {
          // 最終駅
          return;
        }
        const sectionValue = route.sectionData[i];
        const changeTime = getDeltaOfTime(
          sectionValue?.onTimeOnChange,
          sectionValue?.offTimeOfChange,
        ) as number;
        replyMessageText += `
 -${sectionValue?.station}(${lineName})
  ${sectionValue?.onTimeOnChange}発(${route.platformData[i + 1].onLine ?? '-'}番線 ${changeTime}分乗換)`;
      });
    }
    const replyMessage: messagingApi.Message = {
      type: 'text' as const,
      text: replyMessageText,
      quickReply: quickReplyObject,
    };
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [replyMessage],
    });
  } catch (e) {
    console.warn('replying error');
    console.error(e);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: 'text',
          text: '送信に失敗しました。',
          quickReply: quickReplyObject,
        },
      ],
    });
  }
};

export const POST = createRoute(async (c) => {
  const {
    LINE_CHANNEL_ACCESS_TOKEN,
    LINE_CHANNEL_SECRET,
    RECIPIENT_USER_ID,
    WEB_UI_URL,
  } = env<{
    LINE_CHANNEL_ACCESS_TOKEN: string;
    LINE_CHANNEL_SECRET: string;
    RECIPIENT_USER_ID: string;
    WEB_UI_URL: string;
  }>(c);
  const { messagingApi, LINE_SIGNATURE_HTTP_HEADER_NAME, validateSignature } =
    await import('@line/bot-sdk');

  const clientConfig: ClientConfig = {
    channelAccessToken: LINE_CHANNEL_ACCESS_TOKEN || '',
  };

  const client = new messagingApi.MessagingApiClient(clientConfig);

  const body = await c.req.text();
  const signature = c.req.header(LINE_SIGNATURE_HTTP_HEADER_NAME);

  if (!signature) {
    if (body === '{}') {
      return c.json({ status: 'success' });
    }
    return c.json({ error: 'No signature header' }, 400);
  }

  if (!validateSignature(body, LINE_CHANNEL_SECRET, signature)) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  const webhookBody: WebhookRequestBody = JSON.parse(body);

  try {
    await Promise.all(
      webhookBody.events.map(async (event) => {
        if (event?.source?.userId) {
          const destination = await c.env.TRAIN_LINE.get<string>(
            `user:${event.source.userId}:destination`,
          );
          await handleEvent(
            event,
            client,
            destination || RECIPIENT_USER_ID,
            WEB_UI_URL,
          );
        }
      }),
    );
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Internal Server Error' }, 500);
  }

  return c.json({ status: 'success' });
});
