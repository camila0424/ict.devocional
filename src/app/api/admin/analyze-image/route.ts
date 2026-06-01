import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: 'GROQ_API_KEY no configurada en el servidor' },
      { status: 500, headers: CORS },
    );
  }

  const { imageBase64, mimeType } = await req.json();
  if (!imageBase64) {
    return NextResponse.json({ error: 'imageBase64 requerido' }, { status: 400, headers: CORS });
  }

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  let response;
  try {
    response = await client.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: `Eres un extractor de datos de planes devocionales de la iglesia ICT.

Analiza esta imagen del plan devocional mensual y extrae TODOS los días con sus 3 lecturas.

Responde SOLO con JSON válido, sin texto adicional ni backticks:
{
  "month": "Mayo",
  "month_num": 5,
  "year": 2026,
  "days": [
    { "day": 1, "reading_1": "He 14", "reading_2": "Jos 22", "reading_3": "Job 31" }
  ]
}

Usa las abreviaturas exactas de la imagen. Extrae TODOS los días.`,
            },
          ],
        },
      ],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al llamar a la API de Groq';
    return NextResponse.json({ error: message }, { status: 502, headers: CORS });
  }

  const rawText = response.choices[0]?.message?.content?.trim() ?? '';
  const cleaned = rawText.replace(/```json|```/g, '').trim();

  try {
    const data = JSON.parse(cleaned);
    return NextResponse.json(data, { headers: CORS });
  } catch {
    return NextResponse.json(
      { error: 'No se pudo parsear la respuesta de Groq', raw: rawText },
      { status: 422, headers: CORS },
    );
  }
}
