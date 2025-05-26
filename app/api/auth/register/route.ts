import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/database-functions.server';

export async function POST(request: Request) {
  try {
    const {
      email,
      password,
      name,
      nickname,
      weight,
      sex,
      bodyType,
      phoneNumber,
      contactPreference
    } = await request.json();

    const { user, error } = await registerUser(
      email,
      password,
      name,
      nickname,
      weight,
      sex,
      bodyType,
      phoneNumber,
      contactPreference
    );

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
