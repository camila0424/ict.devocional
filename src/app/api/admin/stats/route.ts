import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      streak: {
        select: { current: true, best: true, lastCompletedAt: true, updatedAt: true },
      },
      _count: { select: { progress: { where: { completed: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const data = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    registeredAt: u.createdAt,
    streak: u.streak
      ? {
          current: u.streak.current,
          best: u.streak.best,
          lastCompletedAt: u.streak.lastCompletedAt,
          updatedAt: u.streak.updatedAt,
        }
      : null,
    totalCompletions: u._count.progress,
  }));

  return NextResponse.json({ success: true, total: data.length, users: data }, { headers: CORS });
}
