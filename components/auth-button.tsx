"use client";

import {
  CheckCircleIcon,
  CurrencyDollarIcon,
  LinkBreakIcon,
  SignOutIcon,
  SpinnerIcon,
  WalletIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLinkedWallet,
  linkWallet,
  unlinkWallet,
} from "@/app/actions/wallet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { signIn, signOut, useSession } from "@/lib/auth-client";

function createSignMessage(nonce: string, publicKey: string): string {
  return `Sign this message to verify your wallet ownership.\n\nWallet: ${publicKey}\nNonce: ${nonce}\nApp: Parity`;
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function shortAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function formatSol(sol: number): string {
  if (sol >= 1000) {
    return `${(sol / 1000).toFixed(1)}k`;
  }
  if (sol >= 1) {
    return sol.toFixed(2);
  }
  if (sol >= 0.01) {
    return sol.toFixed(3);
  }
  return sol.toFixed(4);
}

function WalletSection({
  walletAddress,
  connectedAddress,
  balance,
  linkMutation,
  unlinkMutation,
  onConnect,
}: {
  walletAddress: string | null;
  connectedAddress: string | null;
  balance: { sol: number } | null | undefined;
  linkMutation: { isPending: boolean; mutate: () => void };
  unlinkMutation: { isPending: boolean; mutate: () => void };
  onConnect: () => void;
}) {
  if (walletAddress) {
    return (
      <div className="flex items-center gap-3 bg-primary/5 p-3">
        <div className="flex size-9 shrink-0 items-center justify-center bg-primary/10">
          <CheckCircleIcon className="size-5 text-primary" weight="fill" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm">{shortAddress(walletAddress)}</p>
          {balance?.sol !== undefined && (
            <p className="flex items-center gap-1 text-muted-foreground text-xs">
              <CurrencyDollarIcon className="size-3" />
              {formatSol(balance.sol)} SOL
            </p>
          )}
        </div>
        <button
          className="flex size-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          disabled={unlinkMutation.isPending}
          onClick={() => unlinkMutation.mutate()}
          title="Unlink wallet"
          type="button"
        >
          {unlinkMutation.isPending ? (
            <SpinnerIcon className="size-4 animate-spin" />
          ) : (
            <LinkBreakIcon className="size-4" />
          )}
        </button>
      </div>
    );
  }

  if (connectedAddress) {
    return (
      <button
        className="flex w-full cursor-pointer items-center gap-3 bg-muted/50 p-3 text-left transition-colors hover:bg-muted disabled:opacity-50"
        disabled={linkMutation.isPending}
        onClick={() => linkMutation.mutate()}
        type="button"
      >
        <div className="flex size-9 shrink-0 items-center justify-center bg-primary/10">
          <WalletIcon className="size-5 text-primary" weight="duotone" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm">{shortAddress(connectedAddress)}</p>
          <p className="text-primary text-xs">
            {linkMutation.isPending
              ? "Confirm in wallet..."
              : "Click to verify"}
          </p>
        </div>
      </button>
    );
  }

  return (
    <button
      className="flex w-full cursor-pointer items-center gap-3 bg-muted/50 p-3 text-left transition-colors hover:bg-muted"
      onClick={onConnect}
      type="button"
    >
      <div className="flex size-9 shrink-0 items-center justify-center bg-muted">
        <WalletIcon className="size-5 text-muted-foreground" weight="duotone" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm">Connect wallet</p>
        <p className="text-muted-foreground text-xs">Link your Solana wallet</p>
      </div>
    </button>
  );
}

export function AuthButton() {
  const queryClient = useQueryClient();
  const { data: session, isPending } = useSession();
  const { publicKey, disconnect, signMessage } = useWallet();
  const { setVisible } = useWalletModal();
  const { data: balance } = useWalletBalance();

  const { data: linkedWallet, isLoading } = useQuery({
    queryKey: ["linkedWallet", session?.user?.id],
    queryFn: getLinkedWallet,
    enabled: !!session?.user,
  });

  const invalidateWallet = () =>
    queryClient.invalidateQueries({ queryKey: ["linkedWallet"] });

  const linkMutation = useMutation({
    mutationFn: async () => {
      if (!(publicKey && signMessage)) {
        throw new Error("Wallet not connected");
      }
      const nonce = crypto.randomUUID();
      const pubkey = publicKey.toBase58();
      const message = createSignMessage(nonce, pubkey);
      const sig = await signMessage(new TextEncoder().encode(message));
      const result = await linkWallet(pubkey, bytesToBase64(sig), nonce);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to link");
      }
      return result;
    },
    onSuccess: invalidateWallet,
  });

  const unlinkMutation = useMutation({
    mutationFn: async () => {
      const result = await unlinkWallet();
      if (!result.success) {
        throw new Error(result.error ?? "Failed to unlink");
      }
      return result;
    },
    onSuccess: invalidateWallet,
  });

  // Loading state
  if (isPending || isLoading) {
    return (
      <div className="flex h-11 w-full items-center justify-center bg-muted/50">
        <SpinnerIcon className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Signed out state
  if (!session?.user) {
    return (
      <div className="space-y-3">
        <div className="px-1">
          <p className="text-muted-foreground text-xs">
            Sign in to create launches and track your portfolio
          </p>
        </div>
        <button
          className="flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-zinc-900 text-white shadow-lg ring-1 ring-white/10 transition-all duration-200 hover:bg-zinc-800 hover:ring-white/20 active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:ring-black/5 dark:hover:bg-zinc-100"
          onClick={() => signIn.social({ provider: "twitter" })}
          type="button"
        >
          <XLogoIcon className="size-4" weight="fill" />
          <span className="font-semibold text-sm tracking-tight">
            Continue with X
          </span>
        </button>
      </div>
    );
  }

  // Signed in state
  const user = session.user;
  const walletAddress = linkedWallet ?? null;
  const connectedAddress = publicKey?.toBase58() ?? null;
  const error = linkMutation.error || unlinkMutation.error;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex h-11 w-full cursor-pointer items-center gap-3 bg-muted/50 px-3 transition-colors hover:bg-muted"
          type="button"
        >
          <Avatar className="size-7 ring-2 ring-background">
            <AvatarImage alt={user.name ?? ""} src={user.image ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {user.name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <span className="max-w-full truncate text-sm">{user.name}</span>
            {walletAddress ? (
              <span className="font-mono text-[11px] text-primary">
                {shortAddress(walletAddress)}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                No wallet linked
              </span>
            )}
          </div>
          {walletAddress && balance?.sol !== undefined && (
            <span className="font-mono text-muted-foreground text-xs">
              {formatSol(balance.sol)}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-72 p-0"
        side="top"
        sideOffset={8}
      >
        {/* User info */}
        <div className="flex items-center gap-3 p-4">
          <Avatar className="size-10">
            <AvatarImage alt={user.name ?? ""} src={user.image ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {user.name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm">{user.name}</p>
            <p className="text-muted-foreground text-xs">via X</p>
          </div>
        </div>

        {/* Wallet section */}
        <div className="border-border border-t p-3">
          <WalletSection
            balance={balance}
            connectedAddress={connectedAddress}
            linkMutation={linkMutation}
            onConnect={() => setVisible(true)}
            unlinkMutation={unlinkMutation}
            walletAddress={walletAddress}
          />
          {error && (
            <p className="mt-2 text-destructive text-xs">{error.message}</p>
          )}
        </div>

        {/* Sign out */}
        <div className="border-border border-t">
          <button
            className="flex w-full cursor-pointer items-center gap-3 p-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => {
              disconnect();
              signOut();
            }}
            type="button"
          >
            <SignOutIcon className="size-4" />
            <span className="text-sm">Sign out</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
