import { WatchlistDetail } from "@/components/watchlist-detail";

export default async function WatchlistDetailPage({ params }: PageProps<"/watchlists/[id]">) {
  const { id } = await params;
  return <WatchlistDetail key={id} id={id} />;
}
