import { createClerkClient, verifyToken } from "@clerk/backend";
import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  email: string | null;
  walletAddress: string | null;
}

export const auth = authHandler<AuthParams, AuthData>(async (data) => {
  const token = data.authorization?.replace("Bearer ", "");
  if (!token) {
    throw APIError.unauthenticated("missing token");
  }

  try {
    const verifiedToken = await verifyToken(token, {
      secretKey: clerkSecretKey(),
    });

    const user = await clerkClient.users.getUser(verifiedToken.sub);
    
    // Get MetaMask wallet address from Web3 wallets
    // Clerk stores Web3 wallets in user.web3Wallets array
    // Each wallet has a web3Wallet property containing the address
    const walletAddress = user.web3Wallets?.[0]?.web3Wallet ?? null;
    
    return {
      userID: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? null,
      walletAddress: walletAddress,
    };
  } catch (err) {
    throw APIError.unauthenticated("invalid token", err as Error);
  }
});

export const gw = new Gateway({ authHandler: auth });
