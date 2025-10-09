import { supabase } from '@/supabase/client';

// Username validation rules (client-side format validation only)
export const USERNAME_RULES = {
  minLength: 3,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9_]+$/, // Only alphanumeric and underscore
  reservedWords: ['admin', 'root', 'user', 'test', 'api', 'www', 'mail', 'ftp', 'support', 'help']
};

export interface UsernameValidationResult {
  isValid: boolean;
  error?: string;
}

export interface UserByUsernameResult {
  user_id: string | null;
  username: string | null;
  user_exists: boolean;
}

/**
 * Client-side username format validation only
 * This is safe to run on the client as it only validates format
 */
export function validateUsernameFormat(username: string): UsernameValidationResult {
  // Check length
  if (username.length < USERNAME_RULES.minLength) {
    return {
      isValid: false,
      error: `Username must be at least ${USERNAME_RULES.minLength} characters long`
    };
  }

  if (username.length > USERNAME_RULES.maxLength) {
    return {
      isValid: false,
      error: `Username must be no more than ${USERNAME_RULES.maxLength} characters long`
    };
  }

  // Check pattern
  if (!USERNAME_RULES.pattern.test(username)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, and underscores'
    };
  }

  // Check reserved words
  if (USERNAME_RULES.reservedWords.includes(username.toLowerCase())) {
    return {
      isValid: false,
      error: 'This username is reserved and cannot be used'
    };
  }

  return { isValid: true };
}

/**
 * SECURE: Check username availability using RPC function
 * This calls a server-side RPC function that handles the database query securely
 */
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_username_availability', {
      username_to_check: username
    });

    if (error) {
      console.error('Error checking username:', error);
      return false; // Assume not available on error to be safe
    }

    return data || false;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false; // Assume not available on error to be safe
  }
}

/**
 * SECURE: Comprehensive username validation using RPC function
 */
export async function validateUsername(username: string): Promise<UsernameValidationResult> {
  // First check format (client-side, safe)
  const formatValidation = validateUsernameFormat(username);
  if (!formatValidation.isValid) {
    return formatValidation;
  }

  // Then check availability (server-side RPC, secure)
  const isAvailable = await checkUsernameAvailability(username);
  if (!isAvailable) {
    return {
      isValid: false,
      error: 'This username is already taken'
    };
  }

  return { isValid: true };
}

/**
 * Determines if input is email or username for login
 */
export function isEmail(input: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(input);
}

/**
 * SECURE: Get user by username using RPC function
 */
export async function getUserByUsername(username: string): Promise<UserByUsernameResult | null> {
  try {
    const { data, error } = await supabase.rpc('get_user_by_username', {
      username_input: username
    });

    if (error) {
      console.error('Error getting user by username:', error);
      return null;
    }

    // The RPC function returns an array, get the first result
    const result = Array.isArray(data) ? data[0] : data;
    
    if (!result) {
      return null;
    }

    return result;
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
}

/**
 * SECURE: Login with username and password using Edge Function
 */
export async function loginWithUsername(
  username: string,
  password: string,
  captchaToken: string
): Promise<{ user: any; session: any } | null> {
  try {
    const { data, error } = await supabase.functions.invoke('username-login', {
      body: { 
        username, 
        password, 
        captchaToken 
      }
    });

    if (error) {
      console.error('Error logging in with username:', error);
      return null;
    }

    if (data?.success && data?.user && data?.session) {
      return {
        user: data.user,
        session: data.session
      };
    }

    return null;
  } catch (error) {
    console.error('Error logging in with username:', error);
    return null;
  }
}

/**
 * SECURE: Create admin record with username using RPC function
 */
export async function createAdminWithUsername(
  adminId: string, 
  adminName: string, 
  adminUsername: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('create_admin_with_username', {
      admin_id: adminId,
      admin_name: adminName,
      admin_username: adminUsername
    });

    if (error) {
      console.error('Error creating admin with username:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error creating admin with username:', error);
    return false;
  }
}
