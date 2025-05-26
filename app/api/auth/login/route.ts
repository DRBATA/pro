import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/database-functions.server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const { user, isStaff, error } = await loginUser(email, password);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ user, isStaff });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
