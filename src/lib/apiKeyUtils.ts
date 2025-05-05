import { QueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

/**
 * Generates a new API key for the given user and updates the account.
 * Invalidates the accountInfo query on success.
 * 
 * @param userId The ID of the user.
 * @param queryClient The React Query client instance.
 * @param onSuccess Optional callback to run on successful generation.
 */
export const generateApiKeyUtil = async (
  userId: string, 
  queryClient: QueryClient, 
  onSuccess?: () => void
): Promise<void> => {
  try {
    const newApiKey = crypto.randomUUID();
    
    const response = await fetch('/api/account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId: userId,
        api_key: newApiKey
      }),
    });

    if (!response.ok) throw new Error('Failed to generate API key via util');
    
    toast.success('API key generated successfully');
    queryClient.invalidateQueries({ queryKey: ['accountInfo', userId] });
    onSuccess?.(); // Call the original onSuccess if provided
  } catch (error) {
    console.error('Error generating API key via util:', error);
    // Re-throw the error so the caller can handle it if needed
    // Or display a more specific toast message here if preferred
    throw error; // Re-throwing allows startFreeTrial to catch it
  }
}; 