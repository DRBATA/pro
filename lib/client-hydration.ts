"use client"

// Client-side wrapper for server actions
import { User } from './types/database.types'

// Wrapper for getUserHydrationGap server action
export async function getClientHydrationGap(userId: string) {
  try {
    const response = await fetch(`/api/hydration/gap?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch hydration data');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error getting hydration gap:', error);
    throw error;
  }
}

// Wrapper for updateUserProfile server action
export async function updateClientProfile(
  userId: string,
  userData: Partial<User>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userData
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }
}
