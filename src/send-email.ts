import { APIGatewayProxyHandler } from 'aws-lambda';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { z } from 'zod';

const ses = new SESv2Client({});

const Schema = z.object({
  email: z.string().email(),
  name: z.string(),
  message: z.string(),
});

export const handler: APIGatewayProxyHandler = async event => {
  console.log('event', event);

  try {
    const body = JSON.parse(event.body ?? '{}');
    const { email, name, message } = Schema.parse(body);

    const command = new SendEmailCommand({
      Content: {
        Simple: {
          Body: {
            Text: {
              Data: message,
            },
          },
          Subject: {
            Data: `New message from ${name}`,
          },
        },
      },
      Destination: {
        ToAddresses: [email],
      },
      FromEmailAddress: 'nasrullah01n@gmail.com',
    });

    const result = await ses.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Email sent successfully',
        result,
      }),
    };
  } catch (e) {
    console.error(e);

    if (e instanceof z.ZodError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Bad request',
          errors: e.issues,
        }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
      }),
    };
  }
};
