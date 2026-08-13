export async function fundTestnetAccount(address: string): Promise<void> {
  const res = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(address)}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || "Friendbot could not fund this account.");
  }
}
