import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { Parse, getBoundary } from 'parse-multipart';

const s3 = new S3Client({});
const bucket = process.env.BUCKET_NAME ?? '';

const extractFile = (event: APIGatewayProxyEvent) => {
  const boundary = getBoundary(event.headers['content-type'] ?? '');
  const body = Buffer.from(event.body ?? '', 'base64');
  const parts = Parse(body, boundary);

  return parts[0];
};

export const handler: APIGatewayProxyHandler = async event => {
  console.log(event);

  try {
    const { filename, data } = extractFile(event);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      ACL: 'public-read',
      Body: data,
    });

    const result = await s3.send(command);

    const url = `https://${bucket}.s3.amazonaws.com/${filename}`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Image uploaded successfully',
        url,
        result,
      }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
      }),
    };
  }
};
