# Parity

A token launch platform built on Solana using Meteora Dynamic Bonding Curves.

## Features

- Token launches with bonding curve pricing
- Fixed, transparent fee distribution
- Twitter authentication
- Solana wallet linking
- Charity donation enforcement

## Fee Distribution

Fees are fixed and enforced on-chain:

| Recipient | Share |
| --------- | ----- |
| Platform  | 15%   |
| Meteora   | 30%   |
| Creator   | 25%   |
| Charity   | 30%   |

## Tech Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- Drizzle ORM with PostgreSQL
- better-auth for authentication
- oRPC for type-safe API routes
- Solana Web3.js
- Meteora DBC SDK

## Setup

### Prerequisites

- Bun
- PostgreSQL database
- Twitter OAuth credentials (for auth)
- Solana RPC endpoint

### Environment Variables

Create a `.env` file:

```
DATABASE_URL=postgres://...
BETTER_AUTH_SECRET=...
TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...
RPC_URL=...
```

### Install Dependencies

```bash
bun install
```

### Database

```bash
bun db:push
```

### Development

```bash
bun dev
```

### Production

```bash
bun build
bun start
```

## Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `bun dev`         | Start development server       |
| `bun build`       | Build for production           |
| `bun start`       | Start production server        |
| `bun lint`        | Check code with Biome          |
| `bun format`      | Format code with Biome         |
| `bun db:generate` | Generate Drizzle migrations    |
| `bun db:migrate`  | Run Drizzle migrations         |
| `bun db:push`     | Push schema to database        |
| `bun db:studio`   | Open Drizzle Studio            |

## Authority Wallet

The platform requires an authority wallet for creating pools. Generate one with:

```bash
solana-keygen new --outfile authority.json
```

Fund it with SOL for transaction fees.

## License

MIT
